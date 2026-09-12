/**
 * Horas de la agenda: de lo que se teclea a lo que se guarda, y al revés.
 *
 * La agenda se piensa SIEMPRE en hora de Ciudad de México y se guarda SIEMPRE en
 * UTC (`timestamptz`). En medio hay dos sitios donde una conversión mal hecha
 * mueve una cita una hora o un día entero:
 *
 *   1. `<input type="datetime-local">` entrega hora de pared sin zona
 *      ('2026-09-11T16:30'). Si se pasa a `new Date(...)`, el navegador la
 *      interpreta con la zona del aparato — y el servidor de Vercel, que es
 *      quien la recibe, corre en UTC. La cita se iría seis horas.
 *   2. `new Date(iso).toLocaleString(...)` sí sabe convertir a México, pero solo
 *      sirve para MOSTRAR. Para volver a un `<input>` hace falta reconstruir la
 *      cadena a mano.
 *
 * Nada de esto usa una librería de zonas horarias: `Intl` ya trae la base de
 * datos de zonas del sistema, e importar una copia propia significaría
 * mantenerla al día a mano.
 */

export const ZONA = 'America/Mexico_City';

/**
 * Cuánto se adelanta la zona respecto a UTC en ese instante, en minutos.
 *
 * México dejó el horario de verano en 2022 y hoy es −06:00 todo el año, pero
 * esto no lo da por hecho: si la regla vuelve a cambiar, `Intl` ya lo sabrá y
 * este cálculo lo seguirá sin tocar nada.
 */
function desfaseMinutos(instante: Date): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instante);

  const leer = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? '0');
  // `hour12: false` puede dar la hora 24 para la medianoche en algunos motores.
  const hora = leer('hour') % 24;

  const comoSiFueraUtc = Date.UTC(
    leer('year'),
    leer('month') - 1,
    leer('day'),
    hora,
    leer('minute'),
    leer('second')
  );
  return (comoSiFueraUtc - instante.getTime()) / 60_000;
}

/**
 * De hora de pared mexicana ('AAAA-MM-DDTHH:mm') al instante UTC en ISO.
 *
 * Devuelve `null` si la cadena no tiene esa forma: es lo que llega de un
 * formulario, así que puede llegar cualquier cosa.
 *
 * Los dos pasos no sobran. El desfase depende del instante, y el instante es lo
 * que estamos calculando: se estima con el desfase del primer intento y se
 * corrige con el del resultado. Solo cambia algo en las dos horas al año en que
 * la zona salta — pero ahí, sin el segundo paso, la cita se guarda una hora
 * movida.
 */
export function deMexicoAIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(local.trim());
  if (!m) return null;
  const [, anio, mes, dia, hora, minuto] = m.map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];

  const comoUtc = Date.UTC(anio, mes - 1, dia, hora, minuto);
  const primera = comoUtc - desfaseMinutos(new Date(comoUtc)) * 60_000;
  const corregida = comoUtc - desfaseMinutos(new Date(primera)) * 60_000;

  const fecha = new Date(corregida);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

/** Del instante UTC al valor de un `<input type="datetime-local">` mexicano. */
export function aCampoLocal(iso: string): string {
  const { anio, mes, dia, hora, minuto } = partesEnMexico(new Date(iso));
  return `${anio}-${dos(mes)}-${dos(dia)}T${dos(hora)}:${dos(minuto)}`;
}

function dos(n: number): string {
  return String(n).padStart(2, '0');
}

/** Año, mes, día, hora y minuto de ese instante, ya en hora de México. */
export function partesEnMexico(instante: Date) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instante);
  const leer = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? '0');
  return {
    anio: leer('year'),
    mes: leer('month'),
    dia: leer('day'),
    hora: leer('hour') % 24,
    minuto: leer('minute'),
  };
}

/** El día mexicano de ese instante, como 'AAAA-MM-DD'. */
export function diaEnMexico(iso: string | Date): string {
  const { anio, mes, dia } = partesEnMexico(typeof iso === 'string' ? new Date(iso) : iso);
  return `${anio}-${dos(mes)}-${dos(dia)}`;
}

/**
 * Los dos extremos de un día mexicano, en ISO UTC, para acotar una consulta.
 *
 * `desde` inclusive y `hasta` exclusivo: así una cita a las 23:59 entra en su
 * día y la de las 00:00 del siguiente no se cuenta dos veces.
 */
export function limitesDelDia(dia: string): { desde: string; hasta: string } {
  const desde = deMexicoAIso(`${dia}T00:00`) ?? new Date().toISOString();
  const siguiente = sumarDias(dia, 1);
  const hasta = deMexicoAIso(`${siguiente}T00:00`) ?? desde;
  return { desde, hasta };
}

/** Los extremos de un rango de días mexicanos, ambos dados como 'AAAA-MM-DD'. */
export function limitesDelRango(primerDia: string, ultimoDia: string) {
  return {
    desde: limitesDelDia(primerDia).desde,
    hasta: limitesDelDia(ultimoDia).hasta,
  };
}

/** Suma (o resta) días a una fecha 'AAAA-MM-DD' sin pasar por UTC. */
export function sumarDias(dia: string, cuantos: number): string {
  const [anio, mes, dd] = dia.split('-').map(Number);
  if (!anio || !mes || !dd) return dia;
  // Fecha local del proceso y no UTC: aquí solo se cuentan días de calendario,
  // y `new Date(a, m, d)` no puede irse al día anterior por el huso.
  const fecha = new Date(anio, mes - 1, dd + cuantos);
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** El lunes de la semana que contiene ese día. La agenda semanal empieza en lunes. */
export function lunesDeLaSemana(dia: string): string {
  const [anio, mes, dd] = dia.split('-').map(Number);
  if (!anio || !mes || !dd) return dia;
  const fecha = new Date(anio, mes - 1, dd);
  // getDay(): 0 es domingo. Restarle 6 al domingo lo lleva a su lunes anterior.
  const desplazamiento = (fecha.getDay() + 6) % 7;
  return sumarDias(dia, -desplazamiento);
}

/** Hora suelta de una cita: «4:30 p.m.». */
export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', {
    timeZone: ZONA,
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Día y hora juntos, para listas fuera de la agenda: «11 sep, 4:30 p.m.». */
export function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    timeZone: ZONA,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * «Jueves, 11 de septiembre», para el encabezado del día.
 *
 * `capitalizar` existe porque en español los días van en minúscula salvo al
 * empezar frase, y esta cadena se usa en los dos sitios: sola como título, y
 * dentro de «Semana del …», donde «Semana del Lunes» chirría.
 */
export function diaLargo(dia: string, capitalizar = true): string {
  const [anio, mes, dd] = dia.split('-').map(Number);
  if (!anio || !mes || !dd) return dia;
  const texto = new Date(anio, mes - 1, dd).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return capitalizar ? texto.charAt(0).toLocaleUpperCase('es-MX') + texto.slice(1) : texto;
}

/** «jue 11», para las columnas de la vista semanal. */
export function diaCortoConNumero(dia: string): string {
  const [anio, mes, dd] = dia.split('-').map(Number);
  if (!anio || !mes || !dd) return dia;
  return new Date(anio, mes - 1, dd).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
  });
}

/** El instante en que termina una cita, para el evento de Google. */
export function finDeCita(iniciaEn: string, duracionMin: number): string {
  return new Date(new Date(iniciaEn).getTime() + duracionMin * 60_000).toISOString();
}
