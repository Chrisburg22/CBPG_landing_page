#!/usr/bin/env node
/**
 * Prepara las fotos originales para el sitio.
 *
 *   node scripts/preparar-imagenes.mjs --listar ~/fotos-cbpg
 *   node scripts/preparar-imagenes.mjs ~/fotos-cbpg
 *
 * `--listar` imprime cada archivo con sus dimensiones, para poder rellenar
 * el MAPEO de abajo con los nombres reales. Después, la segunda forma recorta,
 * normaliza y escribe los resultados en src/assets/.
 *
 * Nunca amplía una imagen: si el original es pequeño, la salida lo será
 * también. Astro genera luego los tamaños menores y los formatos AVIF/WebP.
 */
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// ── Qué archivo de origen es cada cosa ────────────────────────────────────
// Rellenar con los nombres reales tras ejecutar --listar.
const MAPEO = {
  retrato:          'retrato-titulacion.jpg',   // 1000×1400, con marco negro
  antesFrontal:     'antes-frontal.jpg',        // 1600×1067
  antesSuperior:    'antes-superior.jpg',       // 1600×1067
  antesInferior:    'antes-inferior.jpg',       // 1600×1067
  duranteFrontal:   'durante-frontal.jpg',      // 726×298 (el de ambas arcadas)
  despuesFrontal:   'despues-frontal.jpg',      // 678×298
  despuesSuperior:  'despues-superior.jpg',     // 654×522
  despuesInferior:  'despues-inferior.jpg',     // 654×522
};

// ── Ajustes finos ─────────────────────────────────────────────────────────
const AJUSTES = {
  // El fondo azul de estudio choca con la paleta crema del sitio.
  // Bajar la saturación lo acerca a un gris neutro que convive mejor.
  // Subirlo a 1 desactiva el efecto; bajarlo de 0.5 empieza a apagar la piel.
  saturacionRetrato: 0.6,
  brilloRetrato: 1.04,

  // Recortes del retrato, en coordenadas sobre la imagen YA SIN MARCO (898×1295).
  // Explícitos a propósito: el encuadre de una persona no lo debe decidir un
  // algoritmo de entropía, que en la primera prueba eligió el plano equivocado.
  // Referencias medidas sobre la foto: cabeza y=290..540, cara centrada en
  // x=390, bandera desde y=700, libro desde y=1150.
  recorteHero:  { left: 170, top: 235, width: 440, height: 550 },  // 4:5, corta antes de la bandera
  recorteAbout: { left: 0,   top: 217, width: 898, height: 1078 }, // 5:6, plano completo

  // Umbral para detectar el marco negro perimetral.
  umbralMarco: 12,

  // Aspectos objetivo. Los marca la foto más limitante de cada tipo,
  // para que las tres etapas se lean como una secuencia.
  aspectoFrontal: 725 / 346,   // ≈ 2.10 — lo marca la de «durante», la más cuadrada
  aspectoOclusal: 654 / 522,   // ≈ 1.25 — lo marca «después superior»
  aspectoHero: 4 / 5,
  aspectoAbout: 5 / 6,

  calidad: 90,
};

const DESTINO = 'src/assets';
const DESTINO_CASO = path.join(DESTINO, 'caso-01');

function log(icono, msg) { console.log(`${icono} ${msg}`); }

async function listar(dir) {
  const archivos = (await readdir(dir)).filter((f) => /\.(jpe?g|png|webp|heic|tiff?)$/i.test(f));
  if (!archivos.length) return log('✗', `No hay imágenes en ${dir}`);

  console.log(`\n${archivos.length} imágenes en ${dir}:\n`);
  for (const f of archivos.sort()) {
    try {
      const { width, height } = await sharp(path.join(dir, f)).metadata();
      const ratio = (width / height).toFixed(2);
      console.log(`  ${String(width).padStart(5)}×${String(height).padEnd(5)}  ratio ${ratio.padEnd(5)}  ${f}`);
    } catch {
      console.log(`  ${'?'.padStart(11)}  (no se pudo leer)  ${f}`);
    }
  }
  console.log('\nRellena el MAPEO al inicio del script con estos nombres.\n');
}

/** Recorta al aspecto pedido sin ampliar, centrado. */
async function recortar(origen, salida, aspecto, { estrategia } = {}) {
  const img = sharp(origen);
  const { width, height } = await img.metadata();

  // El lado que sobra es el que se recorta.
  let w = width, h = Math.round(width / aspecto);
  if (h > height) { h = height; w = Math.round(height * aspecto); }

  await img
    .resize(w, h, {
      fit: 'cover',
      position: estrategia ?? sharp.strategy.entropy,
      withoutEnlargement: true,
    })
    .jpeg({ quality: AJUSTES.calidad, mozjpeg: true })
    .toFile(salida);

  return { w, h };
}

async function procesarRetrato(dir) {
  const origen = path.join(dir, MAPEO.retrato);
  if (!existsSync(origen)) return log('✗', `Falta el retrato: ${MAPEO.retrato}`);

  // 1. Fuera el marco negro perimetral.
  const sinMarco = await sharp(origen)
    .trim({ background: '#000000', threshold: AJUSTES.umbralMarco })
    .toBuffer();

  const { width, height } = await sharp(sinMarco).metadata();
  log('·', `Retrato sin marco: ${width}×${height}`);

  // 2. Fondo armonizado con la paleta del sitio.
  const armonizado = await sharp(sinMarco)
    .modulate({ saturation: AJUSTES.saturacionRetrato, brightness: AJUSTES.brilloRetrato })
    .toBuffer();

  // 3. Portada: plano corto de cabeza y hombros.
  const hero = path.join(DESTINO, 'doctora-retrato.jpg');
  await sharp(armonizado).extract(AJUSTES.recorteHero)
    .jpeg({ quality: AJUSTES.calidad, mozjpeg: true }).toFile(hero);
  log('✓', `${hero} — ${AJUSTES.recorteHero.width}×${AJUSTES.recorteHero.height}`);

  // 4. Sobre la doctora: plano completo, con la bandera y el libro.
  const about = path.join(DESTINO, 'doctora-titulacion.jpg');
  await sharp(armonizado).extract(AJUSTES.recorteAbout)
    .jpeg({ quality: AJUSTES.calidad, mozjpeg: true }).toFile(about);
  log('✓', `${about} — ${AJUSTES.recorteAbout.width}×${AJUSTES.recorteAbout.height}`);
}

async function procesarCaso(dir) {
  const piezas = [
    ['antesFrontal',    'antes-frontal.jpg',    AJUSTES.aspectoFrontal],
    ['duranteFrontal',  'durante-frontal.jpg',  AJUSTES.aspectoFrontal],
    ['despuesFrontal',  'despues-frontal.jpg',  AJUSTES.aspectoFrontal],
    ['antesSuperior',   'antes-superior.jpg',   AJUSTES.aspectoOclusal],
    ['despuesSuperior', 'despues-superior.jpg', AJUSTES.aspectoOclusal],
    ['antesInferior',   'antes-inferior.jpg',   AJUSTES.aspectoOclusal],
    ['despuesInferior', 'despues-inferior.jpg', AJUSTES.aspectoOclusal],
  ];

  for (const [clave, nombreSalida, aspecto] of piezas) {
    const origen = path.join(dir, MAPEO[clave]);
    if (!existsSync(origen)) { log('✗', `Falta ${MAPEO[clave]} (${clave})`); continue; }

    const salida = path.join(DESTINO_CASO, nombreSalida);
    const { w, h } = await recortar(origen, salida, aspecto, { estrategia: 'center' });
    log('✓', `${salida} — ${w}×${h}`);
  }
}

const [, , ...args] = process.argv;
const dir = args.filter((a) => !a.startsWith('--')).at(0);

if (!dir) {
  console.error('Uso: node scripts/preparar-imagenes.mjs [--listar] <carpeta-con-los-originales>');
  process.exit(1);
}
if (!existsSync(dir)) {
  console.error(`No existe la carpeta: ${dir}`);
  process.exit(1);
}

if (args.includes('--listar')) {
  await listar(dir);
} else {
  await mkdir(DESTINO_CASO, { recursive: true });
  await procesarRetrato(dir);
  await procesarCaso(dir);
  console.log('\nListo. Revisa los recortes antes de dar por bueno el resultado,');
  console.log('sobre todo el encuadre de la cara y el tono del fondo.\n');
}
