#!/usr/bin/env node
/**
 * Comprueba invariantes del artefacto construido que las pruebas e2e no pueden
 * ver, porque corren contra el servidor de desarrollo.
 *
 * La primera es la que importa: con `output: 'static'`, olvidar
 * `export const prerender = false` en una página de /admin la convierte en HTML
 * estático servido desde el CDN. El middleware no corre nunca en tiempo de
 * petición y el panel queda público. No hay error ni aviso: simplemente
 * funciona mal. Por eso se comprueba en cada build.
 *
 * Uso: node scripts/verificar-build.mjs   (después de `pnpm build`)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ESTATICO = '.vercel/output/static';
const fallos = [];

function archivos(dir) {
  const salida = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) salida.push(...archivos(ruta));
    else salida.push(ruta);
  }
  return salida;
}

let todos;
try {
  todos = archivos(ESTATICO);
} catch {
  console.error(`No encuentro ${ESTATICO}. ¿Corriste \`pnpm build\` antes?`);
  process.exit(1);
}

// 1. Ninguna página del panel puede haberse prerenderizado.
const adminEstatico = todos.filter((f) => f.endsWith('.html') && /\/admin(\/|\.)/.test(f));
if (adminEstatico.length > 0) {
  fallos.push(
    `Hay páginas de /admin prerenderizadas — el panel quedaría PÚBLICO:\n` +
      adminEstatico.map((f) => `    ${f}`).join('\n') +
      `\n  Falta \`export const prerender = false\` en esas páginas.`
  );
}

// 2. El sitemap no debe anunciar el panel.
const sitemaps = todos.filter((f) => f.includes('sitemap') && f.endsWith('.xml'));
for (const mapa of sitemaps) {
  if (readFileSync(mapa, 'utf8').includes('/admin')) {
    fallos.push(`${mapa} menciona /admin: revisa el filtro de @astrojs/sitemap.`);
  }
}

// 3. robots.txt debe pedir que no se rastree.
const robots = todos.find((f) => f.endsWith('robots.txt'));
if (!robots) fallos.push('No hay robots.txt en el build.');
else if (!readFileSync(robots, 'utf8').includes('Disallow: /admin/')) {
  fallos.push('robots.txt no lleva `Disallow: /admin/`.');
}

if (fallos.length > 0) {
  console.error('\n✘ El build no pasa las comprobaciones:\n');
  for (const f of fallos) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log(`✓ Build correcto: ${todos.length} archivos, ningún /admin estático.`);
