---
tipo: nota
area: proyecto
estado: verificado
actualizado: 2026-10-27
resumen: Variables de entorno, qué es secreto y qué se rompe si falta.
fuentes:
  - .env.example
  - astro.config.mjs
tags:
  - proyecto
  - entorno
---

# Entornos y variables

Copia `.env.example` a `.env`. El `.env` real no se versiona. En Vercel hay que
declarar las mismas variables; cambiar solo el `.env` local no cambia producción.

## Variables

| Variable | Para qué | Notas |
| --- | --- | --- |
| `SUPABASE_URL` | Proyecto Supabase | `wffqduqgnknopjrwyjpe` |
| `SUPABASE_PUBLISHABLE_KEY` | Cliente con RLS | Empieza por `sb_publishable_` |
| `SUPABASE_SECRET_KEY` | Cliente con clave secreta | **Bypasa RLS**; solo `/api/*` |
| `ADMIN_EMAILS` | Allowlist del panel | Correos separados por comas |
| `CRON_SECRET` | Autoriza el cron de Vercel | Mínimo 32 caracteres |
| `GOOGLE_CLIENT_ID` | OAuth de Calendar | Opcional |
| `GOOGLE_CLIENT_SECRET` | OAuth de Calendar | Opcional, secreto |
| `GOOGLE_TOKEN_KEY` | Cifra los tokens de Google | Opcional, 32 bytes hex |
| `E2E_ADMIN_PASSWORD` | Contraseña de la cuenta doctora para e2e | Solo local |
| `E2E_ADMIN_EMAIL` | Cuál cuenta usar si hay varias | Opcional |
| `E2E_RECEPCION_EMAIL` / `_PASSWORD` | Activan pruebas de recepcionista | Opcional |

Genera secretos con `openssl rand -hex 32`.

## Esquema de Astro

`astro.config.mjs` declara todas las variables con `envField`. `validateSecrets:
true` hace que **falte una variable en el deploy y falle el build**, en vez de
producir un 503 en el formulario de una paciente.

- Ninguna variable lleva prefijo `PUBLIC_` a propósito: no hay ningún cliente
  Supabase en el navegador, así que nada de esto entra al bundle de cliente.
- `SUPABASE_URL` y `PUBLISHABLE_KEY` son `access: 'public'` pero `context:
  'server'`: se leen con `astro:env/server`, no en el navegador.
- Google es opcional: sin las tres variables la agenda funciona y las citas
  quedan con `google_sync = 'desactivada'`.

## Reglas

- No pongas la clave secreta en una página, un componente ni una variable
  `PUBLIC_`.
- Si cambias `GOOGLE_TOKEN_KEY`, hay que volver a conectar el calendario: los
  tokens guardados ya no se pueden descifrar.
- Cambiar `ADMIN_EMAILS` en Vercel exige redesplegar para que el servidor lo vea.
- El cron de Vercel manda `Authorization: Bearer $CRON_SECRET`; si la variable
  falta, `/api/cron/keepalive` responde 401.
- Las pruebas e2e usan el mismo `.env` y el Supabase real. No hay ramas de base
  de datos en el plan gratuito.
