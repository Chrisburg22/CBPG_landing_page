---
tipo: nota
area: panel
estado: verificado
actualizado: 2026-10-27
resumen: Integración opcional con Google Calendar, cifrado de tokens y estados de sincronización.
fuentes:
  - src/lib/google/
  - src/pages/admin/integracion/
  - docs/panel/google.md
tags:
  - panel
  - google
---

# Google Calendar

La agenda del panel es la **fuente de verdad**; Google es un espejo. Si Google
falla, la cita sigue guardada y se reintenta.

## Conectar

1. Doctora → Agenda → Google Calendar → **Conectar con Google**.
2. OAuth con `calendar.events` y `calendar.readonly`.
3. Se guardan `refresh_token` y `access_token` **cifrados** con
   `GOOGLE_TOKEN_KEY` en `integracion_google`.
4. Se elige un calendario donde la cuenta pueda escribir.

Sin `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_TOKEN_KEY` la agenda
funciona igual: las citas quedan con `google_sync = 'desactivada'`.

## Estados

| `google_sync` | Significado |
| --- | --- |
| `desactivada` | No hay integración; no es un error |
| `pendiente` | Hay que crear/actualizar el evento |
| `sincronizada` | Evento al día |
| `error` | Google falló; se reintenta |

- Editar o cancelar una cita la vuelve a poner `pendiente`.
- Cancelar en el panel **borra** el evento de Google (según el plan de
  sincronización).
- Un `401/403` no se arregla reintentando: hay que reconectar.
- El botón «Google · N sin sincronizar» y «Reintentar ahora» recogen los errores.

## Qué se copia

Tipo de cita, nombre, hora, duración y teléfono. **No** se copian las notas de la
agenda ni nada de pagos: el calendario lo ve todo el consultorio.

## Seguridad

- `integracion_google` tiene RLS activo, **cero políticas y ningún GRANT**. Solo
  se lee con la clave secreta desde el servidor; el cliente del panel no la
  alcanza.
- Si se cambia `GOOGLE_TOKEN_KEY`, los tokens guardados dejan de descifrarse y hay
  que volver a conectar.

## Pruebas

`e2e/google.spec.ts` prueba el adaptador contra un `fetch` simulado (crear,
actualizar, cancelar, error de Google, caída de red) y las conversiones de hora.
No necesita una cuenta de Google.

`playwright.movil.config.ts` y `playwright.manual.config.ts` **anulan** las
credenciales de Google para no crear eventos reales durante la auditoría o la
grabación del manual.

## Archivos

| Pieza | Archivo |
| --- | --- |
| OAuth y API de Calendar | `src/lib/google/calendario.ts` |
| Cifrado de tokens | `src/lib/google/cripto.ts` |
| Guardado/lectura de tokens | `src/lib/google/almacen.ts` |
| Evento y plan | `src/lib/google/plan.ts` |
| Sincronización y reintentos | `src/lib/google/sincronizar.ts` |
| Pantallas | `src/pages/admin/integracion/google.astro` y `google/` |
