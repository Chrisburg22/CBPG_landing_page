import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { CRON_SECRET } from 'astro:env/server';
import { crearClienteServicio } from '@/lib/supabase/servicio';

export const prerender = false;

/** Comparación en tiempo constante. timingSafeEqual exige buffers del mismo largo. */
function coincide(recibido: string, esperado: string): boolean {
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * El plan gratuito de Supabase pausa el proyecto tras unos días sin actividad de
 * base de datos, y un proyecto pausado deja de guardar solicitudes. Vercel llama
 * a esto una vez al día (el mínimo que permite el plan Hobby) y hace varias
 * consultas baratas, porque una sola queda en el filo de lo que cuenta como uso.
 *
 * Vercel añade `Authorization: Bearer $CRON_SECRET` por su cuenta cuando la
 * variable existe en el proyecto.
 */
export const GET: APIRoute = async ({ request }) => {
  const cabecera = request.headers.get('authorization') ?? '';
  if (!CRON_SECRET || !coincide(cabecera, `Bearer ${CRON_SECRET}`)) {
    return new Response('No autorizado', { status: 401 });
  }

  try {
    const supabase = crearClienteServicio();
    const [total, muestra, nuevas] = await Promise.all([
      supabase.from('solicitudes').select('id', { count: 'exact', head: true }),
      supabase.from('solicitudes').select('id').limit(1),
      supabase.from('solicitudes').select('id', { count: 'exact', head: true }).eq('estado', 'nueva'),
    ]);

    const fallo = total.error ?? muestra.error ?? nuevas.error;
    if (fallo) throw new Error(fallo.message);

    return new Response(
      JSON.stringify({ ok: true, total: total.count ?? 0, nuevas: nuevas.count ?? 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[cron] keepalive falló:', e instanceof Error ? e.message : 'desconocido');
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
