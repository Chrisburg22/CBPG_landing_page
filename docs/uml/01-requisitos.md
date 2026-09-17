# 1 · Requisitos

Sacados del código, no de un documento previo. Cada requisito apunta al caso de uso que lo cumple ([02-casos-de-uso.md](02-casos-de-uso.md)) y a dónde está implementado.

## R-01 · Requisitos funcionales

| ID | El sistema debe… | Caso de uso | Dónde |
|---|---|---|---|
| RF-01 | Mostrar la landing: tratamientos, resultados, proceso, preguntas frecuentes y contacto | CU-01 | `src/pages/index.astro`, `src/components/*` |
| RF-02 | Recibir solicitudes de valoración (nombre, teléfono, tratamiento, mensaje, consentimiento) y guardarlas como prospecto *nueva* | CU-01 | `BookingForm.tsx`, `api/contact.ts` |
| RF-03 | Guardar la versión del aviso de privacidad aceptado con cada solicitud | CU-01 | `AVISO_VERSION`, `solicitudes.aviso_version` |
| RF-04 | Dar acceso al panel solo a cuentas autorizadas, con rol doctora o recepcionista | CU-02 | `middleware.ts`, `lib/roles.ts` |
| RF-05 | Instalar el panel como app en el teléfono y avisar cuando no hay conexión | CU-02 | `panel.webmanifest`, `panel-sw.js` |
| RF-06 | Listar, buscar y filtrar prospectos por estado, origen y seguimiento vencido | CU-03 | `prospectos/index.astro`, `solicitudes.ts` |
| RF-07 | Contactar por WhatsApp o teléfono y registrar el contacto en el historial | CU-03 | `contacto-directo.ts`, `AvisoContactado.astro`, `seguimiento.ts` |
| RF-08 | Programar, cambiar y cerrar la próxima acción de un prospecto | CU-03 | `prospectos/[id].astro`, `seguimiento.ts` |
| RF-09 | Mostrar en Inicio la cola del día: sin contestar, seguimientos, citas por confirmar y cuotas vencidas | CU-03, CU-05 | `pages/admin/index.astro` |
| RF-10 | Convertir un prospecto en paciente (solo la doctora) | CU-03 | `prospectos/[id]/convertir.astro`, `pacientes.ts` |
| RF-11 | Agendar, reprogramar, confirmar, cancelar y registrar asistencia de citas en una rejilla por horas | CU-04 | `agenda/*`, `citas.ts`, `horario.ts` |
| RF-12 | Ofrecer la conversión cuando una valoración queda *atendida* | CU-04 | `agenda/index.astro`, `agenda/[id].astro` |
| RF-13 | Dar de alta pacientes directos y editar sus datos | CU-05 | `pacientes/nuevo.astro`, `pacientes/[id].astro` |
| RF-14 | Crear un plan de tratamiento que genere mensualidades | CU-05 | `pacientes/[id]/plan.astro`, RPC `crear_plan_con_cuotas` |
| RF-15 | Registrar pagos (mensualidad, abono, enganche o cargo suelto) y calcular el saldo | CU-05 | `pagos/nuevo.astro`, `vista_saldo_paciente` |
| RF-16 | Preparar el mensaje de cobro por WhatsApp y registrar que se envió | CU-05 | `cobranza.ts` |
| RF-17 | Mostrar métricas de captación, citas y dinero por periodo | CU-03, CU-05 | `metricas.ts` |
| RF-18 | Copiar las citas a Google Calendar y reintentar las que fallen | CU-04, CU-06 | `lib/google/*` |
| RF-19 | Mantener activo el proyecto de Supabase con una consulta diaria | CU-06 | `api/cron/keepalive.ts`, `vercel.json` |
| RF-20 | Dar de alta y de baja cuentas del panel desde la terminal | CU-06 | `scripts/admin.mjs` |

## R-02 · Requisitos no funcionales

| ID | Atributo | Requisito | Cómo se cumple |
|---|---|---|---|
| RNF-01 | Seguridad | Solo entra quien está en `ADMIN_EMAILS` **y** en la tabla `admins` | Doble allowlist en `auth/entrar.ts` y `middleware.ts` |
| RNF-02 | Seguridad | La base niega por defecto; la recepcionista no lee pacientes, planes, cuotas, pagos ni recordatorios | RLS con `privado.es_admin()` y `privado.es_doctora()` (`0006_roles.sql`) |
| RNF-03 | Seguridad | Los formularios del panel no aceptan peticiones de otro origen | `security.checkOrigin` de Astro; formularios nativos con POST → 303 |
| RNF-04 | Seguridad | Los tokens de Google no se guardan en claro ni los ve el cliente | AES-256-GCM con `GOOGLE_TOKEN_KEY` (`google/cripto.ts`); tabla con RLS y cero políticas, solo legible con la clave de servicio |
| RNF-05 | Seguridad | El cron no se puede invocar sin el secreto | Bearer `CRON_SECRET` comparado en tiempo constante |
| RNF-06 | Antiabuso | El formulario público resiste bots y envíos repetidos | Honeypot `empresa` y límite de 5 envíos por IP cada 10 min (en memoria) |
| RNF-07 | Privacidad | Ningún dato de paciente queda en el teléfono ni en un CDN | Service worker solo cachea `/_astro/*` e iconos; `Cache-Control: private, no-store` en `/admin` |
| RNF-08 | Privacidad | El panel no aparece en buscadores | `X-Robots-Tag: noindex, nofollow` y `<meta robots>` |
| RNF-09 | Privacidad | La nota interna de una cita no viaja a Google | `eventoDeCita` copia solo tipo, nombre y teléfono |
| RNF-10 | Corrección | Las horas se capturan en hora de México y se guardan en UTC | `deMexicoAIso`, `partesEnMexico`, `diaEnMexico` (`tiempo.ts`) |
| RNF-11 | Disponibilidad | Una caída de Supabase no deja un 500 en blanco | `try/catch` en el middleware y avisos «No pudimos cargar…» |
| RNF-12 | Disponibilidad | Google es un espejo: si falla, la cita se guarda igual | `google_sync = error` y botón «Reintentar» |
| RNF-13 | Disponibilidad | El proyecto de Supabase (plan free) no se pausa por inactividad | Cron diario `17 9 * * *` |
| RNF-14 | Rendimiento | Un insert lento no cuelga el formulario | `AbortSignal.timeout(5000)` en `/api/contact` |
| RNF-15 | Usabilidad móvil | El panel se usa con una mano en el teléfono | Barra de pestañas por debajo de 720 px, áreas táctiles de 44 px, PWA |
| RNF-16 | Integridad | Un doble toque no duplica escrituras | Guarda global de envío en `AdminLayout.astro` y `UNIQUE` en la conversión |
| RNF-17 | Accesibilidad | Contraste AA, foco visible, avisos con `role="status"` y `role="alert"` | `admin.css`, tokens de `global.css` |

## R-03 · Restricciones

| ID | Restricción | Consecuencia en el diseño |
|---|---|---|
| RS-01 | Una sola doctora y, a lo sumo, una recepcionista | Roles fijos en código; la agenda no distingue consultorios |
| RS-02 | Supabase en plan free, sin branching | Las pruebas corren contra producción (H-02) y hace falta el keepalive |
| RS-03 | Vercel con funciones Node (Fluid Compute) | El límite de envíos vive en memoria, por instancia |
| RS-04 | Sin servidor de correo (SMTP) | Acceso con contraseña; no hay «olvidé mi contraseña» (H-16) |
| RS-05 | WhatsApp sin API de negocio | Los mensajes los manda la doctora; el panel solo prepara el texto y registra |
| RS-06 | Astro con `output: 'static'` | Solo `/api/*` y `/admin/*` corren en el servidor (`prerender = false`) |
| RS-07 | Figma en plan Starter | El tablero UML se construye por partes (límite de llamadas del MCP) |
