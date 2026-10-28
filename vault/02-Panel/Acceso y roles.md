---
tipo: nota
area: panel
estado: verificado
actualizado: 2026-10-27
resumen: Cómo se entra al panel, qué ve cada rol y dónde está la barrera real.
fuentes:
  - src/middleware.ts
  - src/lib/roles.ts
  - src/lib/panel.ts
  - docs/panel/acceso-y-roles.md
tags:
  - panel
  - seguridad
---

# Acceso y roles

El panel vive en `/admin` y está pensado para el teléfono. El acceso son **tres
barreras independientes**; estar en una sola no sirve.

| Barrera | Dónde | Qué decide |
| --- | --- | --- |
| `ADMIN_EMAILS` | Variable de entorno | Quién puede intentar entrar |
| `admins.rol` | Tabla `admins` | Qué secciones existen (`doctora` / `recepcionista`) |
| RLS | Postgres | Qué filas puede leer/escribir esa persona |

La que protege datos es **RLS**. El middleware solo evita llegar a una pantalla
vacía y corta la petición antes de consultar.

## Flujo de entrada

1. `/admin/login` (pública) envía `POST /admin/auth/entrar`.
2. Se comprueba `ADMIN_EMAILS` **antes** de llamar a Supabase Auth.
3. `signInWithPassword`; el mensaje de error es el mismo para correo inexistente
   y contraseña mala.
4. En cada petición, `middleware.ts` llama `auth.getUser()` (no `getSession()`),
   comprueba la allowlist y lee `admins.rol`.
5. Sin sesión, fuera de allowlist o sin fila en `admins` → `/admin/login`.
6. Si el rol no puede ver la ruta: `GET` → `/admin?acceso=denegado` (303);
   `POST` → `403`.
7. Las respuestas de `/admin` llevan `Cache-Control: private, no-store` y
   `X-Robots-Tag: noindex, nofollow`.

## Rutas públicas del panel

Solo `/admin/login`, `/admin/auth/entrar` y `/admin/auth/salir`. La lista está en
`RUTAS_PUBLICAS_ADMIN` (`src/lib/admin.ts`). Salir es `POST` a propósito: un
prefetch o un `<img>` no puede cerrar la sesión.

## Roles

| Sección | Doctora | Recepcionista |
| --- | --- | --- |
| Inicio, prospectos, agenda | ✔ | ✔ |
| Pacientes, planes, cuotas, pagos | ✔ | ✘ |
| Google Calendar | ✔ | ✘ |
| Dinero en Inicio y métricas | ✔ | ✘ |

- `SECCIONES_POR_ROL` (`src/lib/panel.ts`) decide qué se dibuja en la navegación.
- `SOLO_DOCTORA` (`src/lib/roles.ts`) decide qué se sirve. Son **prefijos**:
  `/admin/pagos` cubre `/admin/pagos/nuevo`.
- `CONVERTIR` reconoce `/admin/prospectos/<id>/convertir`, que no encaja en un
  prefijo simple.
- Si agregas una sección de doctora, agrégala a `SOLO_DOCTORA` **y** crea la
  política RLS. La interfaz no es la barrera.

## Cuentas

```bash
pnpm admin listar
pnpm admin alta <correo> [contraseña] [--rol=doctora|recepcionista]
pnpm admin baja <correo>
```

- El rol por defecto es `recepcionista`, el menos privilegiado.
- El script crea el usuario y la fila en `admins`, pero **no** edita
  `ADMIN_EMAILS`: agrégalo al `.env` y a Vercel, y redesplega.
- `listar` marca con `○` las cuentas que están solo en una de las dos barreras.
- No hay «olvidé mi contraseña»; se repone a mano.

## RLS

- `privado.es_admin()` — doctora o recepcionista. Protege `solicitudes`, `citas`
  y `acciones_prospecto`.
- `privado.es_doctora()` — solo doctora. Protege `pacientes`,
  `planes_tratamiento`, `cuotas`, `pagos` y `recordatorios_cobro`.
- `integracion_google` tiene RLS activo, **cero políticas y ningún GRANT**: solo
  se lee con la clave secreta desde el servidor.

La sesión y los roles se leen con el cliente de la petición (`servidor.ts`), no
con la clave secreta. Ver [[Modelo de datos]] y [[Rutas del panel]].
