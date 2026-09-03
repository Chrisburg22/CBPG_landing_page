import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { coerce, validate } from '@/lib/validate';
import { doctor } from '@/config/site';

export const prerender = false;

/**
 * Límite simple por IP en memoria. Se reinicia con cada arranque de la función,
 * lo cual es aceptable: solo busca frenar ráfagas, no ser un WAF.
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

export const POST: APIRoute = async ({ request, clientAddress }) => {
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

  // Honeypot: si viene lleno es un bot. Respondemos 200 para no darle señal.
  const empresa = (raw as Record<string, unknown> | null)?.empresa;
  if (typeof empresa === 'string' && empresa.trim() !== '') {
    return json({ ok: true }, 200);
  }

  const form = coerce(raw);
  const errores = validate(form);
  if (Object.keys(errores).length > 0) {
    return json({ message: 'Revisa los datos del formulario.', errores }, 422);
  }

  const apiKey = import.meta.env.RESEND_API_KEY;
  const destino = import.meta.env.CONTACT_TO_EMAIL || doctor.email;
  const remitente = import.meta.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !remitente) {
    console.error('[contact] Falta RESEND_API_KEY o CONTACT_FROM_EMAIL en el entorno.');
    return json({ message: 'El envío no está configurado. Escríbenos por WhatsApp mientras lo resolvemos.' }, 503);
  }

  const resend = new Resend(apiKey);

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
  ].join('\n');

  try {
    const { error } = await resend.emails.send({
      from: remitente,
      to: [destino],
      replyTo: form.email,
      subject: `Nueva solicitud de cita — ${form.nombre}`,
      text: texto,
    });

    if (error) {
      // No registramos el cuerpo del mensaje: puede contener datos de salud.
      console.error('[contact] Resend rechazó el envío:', error.name, error.message);
      return json({ message: 'No pudimos enviar tu solicitud. Inténtalo de nuevo en un momento.' }, 502);
    }

    return json({ ok: true }, 200);
  } catch (e) {
    console.error('[contact] Error inesperado al enviar:', e instanceof Error ? e.message : 'desconocido');
    return json({ message: 'No pudimos enviar tu solicitud. Inténtalo de nuevo en un momento.' }, 502);
  }
};
