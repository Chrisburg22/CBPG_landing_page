/**
 * Validación compartida entre el formulario (navegador) y el endpoint (servidor).
 * Nunca confiar solo en la validación del cliente: se puede saltar con un POST directo.
 *
 * No se pide correo: el consultorio contacta por teléfono o WhatsApp, así que
 * recogerlo sería guardar un dato personal que nadie va a usar.
 */

export interface BookingPayload {
  nombre: string;
  telefono: string;
  tratamiento: string;
  mensaje: string;
  consentimiento: boolean;
}

export type BookingErrors = Partial<Record<keyof BookingPayload, string>>;

export const TRATAMIENTOS = [
  'Alineadores invisibles',
  'Brackets estéticos',
  'Brackets metálicos',
  'Ortodoncia infantil',
  'Aún no estoy seguro/a',
] as const;

export const LIMITES = {
  nombre: 120,
  telefono: 30,
  mensaje: 2000,
} as const;

export function validate(form: BookingPayload): BookingErrors {
  const errors: BookingErrors = {};

  if (!form.nombre.trim()) errors.nombre = 'Ingresa tu nombre.';
  else if (form.nombre.length > LIMITES.nombre) errors.nombre = 'El nombre es demasiado largo.';

  if (!form.telefono.trim() || form.telefono.replace(/\D/g, '').length < 7)
    errors.telefono = 'Ingresa un teléfono válido.';
  else if (form.telefono.length > LIMITES.telefono) errors.telefono = 'El teléfono es demasiado largo.';

  if (!form.tratamiento) errors.tratamiento = 'Selecciona una opción.';
  else if (!TRATAMIENTOS.includes(form.tratamiento as (typeof TRATAMIENTOS)[number]))
    errors.tratamiento = 'Selecciona una opción válida.';

  if (form.mensaje.length > LIMITES.mensaje) errors.mensaje = 'El mensaje es demasiado largo.';

  if (!form.consentimiento)
    errors.consentimiento = 'Necesitamos tu autorización para tratar tus datos.';

  return errors;
}

/** Normaliza lo que llega por POST a la forma esperada, sin confiar en tipos. */
export function coerce(raw: unknown): BookingPayload {
  const o = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  return {
    nombre: str(o.nombre),
    telefono: str(o.telefono),
    tratamiento: str(o.tratamiento),
    mensaje: str(o.mensaje),
    consentimiento: o.consentimiento === true || o.consentimiento === 'true',
  };
}
