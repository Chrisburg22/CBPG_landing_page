import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// De este valor dependen el sitemap, la URL canónica y las etiquetas Open Graph.
// Con www: el apex hace 308 a www, así que esa es la forma canónica real.
export default defineConfig({
  site: 'https://www.drabereniceparadaortodoncista.com.mx',
  // Todo se prerenderiza salvo lo que marque `prerender = false`: hoy /api/contact,
  // /api/cron/* y TODO /admin/*. Si una página de /admin se prerenderiza por olvido,
  // el middleware no corre en tiempo de petición y el panel queda público.
  output: 'static',
  adapter: vercel(),
  integrations: [
    react(),
    // El panel no se anuncia. Además lleva noindex en el layout y X-Robots-Tag
    // desde el middleware; esto es una capa más, no la única.
    sitemap({ filter: (pagina) => !pagina.includes('/admin') }),
  ],
  env: {
    // Olvidar una variable en Vercel debe romper el deploy, no producir un 503
    // en el formulario de una paciente a las dos de la mañana.
    validateSecrets: true,
    schema: {
      // Ninguna lleva prefijo PUBLIC_ a propósito: no hay ningún cliente Supabase
      // en el navegador, así que nada de esto entra al bundle de cliente.
      SUPABASE_URL: envField.string({ context: 'server', access: 'public', url: true }),
      SUPABASE_PUBLISHABLE_KEY: envField.string({
        context: 'server',
        access: 'public',
        startsWith: 'sb_publishable_',
      }),
      SUPABASE_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        startsWith: 'sb_secret_',
      }),
      /** Correos con acceso al panel, separados por comas. */
      ADMIN_EMAILS: envField.string({ context: 'server', access: 'secret', min: 5 }),
      /** Vercel lo inyecta como `Authorization: Bearer …` en los cron. */
      CRON_SECRET: envField.string({ context: 'server', access: 'secret', min: 32 }),
    },
  },
});
