/**
 * Movimiento de la landing.
 *
 * Dos cosas que el CSS no puede saber sola:
 *  1. Qué fotos ya entraron en pantalla (máscara + escala).
 *  2. Cuánto se ha recorrido la página y cuánto se ha desplazado cada
 *     bloque con `data-parallax`.
 *
 * Todo se escribe en propiedades que no reflowean (`transform`, `scale`,
 * `translate`) y se calcula dentro de un `requestAnimationFrame` como
 * mucho una vez por fotograma. Con movimiento reducido, el paralaje no
 * se aplica: el CSS ya deja las fotos quietas y visibles.
 */

const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
const punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)');

/* ---------- Fotos ---------- */
const fotos = Array.from(document.querySelectorAll<HTMLElement>('[data-foto]'));
const revelarFoto = (el: Element) => el.classList.add('foto-in');

if ('IntersectionObserver' in window) {
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        revelarFoto(entrada.target);
        observador.unobserve(entrada.target);
      }
    },
    { threshold: 0.16, rootMargin: '0px 0px -6% 0px' }
  );
  fotos.forEach((foto) => observador.observe(foto));

  // Red de seguridad: si el observer deja de emitir (pestaña en segundo
  // plano, navegador sin compositing), la foto se muestra igual.
  window.setTimeout(() => fotos.forEach(revelarFoto), 8000);
} else {
  fotos.forEach(revelarFoto);
}

/* ---------- Progreso, acercamiento y paralaje ---------- */
const barra = document.querySelector<HTMLElement>('.progreso');
const bloques = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
const acercables = Array.from(document.querySelectorAll<HTMLElement>('[data-zoom]'));
let pendiente = false;

function pintar() {
  pendiente = false;

  const recorrido = document.documentElement.scrollHeight - window.innerHeight;
  if (barra) {
    const avance = recorrido > 0 ? Math.min(1, Math.max(0, window.scrollY / recorrido)) : 0;
    barra.style.setProperty('--avance', avance.toFixed(4));
  }

  // Acercamiento: la foto crece despacio mientras cruza la pantalla. Se
  // mide en fracción de su propio recorrido, así que no importa la altura
  // de la sección.
  if (!reducido.matches) {
    for (const bloque of acercables) {
      const caja = bloque.getBoundingClientRect();
      if (caja.height === 0) continue;
      const progreso = (window.innerHeight - caja.top) / (window.innerHeight + caja.height);
      const avance = Math.min(1, Math.max(0, progreso));
      const factor = Number.parseFloat(bloque.dataset.zoom || '0') || 0;
      bloque.style.setProperty('--zoom', (1 + avance * factor).toFixed(4));
    }
  } else {
    for (const bloque of acercables) bloque.style.removeProperty('--zoom');
  }

  const activo = !reducido.matches && punteroFino.matches && window.innerWidth >= 860;
  if (!activo) {
    for (const bloque of bloques) bloque.style.translate = '';
    return;
  }

  const alto = window.innerHeight;
  for (const bloque of bloques) {
    const caja = bloque.getBoundingClientRect();
    if (caja.bottom < -160 || caja.top > alto + 160) continue;

    const factor = Number.parseFloat(bloque.dataset.parallax || '0') || 0;
    const centro = caja.top + caja.height / 2;
    const desplazamiento = (centro - alto / 2) * -factor;
    bloque.style.translate = `0 ${desplazamiento.toFixed(1)}px`;
  }
}

function pedirPintado() {
  if (pendiente) return;
  pendiente = true;
  window.requestAnimationFrame(pintar);
}

window.addEventListener('scroll', pedirPintado, { passive: true });
window.addEventListener('resize', pedirPintado);
reducido.addEventListener('change', pedirPintado);
pedirPintado();
