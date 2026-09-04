import type { APIRoute } from 'astro';
import { coerce, validate } from '@/lib/validate';
import { AVISO_VERSION } from '@/config/site';
import { crearClienteServicio } from '@/lib/supabase/servicio';

export const prerender = false;

/**
 * Límite simple por IP en memoria. Se reinicia con cada arranque de la función,
 * lo cual es aceptable: solo busca frenar ráfagas, no ser un WAF.
 *
 * En memoria y no en la base a propósito: contarlo en Postgres exigiría guardar
 * la IP, que es dato personal y no hace falta para nada más.
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

/** Techo duro: si la base está lenta, que no arrastre a la paciente hasta el
 *  límite de la función de Vercel. */
const MS_INSERT = 5000;

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

  // Honeypot: si viene lleno es un bot. Respondemos 200 para no darle señal, y
  // no escribimos nada.
  const empresa = (raw as Record<string, unknown> | null)?.empresa;
  if (typeof empresa === 'string' && empresa.trim() !== '') {
    return json({ ok: true }, 200);
  }

  const form = coerce(raw);
  const errores = validate(form);
  if (Object.keys(errores).length > 0) {
    return json({ message: 'Revisa los datos del formulario.', errores }, 422);
  }

  // La base es la única salida: no hay aviso por correo. Si esto falla, la
  // solicitud se pierde, así que la paciente tiene que enterarse y reintentar.
  try {
    const { error } = await crearClienteServicio()
      .from('solicitudes')
      .insert({
        nombre: form.nombre,
        telefono: form.telefono,
        tratamiento: form.tratamiento,
        mensaje: form.mensaje,
        aviso_version: AVISO_VERSION,
      })
      .abortSignal(AbortSignal.timeout(MS_INSERT));
    if (error) throw new Error(error.message);
    return json({ ok: true }, 200);
  } catch (e) {
    // Nunca el contenido: el mensaje puede llevar datos de salud.
    console.error(
      '[contact] no se pudo guardar la solicitud:',
      e instanceof Error ? e.message : 'desconocido'
    );
    return json(
      { message: 'No pudimos registrar tu solicitud. Escríbenos por WhatsApp o inténtalo en un momento.' },
      502
    );
  }
};
