import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// TODO(dominio): confirmar el dominio definitivo antes de publicar.
// De este valor dependen el sitemap, la URL canónica y las etiquetas Open Graph.
export default defineConfig({
  site: 'https://bereniceparada.com',
  // Todo se prerenderiza salvo lo que marque `prerender = false`,
  // que hoy es únicamente /api/contact.
  output: 'static',
  adapter: vercel(),
  integrations: [react(), sitemap()],
});
