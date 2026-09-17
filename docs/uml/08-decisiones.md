# 8 · Decisiones y crecimiento

## D-01 · Trade-offs de arquitectura (estilo ADR)

### ADR-01 · Formularios nativos con PRG en vez de una API JSON
- **Decisión:** cada escritura del panel es un `<form method="post">` que responde `303` a un `GET`.
- **Alternativa:** API JSON con `fetch` desde el cliente.
- **Por qué:** Astro valida `Origin` por su cuenta (CSRF resuelto sin tokens), el panel funciona sin JavaScript y recargar no repite la escritura.
- **Costo aceptado:** cada acción recarga la página completa; los errores viajan en la querystring (`?error=…`), y donde no se agregaron, se pierden (H-08).

### ADR-02 · Correo y contraseña en vez de enlace mágico
- **Decisión:** `signInWithPassword`.
- **Alternativa:** magic link por correo.
- **Por qué:** el consultorio no tiene SMTP; un enlace mágico sin correo confiable deja a la doctora fuera.
- **Costo aceptado:** no hay recuperación de contraseña autoservicio (H-16).

### ADR-03 · Doble allowlist más RLS
- **Decisión:** `ADMIN_EMAILS` + tabla `admins` con rol + políticas RLS por tabla.
- **Alternativa:** solo RLS.
- **Por qué:** defensa en profundidad; un error de configuración en una capa no abre los datos.
- **Costo aceptado:** dar de alta una cuenta exige tocar el `.env`, Vercel y la base, y redesplegar.

### ADR-04 · Google Calendar como espejo, no como fuente de verdad
- **Decisión:** la cita se guarda primero en Postgres; Google se sincroniza después con estado `pendiente`, `sincronizada` o `error`.
- **Alternativa:** escribir en Google y leer de allí.
- **Por qué:** una caída de Google no puede impedir agendar; el panel sigue funcionando sin la integración.
- **Costo aceptado:** puede haber desfase hasta que alguien toque «Reintentar»; no hay reintento automático.

### ADR-05 · Estado de la cuota derivado en una vista
- **Decisión:** `vista_cuotas` calcula pendiente, parcial, vencida o pagada a partir de pagos y fecha.
- **Alternativa:** columna `estado` actualizada por la aplicación o un cron.
- **Por qué:** no hay nada que «actualizar» cuando pasa el día; el estado no puede quedar desincronizado.
- **Costo aceptado:** la fecha se evalúa en UTC (H-12), y rehacer el plan borra las cuotas y desliga los pagos (H-17).

### ADR-06 · WhatsApp manual en vez de API
- **Decisión:** enlaces `wa.me` con el texto armado; el panel solo registra «Marcar enviado» o «contactada».
- **Alternativa:** WhatsApp Business API con envío automático.
- **Por qué:** sin costo, sin verificación de Meta, y el mensaje sale del número que la paciente ya conoce.
- **Costo aceptado:** depende de que la doctora marque lo que hizo; las métricas de contacto pueden quedarse cortas (H-04).

### ADR-07 · Supabase free con keepalive
- **Decisión:** plan gratuito y un cron diario que consulta la base.
- **Alternativa:** plan Pro.
- **Por qué:** el volumen de un consultorio cabe de sobra en el plan free.
- **Costo aceptado:** sin branching (pruebas contra producción, H-02), sin backups de punto en el tiempo, y si el cron falla el proyecto se pausa.

### ADR-08 · Pruebas e2e contra la base de producción
- **Decisión:** Playwright contra el Supabase real, sembrando filas con prefijo `E2E` y limpiándolas.
- **Alternativa:** proyecto Supabase de pruebas o Supabase local.
- **Por qué:** RLS, vistas y RPC reales; sin mantener dos esquemas.
- **Costo aceptado:** riesgo de dejar filas si una corrida se corta, y citas copiadas a Google real (H-01, H-02).

## D-02 · Confiabilidad y modos de fallo

| Componente | Si falla… | Cómo degrada | Cómo se detecta hoy |
|---|---|---|---|
| Supabase Auth o Postgres | No se valida sesión ni se leen datos | El middleware manda al login; las páginas enseñan «No pudimos cargar»; el formulario público responde 502 con la sugerencia de WhatsApp | Logs de Vercel (`console.error`). **Sin alertas** |
| Supabase pausado (free) | Todo lo anterior, hasta reanudarlo a mano | Igual que arriba | Respuesta `500` del keepalive en los logs del cron |
| Google Calendar u OAuth | No se copian las citas | Citas en `error`; aviso con «Reintentar»; `ultimo_error` visible en la pantalla de Google | Aviso en la agenda y en Inicio («sin sincronizar») |
| Vercel (funciones) | Panel y formulario caídos | La landing prerenderizada sigue en el CDN; el panel instalado muestra la pantalla sin conexión solo si no hay red | Estado de Vercel |
| Red del celular | No carga el panel | `panel-sin-conexion.html` desde el service worker | Visible para la usuaria |
| Cron keepalive | El proyecto se pausa a los 7 días sin actividad | Nada lo compensa | Historial de ejecuciones del cron en Vercel |
| Límite de envíos en memoria | Con varias instancias, cada una cuenta aparte | El límite real es más laxo | No se detecta |

Hoy **no hay monitoreo ni alertas**: los errores solo quedan en los logs.

## D-03 · Qué revisar cuando el consultorio crezca

| Disparador | Qué cambia | Referencia |
|---|---|---|
| Una segunda doctora o sucursal | Roles fijos, `responsable` sin uso en filtros, agenda de una sola columna y horario en código | `lib/roles.ts`, `lib/horario.ts` |
| Más de 6 pendientes por bloque | Contadores de Inicio topados | H-07 |
| Más de 2000 acciones o pagos por periodo | Métricas con `limit(2000)` y sumas en memoria | `lib/metricas.ts` |
| Tráfico o bots en el formulario | Límite en memoria por instancia; moverlo a KV o a Postgres | `api/contact.ts` |
| Agenda llena | Sin detección de empalmes ni de citas fuera de horario | H-10 |
| Cambios frecuentes de esquema | Proyecto de pruebas o Supabase local | H-02 |
| Primer incidente en producción | Monitoreo (Sentry o Vercel Observability) y alertas del cron | D-02 |
| Volumen de cobranza | Recordatorios automáticos (WhatsApp Business API) | ADR-06 |
| Planes que se renegocian | Reaplicar pagos al rehacer cuotas | H-17 |
| Cargos extra frecuentes | Separar cargos sueltos del saldo del tratamiento | H-18 |
