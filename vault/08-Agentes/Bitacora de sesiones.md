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
