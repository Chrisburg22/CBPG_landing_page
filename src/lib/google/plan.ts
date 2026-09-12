// Importaciones RELATIVAS y no con el alias `@/`, a propósito: este módulo lo
// carga también `e2e/google.spec.ts`, que corre en Node por su cuenta, sin el
// resolvedor de Astro. Es la única concesión; el resto del panel usa el alias.
import { ETIQUETA_TIPO_CITA, type Cita } from '../supabase/tipos';
import { finDeCita, ZONA } from '../tiempo';
import type { EventoCita } from './calendario';

/**
 * Las dos decisiones puras de la sincronización: qué hay que hacer en Google y
 * cómo se ve la cita allá.
 *
 * Viven fuera de `sincronizar.ts` porque ese módulo arrastra la base de datos y
 * las credenciales, y estas dos cosas —que son las que se pueden equivocar sin
 * que nadie lo note— merecen poder probarse solas.
 */

export type Plan = 'crear' | 'actualizar' | 'cancelar' | 'nada';

export function planDeSincronizacion(cita: Pick<Cita, 'estado' | 'google_evento_id'>): Plan {
  if (cita.estado === 'cancelada') return cita.google_evento_id ? 'cancelar' : 'nada';
  return cita.google_evento_id ? 'actualizar' : 'crear';
}

/**
 * Cómo se ve la cita en el calendario compartido.
 *
 * Solo tipo, nombre y teléfono. La nota operativa NO va: puede llevar detalles
 * que se escribieron para el consultorio, y el calendario lo ve todo el equipo
 * y viaja a los servidores de Google.
 */
export function eventoDeCita(cita: Cita): EventoCita {
  return {
    titulo: `${ETIQUETA_TIPO_CITA[cita.tipo]} · ${cita.nombre_contacto}`,
    inicia_en: cita.inicia_en,
    termina_en: finDeCita(cita.inicia_en, cita.duracion_min),
    descripcion: cita.telefono_contacto ? `Tel. ${cita.telefono_contacto}` : '',
    zona: ZONA,
  };
}
