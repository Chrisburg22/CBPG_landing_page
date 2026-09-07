#!/usr/bin/env node
/**
 * Genera los iconos de la PWA del panel y las dos imágenes que el layout público
 * ya referencia desde hace tiempo sin que existieran.
 *
 *   node scripts/generar-iconos.mjs
 *
 * Todo sale de public/favicon.svg, que es la única forma de la marca que hay en
 * el repo. Los resultados SE COMMITEAN, igual que los .jpg que produce
 * preparar-imagenes.mjs: el build de Vercel no corre este script.
 *
 * LA TRAMPA QUE JUSTIFICA LA MITAD DE ESTE ARCHIVO
 * ------------------------------------------------
 * sharp rasteriza SVG con resvg, que NO trae fuentes: usa las del sistema. El
 * monograma «BP» se dibuja con <text font-family="Georgia, …, 'DejaVu Serif',
 * serif">, así que en una máquina sin ninguna de esas familias el texto sale con
 * otra tipografía o —peor— no sale, y obtienes un cuadrado teal liso. Sin error,
 * sin aviso, y no te enteras hasta que el icono está en el teléfono.
 *
 * Por eso cada salida se verifica contando píxeles de tinta sobre el resultado
 * ya rasterizado, y el script sale con código ≠0 si el monograma no aparece.
 * Convierte un fallo visual silencioso en uno ruidoso.
 */
import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// ── Marca ─────────────────────────────────────────────────────────────────
const TEAL = '#2f7d75';      // --accent
const TINTA = '#fbfaf6';     // --on-accent, el color del monograma
const CREMA = '#f5f1ea';     // --bg, fondo de la tarjeta OG
const INK = '#26221d';       // --ink
const INK_SUAVE = '#6f675c'; // --ink-soft

const ORIGEN = 'public/favicon.svg';
const DIR_ICONOS = 'public/iconos';

/**
 * El SVG declara `viewBox="0 0 64 64"` y ninguna dimensión, así que resvg lo
 * renderiza a 64px a la densidad por defecto de 72. Subir la densidad en
 * proporción es lo que da un trazo nítido en vez de un upscale borroso.
 */
const DENSIDAD_BASE = 72;
const LADO_SVG = 64;

/**
 * Zona segura del estándar maskable: Android recorta con una máscara que puede
 * llegar a un círculo de diámetro 80% del lado. El monograma tiene que caber
 * dentro o la «B» pierde el lomo.
 */
const ZONA_SEGURA = 0.8;

function log(icono, msg) { console.log(`${icono} ${msg}`); }

const fallos = [];

/** Rasteriza el favicon a `lado` píxeles, con la densidad que toca. */
async function rasterizar(svg, lado) {
  return sharp(svg, { density: Math.round((DENSIDAD_BASE * lado) / LADO_SVG) })
    .resize(lado, lado)
    .png()
    .toBuffer();
}

/**
 * Cuenta píxeles que cumplen `predicado` dentro de una región, sobre el PNG ya
 * generado. Se mide el resultado final, no un paso intermedio: es la única
 * forma de detectar que la fuente no estaba.
 */
async function contar(png, region, predicado) {
  const { data, info } = await sharp(png)
    .extract(region)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const canales = info.channels;
  let n = 0;
  for (let i = 0; i < data.length; i += canales) {
    if (predicado(data[i], data[i + 1], data[i + 2])) n++;
  }
  return { n, total: info.width * info.height };
}

const esClaro = (r, g, b) => r > 200 && g > 200 && b > 200;
const esOscuro = (r, g, b) => r < 120 && g < 120 && b < 120;

/**
 * Exige que la región tenga al menos `minimo` de proporción de píxeles que
 * cumplan el predicado. Acumula en `fallos` en vez de lanzar, para que una
 * corrida informe de todo lo que está mal de una vez.
 */
async function exigirTinta(nombre, png, region, predicado, minimo = 0.01) {
  const { n, total } = await contar(png, region, predicado);
  const proporcion = n / total;
  if (proporcion < minimo) {
    fallos.push(
      `${nombre}: el monograma no se rasterizó (${(proporcion * 100).toFixed(2)}% de tinta, ` +
        `se esperaba ≥${(minimo * 100).toFixed(0)}%).\n` +
        `    Causa casi segura: no hay ninguna fuente serif instalada y resvg dibujó el fondo a secas.\n` +
        `    En Debian/Ubuntu: apt-get install fonts-dejavu-core`
    );
    return false;
  }
  return true;
}

/** Icono `purpose: any`: el favicon tal cual, con su rectángulo redondeado. */
async function iconoNormal(svg, lado) {
  const png = await rasterizar(svg, lado);
  const salida = path.join(DIR_ICONOS, `panel-${lado}.png`);
  await sharp(png).toFile(salida);

  // El monograma vive en el centro; medir ahí evita que el fondo teal, que
  // ocupa casi todo, diluya la proporción hasta hacer el aserto inútil.
  const m = Math.round(lado * 0.25);
  await exigirTinta(salida, png, { left: m, top: m, width: lado - 2 * m, height: lado - 2 * m }, esClaro, 0.05);
  log('✓', `${salida} — ${lado}×${lado}`);
}

/**
 * Icono `purpose: maskable`: fondo teal a sangre y el monograma encogido a la
 * zona segura. Los bordes redondeados del original quedan invisibles contra el
 * mismo color, que es justo lo que se quiere: la máscara la pone el sistema.
 */
async function iconoMascara(svg, lado, { salida, escala = ZONA_SEGURA, plano = false }) {
  const interior = Math.round(lado * escala);
  const marca = await rasterizar(svg, interior);

  let lienzo = sharp({
    create: { width: lado, height: lado, channels: 4, background: TEAL },
  }).composite([{ input: marca, gravity: 'center' }]);

  // iOS aplica su propio squircle y NO respeta transparencia ni esquinas
  // redondeadas propias: un PNG con alfa da doble redondeo con flecos oscuros.
  //
  // `flatten` solo deja los píxeles opacos; el PNG seguiría teniendo canal alfa
  // (RGBA con todo a 255) y hay versiones de iOS que se atragantan con eso.
  // `removeAlpha` es lo que de verdad lo escribe como RGB.
  if (plano) lienzo = lienzo.flatten({ background: TEAL }).removeAlpha();

  const png = await lienzo.png().toBuffer();
  await sharp(png).toFile(salida);

  const m = Math.round(lado * 0.3);
  await exigirTinta(salida, png, { left: m, top: m, width: lado - 2 * m, height: lado - 2 * m }, esClaro, 0.05);
  log('✓', `${salida} — ${lado}×${lado}${plano ? ' (sin alfa)' : ''}`);
}

/**
 * Tarjeta para Open Graph y Twitter. src/layouts/Layout.astro la referencia
 * desde siempre y hasta hoy daba 404: toda vista previa en WhatsApp o Facebook
 * salía sin imagen.
 *
 * No lleva el retrato de la doctora a propósito: recorta mal a 1200×630 y poner
 * su cara en cada enlace compartido es una decisión que merece tomarse aparte.
 */
async function tarjetaOG(svg) {
  const ANCHO = 1200, ALTO = 630, MARCA = 240;
  const marca = await rasterizar(svg, MARCA);

  // El texto va en su propio SVG con la misma pila serif que el monograma, así
  // que si faltan fuentes falla igual de ruidosamente.
  const texto = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">
    <text x="${ANCHO / 2}" y="470" text-anchor="middle" fill="${INK}"
          font-family="Georgia, 'Times New Roman', 'DejaVu Serif', serif" font-size="62">Dra. Berenice Parada</text>
    <text x="${ANCHO / 2}" y="530" text-anchor="middle" fill="${INK_SUAVE}"
          font-family="Georgia, 'Times New Roman', 'DejaVu Serif', serif" font-size="34">Ortodoncia</text>
  </svg>`);

  const salida = 'public/og-image.jpg';
  const png = await sharp({ create: { width: ANCHO, height: ALTO, channels: 4, background: CREMA } })
    .composite([
      { input: marca, top: 120, left: Math.round((ANCHO - MARCA) / 2) },
      { input: texto, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  await sharp(png).jpeg({ quality: 90, mozjpeg: true }).toFile(salida);

  // Dos asertos: el monograma (claro sobre teal) y el nombre (oscuro sobre crema).
  await exigirTinta(`${salida} [monograma]`, png, { left: 540, top: 180, width: 120, height: 120 }, esClaro, 0.05);
  await exigirTinta(`${salida} [texto]`, png, { left: 300, top: 420, width: 600, height: 60 }, esOscuro, 0.02);
  log('✓', `${salida} — ${ANCHO}×${ALTO}`);
}

// ── Ejecución ─────────────────────────────────────────────────────────────
const svg = await readFile(ORIGEN);
await mkdir(DIR_ICONOS, { recursive: true });

await iconoNormal(svg, 192);
await iconoNormal(svg, 512);
await iconoMascara(svg, 192, { salida: path.join(DIR_ICONOS, 'panel-192-mascara.png') });
await iconoMascara(svg, 512, { salida: path.join(DIR_ICONOS, 'panel-512-mascara.png') });
// 180×180 es el tamaño que pide iOS. Escala algo mayor que la zona segura de
// Android porque el squircle de Apple recorta bastante menos que una máscara circular.
await iconoMascara(svg, 180, { salida: 'public/apple-touch-icon.png', escala: 0.72, plano: true });
await tarjetaOG(svg);

if (fallos.length > 0) {
  console.error('\n✘ Los iconos no salieron bien:\n');
  for (const f of fallos) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log('\nListo. Míralos a ojo antes de commitearlos, sobre todo que el');
console.log('monograma se lea y que apple-touch-icon.png no tenga esquinas propias.\n');
