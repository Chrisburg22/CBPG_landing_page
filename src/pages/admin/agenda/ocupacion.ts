import type { APIRoute } from 'astro';
import { listarDelDia } from '@/lib/citas';
import { partesEnMexico } from '@/lib/tiempo';

export const prerender = false;

/**
 * Los huecos ocupados de un día, para la franja de ocupación del formulario de
 * cita.
 *
 * GET y de solo lectura: no escribe nada, así que no le hace falta la defensa de
 * `checkOrigin`, que cubre formularios. Pasa por el middleware como el resto de
 * /admin, con la sesión y RLS de quien pregunta.
 *
 * Devuelve minutos desde medianoche en hora de México y nada más: ni nombres ni
 * teléfonos. La franja solo necesita saber qué está ocupado.
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const dia = url.searchParams.get('dia') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
    return new Response(JSON.stringify({ error: 'dia' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const citas = await listarDelDia(locals.supabase, dia);
    const ocupado = citas
      .filter((c) => c.estado !== 'cancelada')
      .map((c) => {
        const { hora, minuto } = partesEnMexico(new Date(c.inicia_en));
        const inicio = hora * 60 + minuto;
        return { id: c.id, inicio, fin: inicio + c.duracion_min };
      });
    return new Response(JSON.stringify({ ocupado }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
    });
  } catch (e) {
    console.error('[admin] ocupación:', e instanceof Error ? e.message : 'desconocido');
    return new Response(JSON.stringify({ error: 'carga' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};
