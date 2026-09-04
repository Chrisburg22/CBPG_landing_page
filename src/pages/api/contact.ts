import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import {
  CONTACT_FROM_EMAIL,
  CONTACT_TO_EMAIL,
  RESEND_API_KEY,
  SUPABASE_SECRET_KEY,
  SUPABASE_URL,
} from 'astro:env/server';
import { coerce, validate } from '@/lib/validate';
import { AVISO_VERSION, doctor } from '@/config/site';
import { crearClienteServicio } from '@/lib/supabase/servicio';

export const prerender = false;

/**
 * Límite simple por IP en memoria. Se reinicia con cada arranque de la función,
 * lo cual es aceptable: solo busca frenar ráfagas, no ser un WAF.
 *
 * Sigue en memoria y no en la base a propósito: contarlo en Postgres exigiría
 * guardar la IP, que es dato personal y no hace falta para nada más.
 */
const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 5;
const golpes = new Map<string, number[]>();

function excedeLimite(ip: string): boolean {
  const ahora = Date.now();
  const previos = (golpes.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  previos.push(ahora);
  golpes.set(ip, previos);
  if (golpes.size > 5000) golpes.clear(); // techo de memoria
  return previos.length > MAX_POR_VENTANA;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Techos duros: si Supabase está pausado o lento, que no arrastre a la paciente. */
const MS_INSERT = 4000;
const MS_MARCAR = 3000;

export const POST: APIRoute = async ({ request, clientAddress, url }) => {
  const ip = clientAddress || 'desconocida';

  if (excedeLimite(ip)) {
    return json({ message: 'Demasiadas solicitudes seguidas. Espera unos minutos.' }, 429);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ message: 'Solicitud mal formada.' }, 400);
  }

  // Honeypot: si viene lleno es un bot. Respondemos 200 para no darle señal, y
  // no escribimos nada: ni fila ni correo.
  const empresa = (raw as Record<string, unknown> | null)?.empresa;
  if (typeof empresa === 'string' && empresa.trim() !== '') {
    return json({ ok: true }, 200);
  }

  const form = coerce(raw);
  const errores = validate(form);
  if (Object.keys(errores).length > 0) {
    return json({ message: 'Revisa los datos del formulario.', errores }, 422);
  }

  const haySupabase = !!SUPABASE_URL && !!SUPABASE_SECRET_KEY;
  const hayResend = !!RESEND_API_KEY && !!CONTACT_FROM_EMAIL;

  // 503 solo si NO hay ninguna de las dos salidas. Si una funciona, la solicitud
  // no se pierde y la paciente no tiene por qué enterarse de nada.
  if (!haySupabase && !hayResend) {
    console.error('[contact] no hay ni base de datos ni correo configurados.');
    return json(
      { message: 'El envío no está configurado. Escríbenos por WhatsApp mientras lo resolvemos.' },
      503
    );
  }

  // ---- 1. Persistir. Va primero: así nada se pierde aunque el correo falle. ----
  let idSolicitud: string | null = null;
  if (haySupabase) {
    try {
      const { data, error } = await crearClienteServicio()
        .from('solicitudes')
        .insert({
          nombre: form.nombre,
          telefono: form.telefono,
          email: form.email,
          tratamiento: form.tratamiento,
          mensaje: form.mensaje,
          aviso_version: AVISO_VERSION,
        })
        .select('id')
        // abortSignal antes de single(): lo que single() devuelve ya no lo tiene.
        .abortSignal(AbortSignal.timeout(MS_INSERT))
        .single();
      if (error) throw new Error(error.message);
      idSolicitud = data.id;
    } catch (e) {
      // Nunca el contenido: el mensaje puede llevar datos de salud.
      console.error(
        '[contact] no se pudo guardar la solicitud:',
        e instanceof Error ? e.message : 'desconocido'
      );
    }
  }

  // ---- 2. Notificar ----
  let correoOk = false;
  let correoId: string | null = null;

  if (hayResend) {
    const destino = CONTACT_TO_EMAIL || doctor.email;
    const enlacePanel = idSolicitud
      ? new URL(`/admin/solicitudes/${idSolicitud}`, url.origin).toString()
      : null;

    const texto = [
      `Nombre:      ${form.nombre}`,
      `Teléfono:    ${form.telefono}`,
      `Correo:      ${form.email}`,
      `Tratamiento: ${form.tratamiento}`,
      '',
      'Mensaje:',
      form.mensaje || '(sin mensaje)',
      '',
      'Aceptó el aviso de privacidad: sí',
      `Recibido: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`,
      ...(enlacePanel ? ['', `Ver en el panel: ${enlacePanel}`] : []),
    ].join('\n');

    try {
      const { data, error } = await new Resend(RESEND_API_KEY).emails.send({
        from: CONTACT_FROM_EMAIL,
        to: [destino],
        replyTo: form.email,
        subject: `Nueva solicitud de cita — ${form.nombre}`,
        text: texto,
      });
      if (error) {
        console.error('[contact] Resend rechazó el envío:', error.name, error.message);
      } else {
        correoOk = true;
        correoId = data?.id ?? null;
      }
    } catch (e) {
      console.error(
        '[contact] error inesperado al enviar:',
        e instanceof Error ? e.message : 'desconocido'
      );
    }
  }

  // ---- 3. Cerrar el círculo. Mejor esfuerzo: la fila ya está a salvo. ----
  if (idSolicitud && correoOk) {
    try {
      await crearClienteServicio()
        .from('solicitudes')
        .update({ notificada: true, notificacion_id: correoId })
        .eq('id', idSolicitud)
        .abortSignal(AbortSignal.timeout(MS_MARCAR));
    } catch {
      // La solicitud está guardada; solo queda marcada como no notificada.
      // El panel lo señala, y es un error inofensivo comparado con perderla.
    }
  }

  // Con que UNA de las dos salidas haya funcionado, la solicitud existe en algún
  // sitio donde la doctora la va a ver. Solo hay error si fallaron las dos.
  if (idSolicitud || correoOk) return json({ ok: true }, 200);

  if (!idSolicitud) {
    console.error('[contact] SOLICITUD PERDIDA: fallaron base de datos y correo.');
  }
  return json({ message: 'No pudimos enviar tu solicitud. Inténtalo de nuevo en un momento.' }, 502);
};
