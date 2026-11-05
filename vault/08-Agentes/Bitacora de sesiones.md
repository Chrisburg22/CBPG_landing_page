---
tipo: bitacora
area: agentes
estado: verificado
actualizado: 2026-10-27
resumen: Una entrada por conversación, de la más reciente a la más antigua.
tags:
  - agentes
  - bitacora
---

# Bitacora de sesiones

Una entrada por conversación, de la más reciente a la más antigua. Sirve para
que la siguiente sesión sepa qué se decidió y qué quedó pendiente sin releer el
historial completo.

## Plantilla

```markdown
## AAAA-MM-DD — Objetivo en una línea

- **Objetivo**: qué se quería lograr.
- **Cambios**: archivos y comportamiento; enlaces a las notas tocadas.
- **Decisión**: lo que la siguiente sesión necesita saber y por qué.
- **Verificación**: comandos que pasaron y qué quedó sin probar.
- **Pendiente**: riesgos, datos que faltan, migraciones sin aplicar.
```

## 2026-11-04 — Rediseño editorial de la landing y movimiento

- **Objetivo**: que la landing se sienta como un consultorio de autor y no como
  una plantilla, y que la foto de la doctora tenga presencia real.
- **Cambios**: `src/styles/landing.css` (nuevo) con toda la capa editorial,
  importada solo desde `src/pages/index.astro` y activada por `body.landing`
  (prop `bodyClass` en `Layout.astro`, que además carga Inter Tight). Tokens
  nuevos al final de `src/styles/tokens.css`. Componentes reescritos: `Nav`,
  `Hero`, `Strip`, `About`, `Treatments`, `CaseStudy`, `Process`, `Contact`,
  `FAQ`, `Footer`. Movimiento en `src/scripts/landing-scroll.ts` (nuevo):
  revelado de fotos con `clip-path`, acercamiento `[data-zoom]`, paralaje
  `[data-parallax]` y barra `.progreso`. Ver [[Landing y contenido]].
- **Decisión**: el hero queda **solo tipográfico**; se borra
  `src/assets/doctora-retrato.jpg` y su paso en `scripts/preparar-imagenes.mjs`.
  La foto de «Sobre la doctora» pasa a dominar la sección: montaje sobre papel,
  etiqueta de archivo y acercamiento ligado al scroll. Nada de librerías (ni
  GSAP ni Lenis): todo en `requestAnimationFrame`, y con
  `prefers-reduced-motion` no se mueve nada.
- **Verificación**: `pnpm check` (0 errores), `pnpm build` +
  `pnpm verify:build` (60 archivos, ningún `/admin` estático), sin desbordes en
  320/390/768/900/1024/1440, consola limpia, comparadores intactos. **Sin
  probar**: los e2e siguen sin correr por falta de `E2E_ADMIN_PASSWORD`.
- **Pendiente**: la doctora debe aprobar la cinta de tratamientos (sustituyó a
  la de certificaciones, que no eran verificables), los titulares en mayúsculas
  y el copy del caso clínico.

## 2026-10-28 — Guía de la doctora y recibo por pago

- **Objetivo**: que la doctora aprenda a usar la plataforma sin leer diez
  páginas por sección ni depender de alguien que se la explique, y que cada
  pago tenga un comprobante que pueda entregar.
- **Cambios**: `docs/panel/guia-doctora.md` (nuevo): qué es el panel y qué no
  hace, primer acceso, primer día, rutina diaria/semanal/mensual, diez tareas
  paso a paso, cómo leer el dinero, diez cuidados que evitan errores,
  solución de problemas, chuleta y glosario. `docs/panel/README.md` la enlaza
  como primera entrada. **Recibo**: `src/pages/admin/pagos/recibo/[id].astro`,
  `src/components/admin/Recibo.astro`, `src/layouts/ReciboLayout.astro` y
  `src/styles/recibo.css`; el pago redirige al recibo al guardarse y se enlaza
  desde Movimientos e Historial de pagos.
- **Decisión**: la guía se organiza por **trabajo de la doctora**, no por menú;
  no repite los diagramas ni los videos de las páginas por sección. Se
  verificaron los rótulos contra el código (el campo es **Mensualidades**, el
  aviso de WhatsApp solo sale con prospectos en **Nueva**, **Sin recordar**
  cuenta mensualidades vencidas, no pacientes). El recibo **no lleva migración**:
  el folio se deriva del `id` del pago y de su fecha (`R-AAAAMMDD-XXXXXXXXXXXX`),
  así que no bloquea el despliegue ni depende de una columna nueva. Es un
  comprobante **interno**, no un CFDI; el pie lo dice.
- **Verificación**: `pnpm check` (78 archivos, 0 errores), `pnpm build` y
  `pnpm verify:build` en verde. Recibo revisado con datos falsos a 900, 390 y
  320 px y en impresión a tamaño carta: se corrigió la tabla en móvil y el
  recorte del importe al imprimir. Falta verlo con datos reales de Supabase.
- **Pendiente**: los e2e siguen sin correr por falta de `E2E_ADMIN_PASSWORD` de
  una cuenta `doctora` en `ADMIN_EMAILS` y en `admins`. Si la doctora quiere
  folios consecutivos en vez de derivados del `id`, hará falta una migración
  con columna o tabla y volver a aplicar los recibos existentes.

## 2026-10-27 — Sistema visual y rediseño de landing y panel

- **Objetivo**: mejorar el diseño de toda la aplicación —landing y panel— con
  un sistema, no con ajustes pantalla por pantalla.
- **Cambios**: `src/styles/tokens.css` como única fuente de color, tipografía,
  espacio, radio, elevación, movimiento y capas; `global.css` y `admin.css`
  reescritos sobre esos tokens; `login.astro` con marca y copy de consultorio;
  `404.astro` con clases en vez de estilos en línea; se quitaron los estilos en
  línea de `Treatments`, `About`, `Contact`, `FAQ`, `BookingForm` y `Footer`.
- **Decisión**: la dirección es **papel clínico** —se conserva la paleta cálida
  y Newsreader/Hanken— porque el panel es a la vez CRM y expediente. No hay modo
  oscuro: sería un segundo producto y el panel es una herramienta de trabajo
  diurna; `color-scheme: light` evita que los controles nativos se pinten oscuros.
  Los `h2` de sección comparten `--text-h2` (32→54) y el `h1` baja su techo a
  72 px para cerrar en tres líneas a 1440. En móvil el héroe pone el mensaje y
  los CTA antes del retrato, y la tabla del panel se vuelve tarjetas con estado
  e importe en la columna derecha (antes compartían celda y se encimaban).
  Todo control táctil mide 44 px; `.seg` y `.estado-rapido` solo suben a 44 con
  `pointer: coarse` para no perder densidad en escritorio.
- **Verificación**: `pnpm check` (75 archivos, 0 errores), `pnpm build` y
  `pnpm verify:build` en verde. Revisión visual con Playwright a 1440×900,
  390×844 y 320 px, y banco estático del panel porque `.env` no tiene
  `E2E_ADMIN_PASSWORD`. Los e2e contra Supabase siguen sin correr.
- **Pendiente**: el aviso de privacidad vacío en `src/config/site.ts` bloquea
  publicar fotos de menores; falta una cuenta `doctora` en `.env` para los e2e.

## 2026-10-27 — Definición de producto del panel

- **Objetivo**: acordar qué es el panel para la doctora y qué se construye
  después, antes de seguir agregando funciones.
- **Decisiones**: es **las dos cosas** — CRM administrativo y expediente
  clínico. El consultorio comparte espacio: la renta es **1/3 de lo cobrado**
  del mes (2/3 para la doctora) y un corte cerrado **se puede reabrir** con
  motivo y versión. Hay **15 pacientes activos**, hay wifi (no hace falta
  captura sin conexión) y la facturación la lleva la contadora. Los menores
  llevan tutor y el consentimiento se firma por paciente o tutor.
- **Descartado**: recordatorios automáticos de cita (0–1 no-shows al mes),
  facturación/CFDI, atribución de producción por doctor, portal del paciente,
  captura offline.
- **Pendiente**: el aviso de privacidad sigue vacío en `src/config/site.ts` y
  ahora se van a guardar fotos de menores: hay que revisarlo antes de la
  primera subida. Los campos clínicos del expediente los valida la doctora, no
  el código.
- **Verificación**: no se tocó código; `pnpm boveda` en verde.

## 2026-10-27 — Bóveda, AGENTS.md y hooks de OpenCode

- **Objetivo**: que cada conversación lea un mapa del proyecto en vez de
  explorar el repo, y que la documentación se actualice sola al cerrar.
- **Cambios**: bóveda Obsidian en `vault/` (inicio, arquitectura, comandos,
  entorno, despliegue, panel, datos, recetas y agentes); `scripts/vault/vault.py`
  con `generar`, `verificar` y `brief`; scripts `boveda*` en `package.json`;
  `opencode.json` con la nota de inicio en `instructions`; plugin
  `.opencode/plugins/boveda-cbpg.ts`; `AGENTS.md` en la raíz.
- **Decisión**: las notas derivadas del código se generan y no se editan a mano;
  las decisiones y pendientes se escriben aquí. El plugin inyecta el mapa una vez
  por sesión y regenera al quedar inactiva, pero no sustituye la entrada de la
  bitácora. `session.idle` llega en ráfaga: sin espaciar las corridas, el
  generador competía con las ediciones.
- **Verificación**: `pnpm boveda`, `pnpm check` y `pnpm build` +
  `pnpm verify:build`. El generador probado contra una edición manual de una nota
  generada: `verificar` la marca y `generar` la restaura.
- **Pendiente**: completar los datos legales de `src/config/site.ts` (los pone la
  doctora) y revisar el texto del caso clínico antes de publicarlo.
