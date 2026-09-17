# 7 · Trazabilidad

## T-01 · Caso de uso → pantalla → código → prueba → hallazgos

| Caso de uso | Ruta o pantalla | Código principal | Pruebas e2e | Hallazgos |
|---|---|---|---|---|
| Ver información del sitio | `/` | `src/pages/index.astro`, `src/components/*` | `formulario.spec.ts` «no pide correo ni publica ninguna dirección» | — |
| Solicitar valoración | `/#contacto` → `POST /api/contact` | `BookingForm.tsx`, `api/contact.ts`, `lib/validate.ts` | `formulario.spec.ts` (llega a la base, incompleto no escribe, honeypot); `seguridad.spec.ts` (429); `panel.spec.ts` (recorrido completo) | — |
| Iniciar y cerrar sesión | `/admin/login`, `auth/entrar`, `auth/salir` | `middleware.ts`, `lib/admin.ts` | `acceso.spec.ts` (5 pruebas) | H-16 |
| Control por rol | Todas las rutas `/admin/*` | `lib/roles.ts`, `lib/panel.ts`, `0006_roles.sql` | `roles.spec.ts` (6; 4 se saltan sin cuenta de recepción); `seguridad.spec.ts` (Origin, clave publicable) | — |
| Instalar como app y sin conexión | `panel.webmanifest`, `panel-sw.js` | `AdminLayout.astro`, `public/panel-sw.js` | `pwa.spec.ts` (6) | — |
| Revisar la cola de Hoy | `/admin` | `pages/admin/index.astro`, `seguimiento.ts`, `metricas.ts` | `tablero.spec.ts` (6); `navegacion.spec.ts` | H-06, H-07, H-08 |
| Buscar y filtrar prospectos | `/admin/prospectos` | `prospectos/index.astro`, `solicitudes.ts` | `panel.spec.ts` (filtros, vacío); `tablero.spec.ts` (vencidos) | H-08, U-04 |
| Contactar por WhatsApp | Lista, ficha o Inicio → `wa.me` | `contacto-directo.ts`, `AvisoContactado.astro` | `panel.spec.ts` (mensaje armado, aviso al volver); `conversion.spec.ts` (Inicio deja de listar) | H-04 |
| Anotar llamada, estado, seguimiento y notas | `/admin/prospectos/[id]` | `prospectos/[id].astro`, `seguimiento.ts` | `panel.spec.ts` (estado y notas); `tablero.spec.ts` («Hecho») | H-03, H-04, U-01, U-02 |
| Convertir en paciente | `/admin/prospectos/[id]/convertir` | `convertir.astro`, `pacientes.ts` | `conversion.spec.ts` (7) | H-05, H-15 |
| Ver agenda | `/admin/agenda` | `agenda/index.astro`, `horario.ts`, `tiempo.ts` | `agenda.spec.ts` (semana y día, rejilla); `google.spec.ts` (conversión de horas) | — |
| Agendar cita | `/admin/agenda/nueva` | `agenda/nueva.astro`, `citas.ts` | `agenda.spec.ts` (desde prospecto, desde paciente, doble clic) | H-10 |
| Reprogramar, asistencia y cancelar | `/admin/agenda/[id]`, detalle en agenda | `agenda/[id].astro`, `citas.ts` | `agenda.spec.ts` (reprogramar, atendida ofrece convertir, cancelar conserva) | H-13 |
| Sincronizar con Google | Agenda y `/admin/integracion/google` | `lib/google/*` | `google.spec.ts` (18, con adaptador simulado) | H-01 |
| Conectar Google | `integracion/google/conectar` y `callback` | `conectar.ts`, `callback.ts`, `almacen.ts` | `google.spec.ts` (URL de autorización) | **Sin prueba e2e del callback** |
| Alta directa y ficha de paciente | `/admin/pacientes/nuevo`, `/admin/pacientes/[id]` | `pacientes/*`, `pacientes.ts` | `pagos.spec.ts` «se crea sin pasar por un prospecto» | H-05, U-06 |
| Crear o editar plan | `/admin/pacientes/[id]/plan` | `plan.astro`, RPC `crear_plan_con_cuotas` | `pagos.spec.ts` (cuotas al centavo, plan sin mensualidades, **rehacer conserva pagos**) | **H-17**: la prueba verifica el saldo, no el estado de las cuotas |
| Registrar y quitar pago | `/admin/pagos/nuevo`, `/admin/pagos` | `pagos/*`, `pagos.ts` | `pagos.spec.ts` (baja el saldo, monto mayor que 0, quitar) | H-09, H-11, H-18, U-03 |
| Recordatorio de cobro | Pagos, ficha e Inicio | `cobranza.ts` | `cobranza.spec.ts` (2) | H-12, U-06 |
| Keepalive | `/api/cron/keepalive` | `keepalive.ts`, `vercel.json` | **Sin prueba** | — |
| Alta y baja de cuentas | Terminal: `pnpm admin` | `scripts/admin.mjs` | **Sin prueba** | — |
| Uso en celular | Todas | `admin.css`, `NavPanel.astro` | `e2e/movil/auditoria-pantallas.spec.ts` (pendiente de correr) | U-01 a U-06 |

### Huecos de cobertura

1. Callback de OAuth de Google (`state` inválido, cancelado, intercambio fallido).
2. Estado de las cuotas después de rehacer un plan con pagos (H-17).
3. Cargo suelto contra el saldo (H-18).
4. Cron keepalive (401 con secreto incorrecto, 200 con el correcto).
5. Errores silenciosos de los POST de Inicio, lista de prospectos y Pagos (H-08).
6. Casos que necesitan la cuenta de recepción: 4 pruebas de `roles.spec.ts` se saltan hoy.

## T-02 · Matriz de permisos por rol

| Recurso | Doctora | Recepcionista | Dónde se aplica |
|---|---|---|---|
| `/admin` (Inicio): cola y captación | ✔ | ✔ | `SECCIONES_POR_ROL` |
| Inicio: cuotas vencidas, cobrado y vencido | ✔ | ✘ (no se consulta) | `esDoctora` en `index.astro`; `calcular(…, conDinero)` |
| `/admin/prospectos` y ficha | ✔ | ✔ | RLS `es_admin` |
| `/admin/prospectos/[id]/convertir` | ✔ | ✘ 303 o 403 | `puedeVer` (regex `CONVERTIR`) + RLS `es_doctora` en `pacientes` |
| `/admin/agenda`, `nueva`, `[id]` | ✔ | ✔ | RLS `es_admin` en `citas` |
| Agendar con `?paciente=` | ✔ | ✘ (el parámetro se ignora) | `nueva.astro` |
| Reintentar sincronización desde la agenda | ✔ | ✔ (si hay integración activa) | `agenda/index.astro` |
| `/admin/pacientes/*` | ✔ | ✘ 303 o 403 | `SOLO_DOCTORA` + RLS |
| `/admin/pagos/*` | ✔ | ✘ 303 o 403 | `SOLO_DOCTORA` + RLS |
| `/admin/integracion/*` | ✔ | ✘ 303 o 403 | `SOLO_DOCTORA` |
| Tabla `solicitudes` | Leer y actualizar | Leer y actualizar | RLS; campos de la paciente protegidos (`seguridad.spec.ts`) |
| Tablas `pacientes`, `planes_tratamiento`, `cuotas`, `pagos`, `recordatorios_cobro` | Todo | Cero filas | RLS `privado.es_doctora()` |
| Tabla `integracion_google` | Solo vía servidor (clave de servicio) | Solo vía servidor | Sin políticas para `authenticated` |
| Tabla `admins` | Su fila | Su fila | RLS «cada quien ve la suya» |
| Clave publicable (anónimo) | — | — | No lee `solicitudes` ni `admins`; `es_admin` no es RPC (`seguridad.spec.ts`) |
