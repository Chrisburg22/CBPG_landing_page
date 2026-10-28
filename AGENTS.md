# AGENTS.md

Landing pública y panel interno de un consultorio de ortodoncia. Astro 7
(`output: 'static'` + adaptador de Vercel), Supabase (Auth + Postgres con RLS) y
Google Calendar como espejo opcional de la agenda. UI, comentarios y documentos
en español.

**El mapa completo está en la bóveda:** `vault/00-Inicio/Boveda CBPG.md`. Lee
solo la nota del área que vas a tocar; no explores el repo entero.

## Comandos

```bash
pnpm install
pnpm dev                 # http://localhost:4321
pnpm check               # astro check
pnpm build               # build de producción
pnpm verify:build        # invariantes del artefacto; obligatorio tras build
pnpm test                # check + build + verify:build + e2e
```

- `pnpm` es el gestor (hay `pnpm-lock.yaml`); `.npmrc` fija `node-linker=hoisted`.
- Si lanzas el dev server desde un agente:
  `ASTRO_DEV_BACKGROUND=0 pnpm dev`. Astro 7 detecta agentes y demoniza el
  proceso; Playwright entonces cree que murió. Los configs de Playwright ya lo
  definen.

## Reglas que no se negocian

- **Toda ruta de `/admin` y `/api` que use sesión lleva
  `export const prerender = false`.** Con `output: 'static'`, olvidarlo
  prerenderiza la página, el middleware no corre en cada petición y el panel
  queda **público**. `scripts/verificar-build.mjs` lo detecta; corre
  `pnpm verify:build` después de `pnpm build`.
- **La barrera real es RLS.** `ADMIN_EMAILS` decide quién puede intentar entrar;
  `admins.rol` (`doctora` / `recepcionista`) decide qué secciones existen; RLS
  decide qué filas ve cada quien. La interfaz no protege nada.
- **Horas en Ciudad de México, guardadas en UTC.** Usa `src/lib/tiempo.ts`
  (`deMexicoAIso`, `aCampoLocal`, `partesEnMexico`, `diaEnMexico`,
  `limitesDelDia`). Nunca `new Date()` sobre una hora de pared ni `.slice(0, 10)`
  sobre un ISO.
- **Las migraciones se aplican a mano sobre producción.** No hay CLI de Supabase
  ni base local. Aplica la migración, actualiza `src/lib/supabase/tipos.ts` a
  mano y después despliega. Ver `supabase/migrations/README.md`.
- **La clave secreta bypasa RLS.** `SUPABASE_SECRET_KEY` solo se usa desde
  `/api/*`; nunca en una página, componente o variable `PUBLIC_`.
- **El HTML del panel nunca se cachea.** El service worker
  (`public/panel-sw.js`) solo guarda `/_astro/*` e iconos. Si cambias sus reglas,
  sube `VERSION` en el mismo commit.
- **Importes `numeric` llegan como `string`.** Convierte solo con `dinero()` de
  `src/lib/formato.ts`.
- **Datos sensibles.** `solicitudes.mensaje` y `pacientes.notas` pueden contener
  datos de salud: nunca a logs, URLs, ejemplos ni `set:html`.
- **No inventes datos legales ni clínicos.** `src/config/site.ts` tiene `legal`
  vacío y el caso clínico en borrador, pendientes de la doctora.

## Arquitectura en una línea

`middleware.ts` valida la sesión, la allowlist y el rol; cada página Astro lee y
escribe con el cliente de la sesión; `src/lib/*` contiene el dominio; Supabase
aplica RLS. Las escrituras son formularios `POST` → redirect `303` → `GET`. No
hay API JSON propia salvo `/api/contact` y `GET /admin/agenda/ocupacion`.

| Quiero tocar… | Archivo / nota |
| --- | --- |
| Acceso, roles, RLS | `src/middleware.ts`, `src/lib/roles.ts` · [[Acceso y roles]] |
| Prospectos y seguimiento | `src/lib/solicitudes.ts`, `src/lib/seguimiento.ts` · [[Prospectos y agenda]] |
| Agenda y citas | `src/lib/citas.ts`, `src/lib/horario.ts` · [[Prospectos y agenda]] |
| Pacientes, planes y pagos | `src/lib/pacientes.ts`, `src/lib/pagos.ts`, `src/lib/cobranza.ts` · [[Pacientes y cobranza]] |
| Google Calendar | `src/lib/google/` · [[Google Calendar]] |
| Landing y copy | `src/config/site.ts`, `src/components/` · [[Landing y contenido]] |
| Esquema | `src/lib/supabase/tipos.ts`, `supabase/migrations/` · [[Modelo de datos]] |

## Pruebas E2E

- Usan el **Supabase real**; no hay proyecto de pruebas.
- Requieren `.env` + `E2E_ADMIN_PASSWORD` de una cuenta `doctora` que esté en
  `ADMIN_EMAILS` **y** en `admins`. Las de recepción se saltan sin
  `E2E_RECEPCION_EMAIL` / `E2E_RECEPCION_PASSWORD`.
- Puerto fijo 4329, un worker, sin reintentos, timeout 45 s. El servidor se
  levanta por corrida y no se reutiliza (el rate limit del formulario vive en
  memoria).
- Las filas de prueba llevan prefijo `E2E ` y se limpian en `global-setup.ts`.
- Vídeo encendido por defecto; `PW_VIDEO=0` o `pnpm test:e2e:sin-video` lo apaga.
- `pnpm test:movil` y `pnpm manual` anulan las credenciales de Google para no
  crear eventos reales. No las corras con `GOOGLE_*` puestas.

## Bóveda Obsidian (`vault/`)

- Empieza en `vault/00-Inicio/Boveda CBPG.md`; para agentes, sigue
  `vault/08-Agentes/Protocolo de busqueda.md`.
- Las notas con `tipo: generado` (`Indice completo`, `Mapa del repositorio`,
  `Rutas del panel`, `Tablas`) se construyen desde el código: **no las edites a
  mano**.
- Al cambiar rutas, esquema, carpetas o roles: `pnpm boveda`.
- Antes de cerrar: `pnpm boveda` (genera y verifica) y una entrada al principio
  de `vault/08-Agentes/Bitacora de sesiones.md` con objetivo, cambios,
  decisiones y pendientes.
- El plugin `.opencode/plugins/boveda-cbpg.ts` inyecta el mapa una vez por
  sesión y regenera al quedar inactiva. Si falla, hazlo a mano.

## Verificación

| Cambio | Mínimo |
| --- | --- |
| Landing / copy | `pnpm check && pnpm build` |
| `/admin` o `/api` | `pnpm test` (incluye `verify:build`) |
| Migración | Aplicar al remoto + `tipos.ts` + `pnpm check` |
| PWA | `pnpm build && pnpm verify:build` |
| Bóveda | `pnpm boveda` |

No hay CI ni git hooks que atrapen esto. `pnpm verify:build` es la única prueba
que mira el artefacto real de producción.
