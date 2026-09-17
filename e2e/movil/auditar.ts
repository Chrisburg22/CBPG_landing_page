import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NOMBRES_DEMO } from './escenario';

/**
 * Revisión automática de una pantalla del panel a tamaño de teléfono.
 *
 * Anota, no falla: cada hallazgo va a `test-results/movil/hallazgos.jsonl` con
 * su captura, y el informe se escribe a partir de ese archivo. Lo único que
 * rompe la prueba es un error del servidor, que es regresión y no opinión.
 */

export type Severidad = 'alta' | 'media' | 'baja';

export interface Hallazgo {
  proyecto: string;
  pantalla: string;
  regla: string;
  severidad: Severidad;
  detalle: string;
  captura?: string;
}

const DIR = join('test-results', 'movil');

export function anotar(info: TestInfo, h: Omit<Hallazgo, 'proyecto'>): void {
  mkdirSync(DIR, { recursive: true });
  const fila: Hallazgo = { proyecto: info.project.name, ...h };
  appendFileSync(join(DIR, 'hallazgos.jsonl'), `${JSON.stringify(fila)}\n`);
  info.annotations.push({ type: `${h.severidad}:${h.regla}`, description: `${h.pantalla} — ${h.detalle}` });
}

/**
 * Vigila la página entera: cualquier respuesta 5xx del propio panel y cualquier
 * error de JavaScript se apuntan y hacen fallar la prueba al final.
 */
export function vigilar(page: Page, info: TestInfo): () => void {
  const errores: string[] = [];
  page.on('response', (r) => {
    const url = new URL(r.url());
    if (r.status() >= 500 && url.pathname.startsWith('/admin')) {
      errores.push(`${r.status()} ${r.request().method()} ${url.pathname}`);
    }
  });
  page.on('pageerror', (e) => errores.push(`JS: ${e.message}`));
  return () => {
    for (const e of errores) {
      anotar(info, { pantalla: 'global', regla: 'error-servidor', severidad: 'alta', detalle: e });
    }
    expect(errores, 'errores del servidor o de JavaScript').toEqual([]);
  };
}

/**
 * Desenfoca lo que no sea de la demo.
 *
 * La base es la de producción: los listados enseñan también filas reales, y
 * esas no pueden salir en una captura ni en un video. Se desenfoca por fila —
 * filas de tabla, elementos de cola, bloques de agenda, opciones de lista—
 * cuando su texto no contiene ninguno de los nombres inventados.
 */
export async function ocultarAjenos(page: Page): Promise<void> {
  await page.evaluate((nombres) => {
    const FILAS = [
      'tbody tr',
      '.cola__fila',
      '.linea__item',
      'a[data-cita]',
      '.historial__item',
      '.fuera__lista li',
      '.agenda-lista li',
      '.resumen li',
      'select option',
    ].join(',');
    for (const el of document.querySelectorAll<HTMLElement>(FILAS)) {
      const texto = el.textContent ?? '';
      const esDemo = nombres.some((n) => texto.includes(n));
      // Filas sin nombre propio (historial de acciones, totales) se dejan.
      const tieneNombre = /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+ [A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(texto);
      if (!esDemo && tieneNombre && !el.closest('.historial')) {
        el.style.filter = 'blur(6px)';
        el.dataset.ocultoPorDemo = '1';
      }
    }
  }, NOMBRES_DEMO as string[]);
}

interface Medidas {
  anchoPagina: number;
  anchoVentana: number;
  desbordan: string[];
  chicos: { sel: string; w: number; h: number; enLinea: boolean }[];
  recortados: string[];
  tapados: string[];
}

/** Las comprobaciones que se hacen dentro del navegador, en una sola ida. */
async function medir(page: Page): Promise<Medidas> {
  return page.evaluate(() => {
    const describir = (el: Element) => {
      const clase = (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).slice(0, 2).join('.');
      const texto = (el.textContent ?? el.getAttribute('aria-label') ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return `${el.tagName.toLowerCase()}${clase ? `.${clase}` : ''}${texto ? ` «${texto}»` : ''}`;
    };
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('[hidden], details:not([open]) > :not(summary)');
    };
    const ancho = document.documentElement.clientWidth;

    const desbordan: string[] = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > ancho + 1) {
        // Solo el más externo: dentro de un contenedor con scroll horizontal propio es intencional.
        let p = el.parentElement;
        let enScroll = false;
        while (p) {
          const ox = getComputedStyle(p).overflowX;
          if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') { enScroll = true; break; }
          p = p.parentElement;
        }
        const padreDesborda = el.parentElement && el.parentElement.getBoundingClientRect().right > ancho + 1;
        if (!enScroll && !padreDesborda) desbordan.push(`${describir(el)} (+${Math.round(r.right - ancho)}px)`);
      }
    }

    const chicos: Medidas['chicos'] = [];
    for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]')) {
      if (!visible(el) || el.closest('.nav-panel .nav-panel__marca')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 44 || r.height < 44) {
        const s = getComputedStyle(el);
        // Un enlace dentro de un párrafo es una excepción de WCAG 2.5.8: se anota aparte.
        const enLinea = el.tagName === 'A' && s.display === 'inline';
        chicos.push({ sel: describir(el), w: Math.round(r.width), h: Math.round(r.height), enLinea });
      }
    }

    const recortados: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('.chip, .btn, .fchip, h1, h2, .tabla__nombre, .cola__quien a, .bloque, label')) {
      if (!visible(el)) continue;
      const s = getComputedStyle(el);
      if (s.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) recortados.push(describir(el));
      else if (s.overflow === 'hidden' && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2)) recortados.push(describir(el));
    }

    // La barra de pestañas es fija: lo último de la página no puede quedar debajo
    // al llegar al final del scroll.
    const tapados: string[] = [];
    const barra = document.querySelector('.nav-panel');
    if (barra && getComputedStyle(barra).position === 'fixed') {
      window.scrollTo(0, document.documentElement.scrollHeight);
      const tope = barra.getBoundingClientRect().top;
      const controles = [...document.querySelectorAll('main button, main a.btn, main input, main select, main textarea')].filter(visible);
      const ultimo = controles.at(-1);
      if (ultimo && ultimo.getBoundingClientRect().bottom > tope + 1) tapados.push(describir(ultimo));
      window.scrollTo(0, 0);
    }

    return {
      anchoPagina: document.documentElement.scrollWidth,
      anchoVentana: ancho,
      desbordan: [...new Set(desbordan)].slice(0, 8),
      chicos,
      recortados: [...new Set(recortados)].slice(0, 8),
      tapados,
    };
  });
}

/**
 * Audita la pantalla abierta y deja su captura de página completa.
 * `pantalla` es un nombre corto y estable: acaba en el nombre del archivo.
 */
export async function auditarPantalla(page: Page, info: TestInfo, pantalla: string): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => {});
  await ocultarAjenos(page);

  const dir = join(DIR, 'capturas', info.project.name);
  mkdirSync(dir, { recursive: true });
  const captura = join(dir, `${pantalla}.png`);
  await page.screenshot({ path: captura, fullPage: true });

  const m = await medir(page);
  const base = { pantalla, captura };

  if (m.anchoPagina > m.anchoVentana + 1) {
    anotar(info, {
      ...base,
      regla: 'scroll-horizontal',
      severidad: 'alta',
      detalle: `La página mide ${m.anchoPagina}px en una pantalla de ${m.anchoVentana}px. Se salen: ${m.desbordan.join('; ') || 'sin culpable claro'}`,
    });
  }
  const bloque = m.chicos.filter((c) => !c.enLinea);
  if (bloque.length) {
    anotar(info, {
      ...base,
      regla: 'area-tactil',
      severidad: bloque.some((c) => c.h < 32) ? 'media' : 'baja',
      detalle: `${bloque.length} controles por debajo de 44×44: ${bloque.slice(0, 8).map((c) => `${c.sel} ${c.w}×${c.h}`).join('; ')}`,
    });
  }
  const enLinea = m.chicos.filter((c) => c.enLinea);
  if (enLinea.length) {
    anotar(info, {
      ...base,
      regla: 'enlace-en-linea-chico',
      severidad: 'baja',
      detalle: `${enLinea.length} enlaces de texto con área menor a 44 px de alto: ${enLinea.slice(0, 6).map((c) => `${c.sel} ${c.w}×${c.h}`).join('; ')}`,
    });
  }
  if (m.recortados.length) {
    anotar(info, { ...base, regla: 'texto-recortado', severidad: 'media', detalle: m.recortados.join('; ') });
  }
  if (m.tapados.length) {
    anotar(info, { ...base, regla: 'tapado-por-barra', severidad: 'alta', detalle: m.tapados.join('; ') });
  }

  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .exclude('[data-oculto-por-demo]')
    .analyze();
  for (const v of axe.violations) {
    anotar(info, {
      ...base,
      regla: `axe:${v.id}`,
      severidad: v.impact === 'critical' || v.impact === 'serious' ? 'media' : 'baja',
      detalle: `${v.help} (${v.nodes.length}): ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join('; ')}`,
    });
  }
}
