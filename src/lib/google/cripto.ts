import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { GOOGLE_TOKEN_KEY } from 'astro:env/server';

/**
 * Cifrado de los tokens de Google antes de guardarlos.
 *
 * La tabla `integracion_google` ya es inalcanzable para el cliente del panel
 * (RLS sin políticas, sin GRANT). Esto es la segunda capa, y protege de otra
 * cosa: un respaldo de la base, un volcado pegado en un chat, o alguien con la
 * clave secreta de Supabase pero sin las variables de Vercel. Con el refresh
 * token en claro, cualquiera de esos tres casos entrega el calendario del
 * consultorio; cifrado, hacen falta las dos mitades.
 *
 * AES-256-GCM y no AES-CBC: GCM autentica además de cifrar, así que un texto
 * cifrado manipulado falla al descifrar en vez de devolver basura que luego se
 * manda a Google como si fuera un token.
 */

const PREFIJO = 'v1';

/**
 * La clave, como 32 bytes.
 *
 * Se resuelve en cada llamada y no al cargar el módulo: con `optional: true`,
 * `GOOGLE_TOKEN_KEY` puede no estar —el consultorio que no use Google no tiene
 * por qué inventarse una— y un `throw` a nivel de módulo tumbaría el arranque
 * entero por una integración apagada.
 */
function clave(): Buffer {
  const hex = GOOGLE_TOKEN_KEY ?? '';
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      'GOOGLE_TOKEN_KEY tiene que ser de 64 caracteres hexadecimales (32 bytes). ' +
        'Generar con: openssl rand -hex 32'
    );
  }
  return Buffer.from(hex, 'hex');
}

/** `true` si hay clave utilizable. Permite avisar en pantalla en vez de reventar. */
export function hayClave(): boolean {
  return /^[0-9a-fA-F]{64}$/.test(GOOGLE_TOKEN_KEY ?? '');
}

export function cifrar(texto: string): string {
  if (!texto) return '';
  // 12 bytes es el tamaño de nonce que recomienda GCM; con otro, algunas
  // implementaciones lo derivan por GHASH y se pierde la garantía de unicidad.
  const iv = randomBytes(12);
  const cifrador = createCipheriv('aes-256-gcm', clave(), iv);
  const cifrado = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();
  return [PREFIJO, iv.toString('base64'), etiqueta.toString('base64'), cifrado.toString('base64')].join(
    '.'
  );
}

/**
 * Devuelve el texto en claro, o `null` si no se puede descifrar.
 *
 * `null` y no una excepción porque el caso real no es un ataque: es que se
 * rotó `GOOGLE_TOKEN_KEY` y los tokens guardados con la anterior ya no abren.
 * Lo que toca entonces es pedir que se reconecte el calendario, y eso se cuenta
 * mejor en pantalla que con un 500.
 */
export function descifrar(guardado: string): string | null {
  if (!guardado) return null;
  const partes = guardado.split('.');
  if (partes.length !== 4 || partes[0] !== PREFIJO) return null;
  const [, iv, etiqueta, cifrado] = partes as [string, string, string, string];

  try {
    const descifrador = createDecipheriv('aes-256-gcm', clave(), Buffer.from(iv, 'base64'));
    descifrador.setAuthTag(Buffer.from(etiqueta, 'base64'));
    return Buffer.concat([
      descifrador.update(Buffer.from(cifrado, 'base64')),
      descifrador.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
}
