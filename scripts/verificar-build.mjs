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

// 4. Los tres archivos de la PWA tienen que llegar al build.
//    Si uno se mueve fuera de public/, el worker desplegado da 404. Eso
//    DESREGISTRA el worker en los navegadores que ya lo tienen, pero les deja
//    las cachés puestas: por eso borrar el archivo no es forma de desinstalarlo.
const ARCHIVOS_PWA = ['panel-sw.js', 'panel.webmanifest', 'panel-sin-conexion.html'];
for (const archivo of ARCHIVOS_PWA) {
  if (!todos.some((f) => f.endsWith(`/${archivo}`))) {
    fallos.push(`Falta ${archivo} en el build: la PWA del panel quedaría rota.`);
  }
}

// 5. Solo el panel es instalable.
//    Todo .html del output estático es, por definición, la landing pública: las
//    páginas de /admin son SSR y la invariante 1 ya comprueba que no estén.
//    Esto es lo que se rompe cuando alguien añade el manifest a Layout.astro
//    (el público) en vez de a AdminLayout.astro.
const publicasConPWA = todos
  .filter((f) => f.endsWith('.html') && !f.endsWith('panel-sin-conexion.html'))
  .filter((f) => /panel\.webmanifest|panel-sw\.js/.test(readFileSync(f, 'utf8')));
if (publicasConPWA.length > 0) {
  fallos.push(
    `Páginas públicas que enlazan la PWA del panel:\n` +
      publicasConPWA.map((f) => `    ${f}`).join('\n') +
      `\n  El manifest y el worker van solo en AdminLayout.astro.`
  );
}

// 6. El manifest tiene que describir el panel, y sus iconos tienen que existir.
const rutaManifest = todos.find((f) => f.endsWith('/panel.webmanifest'));
if (rutaManifest) {
  try {
    const manifest = JSON.parse(readFileSync(rutaManifest, 'utf8'));
    if (!manifest.start_url?.startsWith('/admin')) {
      fallos.push(`El manifest tiene start_url "${manifest.start_url}": debe empezar por /admin.`);
    }
    if (!manifest.scope?.startsWith('/admin')) {
      fallos.push(`El manifest tiene scope "${manifest.scope}": debe empezar por /admin.`);
    }
    if (manifest.display !== 'standalone') {
      fallos.push(`El manifest tiene display "${manifest.display}": debe ser standalone.`);
    }
    for (const icono of manifest.icons ?? []) {
      if (!todos.some((f) => f.endsWith(icono.src))) {
        fallos.push(`El manifest declara ${icono.src}, que no está en el build.`);
      }
    }
  } catch (e) {
    fallos.push(`panel.webmanifest no es JSON válido: ${e.message}`);
  }
}

// 7. La página de respaldo se sirve sin pasar por el middleware, así que no
//    puede llevar nada dentro.
const rutaRespaldo = todos.find((f) => f.endsWith('/panel-sin-conexion.html'));
if (rutaRespaldo) {
  const respaldo = readFileSync(rutaRespaldo, 'utf8');
  if (respaldo.includes('<script')) fallos.push('panel-sin-conexion.html lleva JavaScript.');
  if (/supabase/i.test(respaldo)) fallos.push('panel-sin-conexion.html menciona Supabase.');
  if (!respaldo.includes('noindex')) fallos.push('panel-sin-conexion.html no lleva noindex.');
  if (respaldo.length > 8192) {
    fallos.push(`panel-sin-conexion.html pesa ${respaldo.length} B: se pasa de 8 kB.`);
  }
}

// 8. Lo que enlazan las páginas públicas tiene que existir.
//    Esta comprobación nació de un bug real: Layout.astro apuntaba a
//    /apple-touch-icon.png y /og-image.jpg y ninguno de los dos existía, así que
//    toda vista previa compartida salía sin imagen y el icono de iOS daba 404.
const rotos = new Set();
for (const pagina of todos.filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(pagina, 'utf8');
  const referencias = [
    ...[...html.matchAll(/<link[^>]+href="(\/[^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/<meta[^>]+(?:property|name)="[^"]*image"[^>]+content="([^"]+)"/g)].map(
      (m) => m[1]
    ),
  ];
  for (const referencia of referencias) {
    // Solo activos propios: nada de rutas SSR ni de dominios ajenos.
    const ruta = referencia.startsWith('http') ? new URL(referencia).pathname : referencia;
    if (!/\.\w{2,5}$/.test(ruta)) continue;
    if (!todos.some((f) => f.endsWith(ruta))) rotos.add(`${ruta}  (en ${pagina})`);
  }
}
if (rotos.size > 0) {
  fallos.push(`Enlaces a archivos que no existen en el build:\n` + [...rotos].map((r) => `    ${r}`).join('\n'));
}

if (fallos.length > 0) {
  console.error('\n✘ El build no pasa las comprobaciones:\n');
  for (const f of fallos) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log(`✓ Build correcto: ${todos.length} archivos, ningún /admin estático, PWA solo en el panel.`);
