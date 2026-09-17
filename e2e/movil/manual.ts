import type { Page } from '@playwright/test';
import { entrarAlPanel } from '../apoyo';
import { ocultarAjenos } from './auditar';
import { NOMBRES_DEMO } from './escenario';

/** Filas que pueden traer datos reales. Mismo criterio que `ocultarAjenos`. */
const FILAS = 'tbody tr, .cola__fila, .linea__item, a[data-cita], .fuera__lista li, .agenda-lista li, select option';

/**
 * Utilidades de los videos del manual.
 *
 * Playwright no pinta el dedo ni narra: sin rótulos ni marcas de toque, un
 * video de teléfono es una sucesión de pantallas que cambian solas.
 */

/** Se inyecta en cada carga: marca de toque, caja de rótulos y desenfoque de filas reales. */
export async function prepararGrabacion(page: Page): Promise<void> {
  await page.addInitScript(({ nombres, filas }) => {
    // Antes del primer pintado: todas las filas nacen desenfocadas y solo se
    // enfocan las de la demo. Al revés habría un destello de datos reales en
    // cada carga, y el video lo captura.
    const velo = document.createElement('style');
    velo.textContent = `${filas.split(',').map((f) => `${f.trim()}:not([data-demo])`).join(',')} { filter: blur(7px); }`;
    document.documentElement.appendChild(velo);
    const marcar = () => {
      for (const el of document.querySelectorAll<HTMLElement>(filas)) {
        if (nombres.some((n) => (el.textContent ?? '').includes(n))) el.dataset.demo = '1';
      }
    };
    new MutationObserver(marcar).observe(document.documentElement, { childList: true, subtree: true });
    const montar = () => {
      marcar();
      if (document.getElementById('manual-estilos')) return;
      const estilo = document.createElement('style');
      estilo.id = 'manual-estilos';
      estilo.textContent = `
        .manual-toque { position: fixed; z-index: 2147483647; width: 44px; height: 44px; margin: -22px 0 0 -22px;
          border-radius: 50%; background: rgba(36,95,89,.28); border: 2px solid rgba(36,95,89,.85);
          pointer-events: none; animation: manual-toque .6s ease-out forwards; }
        @keyframes manual-toque { from { transform: scale(.4); opacity: 1 } to { transform: scale(1.3); opacity: 0 } }
        #manual-rotulo { position: fixed; z-index: 2147483646; left: 12px; right: 12px; top: 12px;
          padding: 12px 14px; border-radius: 14px; background: rgba(23,63,59,.94); color: #fff;
          font: 600 15px/1.35 system-ui, sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,.25);
          pointer-events: none; transition: opacity .25s; opacity: 0; }
        #manual-rotulo small { display: block; font-weight: 500; opacity: .8; font-size: 12.5px; margin-bottom: 2px; }
      `;
      document.head.appendChild(estilo);
      const caja = document.createElement('div');
      caja.id = 'manual-rotulo';
      document.body.appendChild(caja);
      const previo = sessionStorage.getItem('manual-rotulo');
      if (previo) {
        caja.innerHTML = previo;
        caja.style.opacity = '1';
      }
    };
    document.addEventListener('DOMContentLoaded', montar);
    document.addEventListener(
      'pointerdown',
      (e) => {
        const punto = document.createElement('div');
        punto.className = 'manual-toque';
        punto.style.left = `${e.clientX}px`;
        punto.style.top = `${e.clientY}px`;
        document.body.appendChild(punto);
        setTimeout(() => punto.remove(), 700);
      },
      true
    );
  }, { nombres: NOMBRES_DEMO as string[], filas: FILAS });
}

export function pausa(page: Page, ms = 1200): Promise<void> {
  return page.waitForTimeout(ms);
}

/**
 * Pone un rótulo arriba. Sobrevive a la navegación (sessionStorage) hasta que
 * se cambie o se quite, para que no parpadee en cada redirect.
 */
export async function rotulo(page: Page, paso: string, texto: string, ms = 2200): Promise<void> {
  const html = `<small>${paso}</small>${texto}`;
  await page.evaluate((h) => {
    sessionStorage.setItem('manual-rotulo', h);
    const caja = document.getElementById('manual-rotulo');
    if (caja) {
      caja.innerHTML = h;
      caja.style.opacity = '1';
    }
  }, html);
  await pausa(page, ms);
}

export async function quitarRotulo(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.removeItem('manual-rotulo');
    const caja = document.getElementById('manual-rotulo');
    if (caja) caja.style.opacity = '0';
  });
}

/** Entra y deja la pantalla lista para grabar (sin filas reales a la vista). */
export async function entrarParaGrabar(page: Page, destino = '/admin'): Promise<void> {
  await entrarAlPanel(page, destino);
  await limpiarVista(page);
}

/** Tras cada navegación: esperar y desenfocar lo que no es de la demo. */
export async function limpiarVista(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => {});
  await ocultarAjenos(page);
}

/** Desplaza suave hasta un elemento, para que el video enseñe el recorrido. */
export async function llevarA(page: Page, selector: ReturnType<Page['locator']>): Promise<void> {
  await selector.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await pausa(page, 900);
}

/** Toca una pestaña de la barra de abajo. */
export async function irASeccion(page: Page, nombre: RegExp): Promise<void> {
  await page.getByRole('navigation', { name: 'Secciones del panel' }).getByRole('link', { name: nombre }).click();
  await limpiarVista(page);
}
