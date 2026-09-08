/**
 * Cómo se escriben fechas y dinero en el panel. Un solo sitio, para que no
 * aparezcan tres formatos distintos según qué pantalla mires.
 */

/** Formato corto para las tablas; largo para el detalle. Siempre hora de Ciudad de México. */
export function fecha(iso: string, largo = false): string {
  return new Date(iso).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: largo ? 'long' : 'medium',
    timeStyle: 'short',
  });
}

/**
 * Formatea un `date` de Postgres ('AAAA-MM-DD') sin pasar por `new Date(iso)`.
 *
 * `new Date('2026-09-05')` lo interpreta como medianoche UTC, que en México es
 * la tarde del día anterior: la fecha se mostraría un día antes. Partir la
 * cadena evita el viaje por UTC entero.
 */
export function fechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return iso;
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const PESOS = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

/**
 * Importes en pesos.
 *
 * Acepta `string` porque así es como llegan: `numeric` de Postgres tiene más
 * precisión que un `number` de JavaScript, y supabase-js lo entrega sin
 * convertir para no perder centavos. La conversión a número ocurre aquí, en el
 * último momento y solo para pintarlo — nunca antes de sumar.
 */
export function dinero(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (!Number.isFinite(numero)) return '—';
  return PESOS.format(numero);
}

/** Versión compacta para las métricas del resumen: $68,400 en vez de $68,400.00. */
export function dineroCorto(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (!Number.isFinite(numero)) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(numero);
}

/** Hoy en México, como 'AAAA-MM-DD' para el `value` de un `<input type="date">`. */
export function hoyEnMexico(): string {
  // `en-CA` da exactamente el formato ISO corto; la zona la fija `timeZone`.
  // Sin esto, un registro a las 22:00 se guardaría con la fecha del día siguiente.
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

/** Suma importes que llegan como cadena, sin perder centavos por el camino. */
export function sumar(valores: (string | null | undefined)[]): number {
  // Se trabaja en centavos enteros: 0.1 + 0.2 no es 0.3 en coma flotante, y un
  // total que no cuadra por un centavo es un total en el que no se confía.
  const centavos = valores.reduce<number>((total, valor) => {
    const numero = Number(valor ?? 0);
    return total + (Number.isFinite(numero) ? Math.round(numero * 100) : 0);
  }, 0);
  return centavos / 100;
}
