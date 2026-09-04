/**
 * Enlaces para contestarle a la paciente desde el panel con un toque, sin
 * copiar y pegar números a mano.
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

export function aWhatsapp(telefono: string, nombre: string): string {
  const numero = aE164(telefono);
  const saludo = `Hola ${nombre.split(' ')[0] ?? ''}, le escribo del consultorio de la Dra. Berenice Parada sobre su solicitud de cita.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(saludo.trim())}`;
}

export function aCorreo(email: string, nombre: string): string {
  const asunto = 'Su solicitud de cita — Dra. Berenice Parada';
  const cuerpo = `Hola ${nombre.split(' ')[0] ?? ''}:\n\n`;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

export function aTelefono(telefono: string): string {
  return `tel:+${aE164(telefono)}`;
}
