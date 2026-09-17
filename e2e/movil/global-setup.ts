import { config as cargarEnv } from 'dotenv';
import { limpiar } from '../apoyo';
import { limpiarDemo } from './escenario';

/**
 * Barre lo que haya dejado una corrida cortada, de prueba y de demo.
 *
 * Antes se asegura de a qué base habla: estas corridas siembran y borran filas,
 * así que por defecto solo se permiten contra un Supabase local (Docker). Para
 * apuntar a otro proyecto hay que pedirlo explícitamente con
 * PERMITIR_SUPABASE_REMOTO=1.
 */
export default async function preparar(): Promise<void> {
  cargarEnv({ quiet: true });
  const url = process.env.SUPABASE_URL ?? '';
  const local = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(url);
  if (!local && process.env.PERMITIR_SUPABASE_REMOTO !== '1') {
    throw new Error(
      `SUPABASE_URL no es local (${new URL(url || 'http://sin-url').host}). ` +
        'Estas corridas escriben datos: usa el Supabase local o define PERMITIR_SUPABASE_REMOTO=1.'
    );
  }
  await limpiar();
  await limpiarDemo();
}
