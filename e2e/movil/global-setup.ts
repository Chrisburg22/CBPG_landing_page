import { config as cargarEnv } from 'dotenv';
import { limpiar } from '../apoyo';
import { limpiarDemo } from './escenario';

/** Barre lo que haya dejado una corrida cortada, de prueba y de demo. */
export default async function preparar(): Promise<void> {
  cargarEnv({ quiet: true });
  await limpiar();
  await limpiarDemo();
}
