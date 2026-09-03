/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** API key de Resend. Se configura en el hosting, nunca se sube al repo. */
  readonly RESEND_API_KEY: string;
  /** Remitente verificado en Resend, p. ej. "Citas <citas@bereniceparada.com>". */
  readonly CONTACT_FROM_EMAIL: string;
  /** Bandeja que recibe las solicitudes. Si falta, usa doctor.email de site.ts. */
  readonly CONTACT_TO_EMAIL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
