import { ADMIN_EMAILS } from 'astro:env/server';

/**
 * Allowlist de correos con acceso al panel.
 *
 * Es la segunda de dos barreras: la tabla `admins` decide qué puede leer la
 * base de datos, esto decide quién puede siquiera intentar entrar. Estar en una
 * sola no sirve de nada.
 */
export function emailsPermitidos(): Set<string> {
  return new Set(
    ADMIN_EMAILS.split(',')
      .map((valor) => valor.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Rutas bajo /admin a las que se llega SIN sesión. Sin esto hay bucle de redirects. */
export const RUTAS_PUBLICAS_ADMIN = new Set([
  '/admin/login',
  '/admin/auth/entrar',
  '/admin/auth/salir',
]);

/** Normaliza el pathname para comparar contra las listas: sin barras finales. */
export function normalizarRuta(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}
