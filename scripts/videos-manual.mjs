#!/usr/bin/env node
/**
 * Pasa los videos de `pnpm manual` a mp4 con su nombre final.
 *
 *   manual-video/<carpeta de la prueba>/video.webm  →  docs/panel/videos/NN-seccion.mp4
 *
 * El número y el nombre salen del título de la prueba («01-acceso»), que
 * Playwright deja dentro del nombre de la carpeta. Además saca un póster (el
 * cuadro del segundo 3) para las páginas del manual.
 *
 * H.264 + yuv420p porque es lo único que reproduce Safari en iPhone sin quejas,
 * y `+faststart` para que empiece a verse antes de descargarse entero.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ORIGEN = 'manual-video';
const DESTINO = join('docs', 'panel', 'videos');

if (!existsSync(ORIGEN)) {
  console.error(`No existe ${ORIGEN}/. Corre antes: pnpm manual`);
  process.exit(1);
}
mkdirSync(DESTINO, { recursive: true });

const carpetas = readdirSync(ORIGEN).filter((d) => statSync(join(ORIGEN, d)).isDirectory());
let hechos = 0;

for (const carpeta of carpetas) {
  const nombre = carpeta.match(/(\d{2}-[a-z]+)/)?.[1];
  const webm = join(ORIGEN, carpeta, 'video.webm');
  if (!nombre || !existsSync(webm)) continue;

  const mp4 = join(DESTINO, `${nombre}.mp4`);
  const poster = join(DESTINO, `${nombre}.jpg`);
  execFileSync(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '28',
      '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-movflags', '+faststart', '-an', mp4],
    { stdio: 'inherit' }
  );
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '3', '-i', mp4, '-frames:v', '1', '-q:v', '4', poster], {
    stdio: 'inherit',
  });
  const mb = (statSync(mp4).size / 1024 / 1024).toFixed(1);
  console.log(`✓ ${mp4} (${mb} MB)`);
  hechos++;
}

if (hechos === 0) {
  console.error('No se encontró ningún video. ¿Terminó bien `pnpm manual`?');
  process.exit(1);
}
