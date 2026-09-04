import { doctor } from '@/config/site';
import { TRATAMIENTO_SIN_DECIDIR } from './validate';

/**
 * Enlaces para escribirle al prospecto desde el panel con un toque, sin copiar
 * y pegar números a mano.
 *
 * Solo teléfono: el formulario ya no pide correo.
 */

/**
 * Normaliza a E.164 sin el `+`, que es lo que espera wa.me.
 * Diez dígitos se asumen mexicanos y se les antepone 52; el resto se deja como
 * viene, ya limpio de separadores. No valida el país: adivinar de más haría más
 * daño que bien.
 */
export function aE164(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '');
  if (digitos.length === 10) return `52${digitos}`;
  // 1 + 10 dígitos es un número de EE.UU./Canadá; se deja tal cual.
  return digitos;
}

/**
 * Mensaje de primer contacto, armado con lo que la persona llenó en el
 * formulario. Que llegue con contexto ahorra el primer intercambio entero.
 *
 * Deliberadamente NO incluye el texto libre que escribió: puede contener
 * información de salud, y aquí viajaría dentro de una URL — historial del
 * navegador, registros intermedios, servidores de Meta. El tratamiento es el
 * mínimo necesario para que la conversación arranque con sentido.
 */
export function mensajeWhatsapp(nombre: string, tratamiento: string): string {
  const primerNombre = nombre.trim().split(/\s+/)[0] ?? '';
  const saludo = primerNombre ? `Hola ${primerNombre}` : 'Hola';

  // Sin tratamiento decidido no se nombra ninguno: "su solicitud de valoración
  // para aún no estoy seguro/a" no es una frase que nadie quiera recibir.
  const porQue =
    tratamiento && tratamiento !== TRATAMIENTO_SIN_DECIDIR
      ? ` por su solicitud de valoración para ${tratamiento.toLocaleLowerCase('es-MX')}`
      : ' por su solicitud de valoración';

  return (
    `${saludo}, le escribo del consultorio de la Dra. ${doctor.name}` +
    `${porQue}. ¿Cuándo le viene bien que agendemos su cita?`
  );
}

export function aWhatsapp(telefono: string, nombre: string, tratamiento: string): string {
  return `https://wa.me/${aE164(telefono)}?text=${encodeURIComponent(mensajeWhatsapp(nombre, tratamiento))}`;
}

export function aTelefono(telefono: string): string {
  return `tel:+${aE164(telefono)}`;
}
