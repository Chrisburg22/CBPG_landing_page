import { config as cargarEnv } from 'dotenv';
import { limpiar } from './apoyo';

/**
 * Barre las filas que haya dejado una corrida interrumpida antes de empezar.
 * Sin esto, las pruebas que cuentan solicitudes en el panel arrastrarían basura
 * de ejecuciones anteriores y fallarían por un motivo que no es el suyo.
 */
export default async function preparar(): Promise<void> {
  cargarEnv();
  await limpiar();
}
