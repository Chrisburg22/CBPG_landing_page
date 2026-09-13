import type { Cita } from './supabase/tipos';
import { partesEnMexico } from './tiempo';

/**
 * El horario del consultorio y la geometría de la agenda por horas.
 *
 * El horario repite lo que el sitio anuncia en `doctor.schedule`
 * (src/config/site.ts): lunes a viernes de 9 a 19, sábado de 9 a 13. Va aquí
 * como números y no parseando aquella cadena porque la cadena es copy —la puede
 * reescribir quien edita la landing— y la rejilla no debería romperse por un
 * cambio de redacción. Si cambia el horario real, cambian los dos sitios.
 */
export const APERTURA = 9;
export const CIERRE = 19;
/** Sábado cierra antes. Domingo no abre: sus citas van a «fuera de horario». */
export const CIERRE_SABADO = 13;

const MINUTOS_DIA = (CIERRE - APERTURA) * 60;

/** 0 = lunes … 6 = domingo, a partir de un 'AAAA-MM-DD'. */
export function diaDeLaSemana(dia: string): number {
  const [anio, mes, dd] = dia.split('-').map(Number);
  if (!anio || !mes || !dd) return 0;
  return (new Date(anio, mes - 1, dd).getDay() + 6) % 7;
}

/** Hora de cierre de ese día, o `null` si ese día no se abre. */
export function cierreDe(dia: string): number | null {
  const d = diaDeLaSemana(dia);
  if (d === 6) return null;
  return d === 5 ? CIERRE_SABADO : CIERRE;
}

export interface Bloque {
  cita: Cita;
  /** Posición y alto en porcentaje de la jornada de 9 a 19. */
  top: number;
  alto: number;
  /** 'H:MM' de inicio y fin, ya en hora de México. */
  desde: string;
  hasta: string;
  /** Una cita de media hora o menos no cabe en dos renglones. */
  corto: boolean;
}

function hhmm(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

/**
 * Coloca las citas en la rejilla y aparta las que no caben.
 *
 * En porcentaje y no en píxeles: así la misma posición vale para el escritorio
 * y para el teléfono, donde cada hora mide menos, sin recalcular nada en el
 * navegador. Una cita que empieza antes de abrir o termina después de cerrar
 * NO se recorta ni se esconde: va a la lista de fuera de horario, que es donde
 * alguien la va a buscar.
 */
export function colocar(citas: Cita[], dia: string): { bloques: Bloque[]; fuera: Cita[] } {
  const cierre = cierreDe(dia);
  const bloques: Bloque[] = [];
  const fuera: Cita[] = [];

  for (const cita of citas) {
    const { hora, minuto } = partesEnMexico(new Date(cita.inicia_en));
    const inicio = hora * 60 + minuto;
    const fin = inicio + cita.duracion_min;

    if (cierre === null || inicio < APERTURA * 60 || fin > cierre * 60) {
      fuera.push(cita);
      continue;
    }

    const desdeApertura = inicio - APERTURA * 60;
    bloques.push({
      cita,
      top: (desdeApertura / MINUTOS_DIA) * 100,
      alto: (cita.duracion_min / MINUTOS_DIA) * 100,
      desde: hhmm(inicio),
      hasta: hhmm(fin),
      corto: cita.duracion_min <= 30,
    });
  }

  return { bloques, fuera };
}

/** La franja cerrada del sábado, en porcentaje desde arriba. `null` si no hay. */
export function cerradoDesde(dia: string): number | null {
  const cierre = cierreDe(dia);
  if (cierre === null) return 0;
  if (cierre >= CIERRE) return null;
  return ((cierre - APERTURA) / (CIERRE - APERTURA)) * 100;
}

/** Dónde va la línea de «ahora», o `null` fuera de la jornada. */
export function posicionAhora(ahora: Date = new Date()): { top: number; texto: string } | null {
  const { hora, minuto } = partesEnMexico(ahora);
  const minutos = hora * 60 + minuto;
  if (minutos < APERTURA * 60 || minutos > CIERRE * 60) return null;
  return { top: ((minutos - APERTURA * 60) / MINUTOS_DIA) * 100, texto: hhmm(minutos) };
}

export const HORAS_REJILLA = Array.from(
  { length: CIERRE - APERTURA + 1 },
  (_, i) => APERTURA + i
);
