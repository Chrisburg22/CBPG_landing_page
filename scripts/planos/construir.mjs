// Genera planos.html a partir de docs/uml/*.md y docs/panel/hallazgos.md.
// Nada se copia a mano: cada diagrama, tabla y texto sale de los Markdown.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.argv[2];
const SALIDA = process.argv[3];
const REPO = 'https://github.com/Chrisburg22/CBPG_landing_page/blob/main';
const COMMIT = '9926673';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ZONAS = [
  { n: 1, archivo: '01-requisitos.md', id: 'requisitos', pregunta: '¿Qué debe hacer y bajo qué condiciones?' },
  { n: 2, archivo: '02-casos-de-uso.md', id: 'casos-de-uso', pregunta: '¿Quién lo usa y para qué?' },
  { n: 3, archivo: '03-estructura.md', id: 'estructura', pregunta: '¿De qué piezas está hecho?' },
  { n: 4, archivo: '04-actividad.md', id: 'actividad', pregunta: '¿Cómo fluye cada proceso?' },
  { n: 5, archivo: '05-estados.md', id: 'estados', pregunta: '¿Por qué estados pasa cada cosa?' },
  { n: 6, archivo: '06-secuencia.md', id: 'secuencia', pregunta: '¿Quién le habla a quién, y en qué orden?' },
  { n: 7, archivo: '07-trazabilidad.md', id: 'trazabilidad', pregunta: '¿Dónde está cada cosa en el código y qué la prueba?' },
  { n: 8, archivo: '08-decisiones.md', id: 'decisiones', pregunta: '¿Qué se decidió, qué cuesta y qué cambiará?' },
];

/** Enlaces entre documentos: a anclas de esta página o a GitHub. */
function enlace(href) {
  const m = href.match(/^(0\d)-[a-z-]+\.md$/);
  if (m) return `#${ZONAS[Number(m[1]) - 1].id}`;
  if (href.startsWith('../panel/')) return `${REPO}/docs/panel/${href.slice(9)}`;
  if (href.startsWith('http')) return href;
  return `${REPO}/docs/uml/${href}`;
}

function enLinea(texto) {
  let s = esc(texto);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, h) => {
    const destino = enlace(h.replace(/&amp;/g, '&'));
    const externo = destino.startsWith('http');
    return `<a href="${attr(destino)}"${externo ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
  });
  // Referencias a hallazgos: se vuelven chips que llevan a la zona de hallazgos.
  s = s.replace(/\b([HU]-\d{2})\b(?![^<]*<\/a>)/g, '<a class="ref" href="#hallazgo-$1">$1</a>');
  return s;
}

function tabla(lineas) {
  const filas = lineas.map((l) =>
    l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim())
  );
  const [cab, , ...cuerpo] = filas;
  const th = cab.map((c) => `<th scope="col">${enLinea(c)}</th>`).join('');
  const tr = cuerpo.map((f) => `<tr>${f.map((c, i) => (i === 0 ? `<th scope="row">${enLinea(c)}</th>` : `<td>${enLinea(c)}</td>`)).join('')}</tr>`).join('\n');
  return `<div class="tabla-marco"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
}

/** Ancho de la tarjeta según el tipo de diagrama: lo ancho ocupa la fila. */
function anchoDe(mermaid) {
  const primera = mermaid.trim().split('\n')[0];
  if (/^(sequenceDiagram|stateDiagram)/.test(primera)) return 'media';
  if (/^flowchart (TD|TB)/.test(primera)) return 'media';
  return 'completa';
}

let diagramas = 0;
let tablas = 0;

function bloques(lineas, codigo) {
  const out = [];
  let i = 0;
  let ancho = 'completa';
  let tieneDiagrama = false;
  while (i < lineas.length) {
    const l = lineas[i];
    if (l.startsWith('```mermaid')) {
      const cuerpo = [];
      i++;
      while (i < lineas.length && !lineas[i].startsWith('```')) cuerpo.push(lineas[i++]);
      i++;
      const src = cuerpo.join('\n');
      ancho = anchoDe(src);
      tieneDiagrama = true;
      diagramas++;
      out.push(`<figure class="plano" data-plano>
  <div class="plano__barra" role="toolbar" aria-label="Zoom de ${attr(codigo || 'diagrama')}">
    <button type="button" data-zoom="ajustar" aria-pressed="true">Ajustar</button>
    <button type="button" data-zoom="menos" aria-label="Alejar">−</button>
    <output data-escala>100%</output>
    <button type="button" data-zoom="mas" aria-label="Acercar">+</button>
    <button type="button" data-zoom="completa">Pantalla completa</button>
  </div>
  <div class="plano__hoja" data-hoja tabindex="0"><pre class="mermaid">${esc(src)}</pre></div>
</figure>`);
      continue;
    }
    if (l.startsWith('|')) {
      const t = [];
      while (i < lineas.length && lineas[i].startsWith('|')) t.push(lineas[i++]);
      tablas++;
      out.push(tabla(t));
      continue;
    }
    if (/^(- |\d+\. )/.test(l)) {
      const ordenada = /^\d+\. /.test(l);
      const items = [];
      while (i < lineas.length && /^(- |\d+\. )/.test(lineas[i])) {
        items.push(`<li>${enLinea(lineas[i].replace(/^(- |\d+\. )/, ''))}</li>`);
        i++;
      }
      out.push(ordenada ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
      continue;
    }
    if (l.startsWith('> ')) {
      out.push(`<p class="nota">${enLinea(l.slice(2))}</p>`);
      i++;
      continue;
    }
    if (l.trim()) out.push(`<p>${enLinea(l)}</p>`);
    i++;
  }
  return { html: out.join('\n'), ancho: tieneDiagrama ? ancho : 'completa' };
}

function leerZona(z) {
  const texto = readFileSync(join(RAIZ, 'docs/uml', z.archivo), 'utf8').replace(/\r/g, '');
  const lineas = texto.split('\n');
  const titulo = lineas[0].replace(/^# \d+ · /, '');
  const intro = [];
  const secciones = [];
  let actual = null;
  for (const l of lineas.slice(1)) {
    if (l.startsWith('## ')) {
      actual = { titulo: l.slice(3).trim(), lineas: [] };
      secciones.push(actual);
    } else if (actual) actual.lineas.push(l);
    else intro.push(l);
  }
  let hoja = 0;
  const tarjetas = secciones.map((s) => {
    const m = s.titulo.match(/^([A-Z]{1,2}-\d{2}) · (.+)$/);
    const codigo = m ? m[1] : '';
    const nombre = m ? m[2] : s.titulo;
    hoja++;
    // Sub-secciones ### (los ADR) se vuelven bloques con su propio título.
    const partes = [];
    let buf = [];
    let sub = null;
    const cerrar = () => {
      const b = bloques(buf, codigo);
      partes.push(sub ? `<section class="sub" id="${slug(sub)}"><h4>${enLinea(sub)}</h4>${b.html}</section>` : b.html);
      return b.ancho;
    };
    let ancho = 'completa';
    for (const l of s.lineas) {
      if (l.startsWith('### ')) {
        if (buf.length || sub) ancho = cerrar();
        sub = l.slice(4).trim();
        buf = [];
      } else buf.push(l);
    }
    const ultimo = cerrar();
    if (!s.lineas.some((l) => l.startsWith('### '))) ancho = ultimo;
    const id = codigo ? slug(codigo) : `${z.id}-${slug(nombre)}`;
    const texto = [codigo, nombre, ...s.lineas].join(' ').toLowerCase();
    return { id, codigo, nombre, hoja: `${z.n}.${hoja}`, html: partes.join('\n'), ancho, texto };
  });
  return { ...z, titulo, intro: bloques(intro, '').html, tarjetas };
}

const zonas = ZONAS.map(leerZona);

// Hallazgos: filas de las tablas de hallazgos.md
const hall = readFileSync(join(RAIZ, 'docs/panel/hallazgos.md'), 'utf8').split('\n');
const hallazgos = hall
  .filter((l) => /^\| [HU]-\d{2} \|/.test(l))
  .map((l) => {
    const c = l.replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
    return { id: c[0], sev: c[1], donde: c[2], texto: c[3], codigo: c[4], mejora: c[5] };
  });
const ORDEN = { alta: 0, media: 1, baja: 2 };
hallazgos.sort((a, b) => ORDEN[a.sev] - ORDEN[b.sev] || a.id.localeCompare(b.id));
const cuentaSev = hallazgos.reduce((m, h) => ((m[h.sev] = (m[h.sev] ?? 0) + 1), m), {});

// Videos del manual: la tabla de docs/panel/README.md y los mp4 de docs/panel/videos.
const SECCION_VIDEO = {
  '01': ['Acceso', 'acceso-y-roles'],
  '02': ['Inicio', 'inicio'],
  '03': ['Prospectos', 'prospectos'],
  '04': ['Agenda', 'agenda'],
  '05': ['Convertir en paciente', 'prospectos'],
  '06': ['Pacientes', 'pacientes'],
  '07': ['Pagos', 'pagos'],
  '08': ['Google Calendar', 'google'],
};
const videos = readFileSync(join(RAIZ, 'docs/panel/README.md'), 'utf8')
  .split('\n')
  .filter((l) => /^\| 0\d \| `videos\//.test(l))
  .map((l) => {
    const c = l.replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
    const archivo = c[1].replace(/`/g, '');
    const nombre = archivo.replace('videos/', '').replace('.mp4', '');
    const [titulo, doc] = SECCION_VIDEO[c[0]] ?? [nombre, 'README'];
    return { n: c[0], archivo, poster: archivo.replace('.mp4', '.jpg'), titulo, que: c[2], doc };
  });
const tarjetasVideo = videos
  .map(
    (v) => `<article class="video" id="video-${v.n}" data-texto="${attr([v.n, v.titulo, v.que, 'video'].join(' ').toLowerCase())}">
  <video controls playsinline preload="none" poster="${v.poster}" aria-label="Video ${v.n}: ${attr(v.titulo)}">
    <source src="${v.archivo}" type="video/mp4">
  </video>
  <div class="video__pie">
    <span class="hoja__codigo">V-${v.n}</span>
    <div><h3>${esc(v.titulo)}</h3><p>${esc(v.que)}</p></div>
  </div>
  <a class="video__doc" href="${REPO}/docs/panel/${v.doc}.md" target="_blank" rel="noopener">Guía escrita</a>
</article>`
  )
  .join('\n');

const plantilla = readFileSync(join(process.argv[4]), 'utf8');

const nav = zonas
  .map((z) => `<li><a href="#${z.id}" data-nav="${z.id}"><span class="nav__n">${z.n}</span><span class="nav__t">${esc(z.titulo)}</span><span class="nav__c">${z.tarjetas.length}</span></a></li>`)
  .join('\n');

const indice = zonas
  .map(
    (z) => `<a class="indice__zona" href="#${z.id}" style="--z: var(--zona-${z.n})">
  <span class="indice__n">${z.n}</span>
  <span class="indice__t">${esc(z.titulo)}</span>
  <span class="indice__p">${esc(z.pregunta)}</span>
  <span class="indice__codigos">${z.tarjetas.map((t) => (t.codigo ? `<code>${t.codigo}</code>` : '')).join(' ')}</span>
</a>`
  )
  .join('\n');

const cuerpo = zonas
  .map(
    (z) => `<section class="zona" id="${z.id}" style="--z: var(--zona-${z.n})" aria-labelledby="t-${z.id}">
  <header class="zona__cabecera">
    <p class="zona__eyebrow">Zona ${z.n} · ${z.tarjetas.length} ${z.tarjetas.length === 1 ? 'hoja' : 'hojas'}</p>
    <h2 id="t-${z.id}">${esc(z.titulo)}</h2>
    <p class="zona__pregunta">${esc(z.pregunta)}</p>
    <div class="zona__intro">${z.intro}</div>
  </header>
  <div class="rejilla">
${z.tarjetas
  .map(
    (t) => `<article class="hoja hoja--${t.ancho}" id="${t.id}" data-texto="${attr(t.texto)}">
  <header class="hoja__cabecera">
    ${t.codigo ? `<span class="hoja__codigo">${t.codigo}</span>` : ''}
    <h3>${enLinea(t.nombre)}</h3>
    <span class="hoja__num" title="Zona.hoja">Hoja ${t.hoja}</span>
  </header>
  <div class="hoja__cuerpo">${t.html}</div>
</article>`
  )
  .join('\n')}
  </div>
</section>`
  )
  .join('\n');

const listaHallazgos = hallazgos
  .map(
    (h) => `<article class="hallazgo" id="hallazgo-${h.id}" data-texto="${attr([h.id, h.sev, h.donde, h.texto].join(' ').toLowerCase())}">
  <div class="hallazgo__meta"><span class="sev sev--${h.sev}">${h.sev}</span><span class="hallazgo__id">${h.id}</span><span class="hallazgo__donde">${enLinea(h.donde)}</span></div>
  <p class="hallazgo__texto">${enLinea(h.texto)}</p>
  <details><summary>Dónde y qué hacer</summary><p><strong>Código:</strong> ${enLinea(h.codigo)}</p><p><strong>Mejora:</strong> ${enLinea(h.mejora)}</p></details>
</article>`
  )
  .join('\n');

const altas = hallazgos.filter((h) => h.sev === 'alta');

const html = plantilla
  .replaceAll('{{NAV}}', nav)
  .replaceAll('{{INDICE}}', indice)
  .replaceAll('{{ZONAS}}', cuerpo)
  .replaceAll('{{HALLAZGOS}}', listaHallazgos)
  .replaceAll('{{VIDEOS}}', tarjetasVideo)
  .replaceAll('{{N_VIDEOS}}', String(videos.length))
  .replaceAll('{{N_DIAGRAMAS}}', String(diagramas))
  .replaceAll('{{N_TABLAS}}', String(tablas))
  .replaceAll('{{N_HOJAS}}', String(zonas.reduce((n, z) => n + z.tarjetas.length, 0)))
  .replaceAll('{{N_HALLAZGOS}}', String(hallazgos.length))
  .replaceAll('{{SEV_ALTA}}', String(cuentaSev.alta ?? 0))
  .replaceAll('{{SEV_MEDIA}}', String(cuentaSev.media ?? 0))
  .replaceAll('{{SEV_BAJA}}', String(cuentaSev.baja ?? 0))
  .replaceAll('{{ALTAS}}', altas.map((h) => `<li><a href="#hallazgo-${h.id}"><span class="sev sev--alta">${h.id}</span> ${enLinea(h.texto.replace(/\*\*/g, '').split('. ')[0])}.</a></li>`).join('\n'))
  .replaceAll('{{COMMIT}}', COMMIT)
  .replaceAll('{{REPO}}', REPO);

writeFileSync(SALIDA, html);
console.log({ videos: videos.length, diagramas, tablas, hojas: zonas.map((z) => [z.id, z.tarjetas.length]), hallazgos: hallazgos.length, bytes: html.length });
