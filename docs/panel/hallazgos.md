# Hallazgos: auditoría del panel en celular

Estado: **parcial**. La revisión de código está hecha. Faltan la corrida automática a 390 px y 360 px (`pnpm test:movil`) y la revisión visual, que añaden los hallazgos de UI, áreas táctiles, contraste y desbordes (sección «Auditoría móvil» al final).

Severidad: **alta** = pierde o falsea datos, o toca sistemas reales · **media** = la doctora se equivoca o pierde tiempo · **baja** = pulido.

## Lógica y datos

| ID | Sev. | Sección | Hallazgo | Dónde | Mejora propuesta |
|---|---|---|---|---|---|
| H-01 | alta | Pruebas | Google Calendar está **conectado** en producción y el `.env` local tiene sus credenciales. Las pruebas e2e que crean o reprograman citas desde la interfaz (`agenda.spec.ts`) las copian al calendario real, y `limpiar()` borra la fila en Supabase pero **no el evento en Google**. Pueden haber quedado eventos «E2E …» en el calendario. | `playwright.config.ts:61` (webServer sin vaciar `GOOGLE_*`), `e2e/agenda.spec.ts` | Vaciar `GOOGLE_CLIENT_ID/SECRET/TOKEN_KEY` en el `webServer` de la suite (ya se hace en los configs móviles) y revisar el calendario destino buscando «E2E». |
| H-02 | alta | Pruebas | Todas las pruebas escriben en el **Supabase de producción**. La limpieza depende de nombres; una corrida cortada deja filas visibles para la doctora. | `e2e/apoyo.ts` | Proyecto Supabase de pruebas aparte (o pasar al plan con branching) y `.env.test`. |
| H-03 | media | Prospectos | En el historial, el enlace a una cita usa `inicia_en.slice(0, 10)`, que es la fecha **en UTC**. Una cita a las 18:00 o más tarde (hora de México) abre la agenda del **día siguiente**. El detalle se abre, pero la rejilla de fondo es otra. | `src/pages/admin/prospectos/[id].astro:346` | `diaEnMexico(e.cita.inicia_en)`, como ya hace la ficha del paciente. |
| H-04 | media | Prospectos / Inicio | Cambiar a **Contactada** con el selector de la ficha **no anota contacto** en el historial, así que no cuenta en la métrica «Contactadas». Desde la lista y desde Inicio sí se anota. El mismo gesto da números distintos según dónde se haga. | `src/pages/admin/prospectos/[id].astro:52` | Registrar `whatsapp` (o una acción «contacto») también ahí, o contar la métrica por cambio de estado. |
| H-05 | media | Pacientes | La ficha del paciente **no enseña las citas de cuando era prospecto**: ni la valoración ni un control ya agendado antes de convertir. `porPaciente` filtra solo `paciente_id` y la conversión no las vuelve a enlazar. | `src/lib/citas.ts:90`, `src/pages/admin/prospectos/[id]/convertir.astro` | Al convertir, pasar las citas futuras a `paciente_id`; en la ficha, listar también las de `solicitud_id`. |
| H-06 | media | Inicio | El embudo **mezcla cohortes**. «Convertidas» cuenta pacientes creados en el periodo, incluidas las altas directas que nunca fueron solicitudes. «Contactadas» y «Agendadas» cuentan actividad del periodo sobre solicitudes de cualquier fecha. Los porcentajes pueden decir 100 % sin serlo (se recortan con `Math.min`). | `src/lib/metricas.ts:105`, `:181` | Contar sobre las solicitudes recibidas en el periodo (cohorte) y separar «altas directas». |
| H-07 | media | Inicio | Los contadores se calculan sobre listas **topadas en 6**. «N por atender» y «N cuotas por cobrar» se quedan cortos cuando hay más; el KPI «Vencido hoy» (sin tope) no cuadra con su subtítulo. | `src/pages/admin/index.astro:105`, `:166`, `:586` | Contar aparte (`count: 'exact'`) y mostrar «6 de 14 · ver todos». |
| H-08 | media | Inicio, Prospectos, Pagos | **Errores silenciosos**: el POST falla, se registra en consola y redirige **sin aviso**. Parece que se guardó (marcar hecho, cambiar estado desde la lista, marcar recordatorio, quitar pago). `registrar()` del historial también se traga el error. | `src/pages/admin/index.astro:67`, `prospectos/index.astro:57`, `pagos/index.astro:50`, `src/lib/seguimiento.ts:44` | Redirigir con `?error=1` y pintar el aviso, como ya hacen la ficha y la agenda. |
| H-09 | media | Pagos | **Registrar pago pierde lo tecleado**: elegir el paciente recarga la página (se pierden monto y nota si ya se escribieron), y un error de validación devuelve el formulario con los valores iniciales, no con los enviados. | `src/pages/admin/pagos/nuevo.astro:237`, `:311` | Paciente primero y bloqueado hasta elegirlo; conservar lo enviado como hace `agenda/nueva.astro` (`enviado`). |
| H-10 | media | Agenda | Al crear o reprogramar **no se avisa de empalmes**, ni de citas fuera de horario, en domingo o en el pasado. Solo hay una franja visual que en el celular es muy pequeña. | `src/pages/admin/agenda/nueva.astro`, `agenda/[id].astro:40` | Aviso no bloqueante («Se empalma con Lucía 10:00–10:30. ¿Guardar igual?»). |
| H-11 | baja | Pagos | Un pago mayor que lo que falta de la cuota o que el saldo se guarda sin advertir, y el saldo queda negativo. | `src/pages/admin/pagos/nuevo.astro` | Aviso en el lateral cuando el saldo nuevo sea menor que 0. |
| H-12 | baja | Pagos | `vista_cuotas` compara con `current_date` en **UTC**: de 18:00 a 24:00 (México), la cuota que vence **hoy** ya aparece como vencida en Inicio y en Pagos. | `supabase/migrations/0005_vistas_y_generar_cuotas.sql:25` | `(now() at time zone 'America/Mexico_City')::date`. |
| H-13 | baja | Agenda | Guardar «Cancelada» en una cita que ya estaba cancelada, desde `/admin/agenda/<id>`, vuelve a anotar «Cita cancelada» en el historial. La vista de agenda sí lo evita. | `src/pages/admin/agenda/[id].astro:69` | Comparar con `antes.estado` como en `agenda/index.astro`. |
| H-14 | baja | Pagos | La lista de meses se arma con el reloj del servidor (UTC): el último día del mes, después de las 18:00, empieza por el mes siguiente. | `src/pages/admin/pagos/index.astro:110` | Partir de `hoyEnMexico()`. |
| H-15 | baja | Prospectos | Convertir no es atómico: crea el paciente y después actualiza la solicitud en otra llamada. Si la segunda falla, queda un paciente con la solicitud sin terminar. | `src/lib/pacientes.ts:160` | RPC en una transacción. |
| H-16 | baja | Acceso | No hay «olvidé mi contraseña»: reponerla exige el script. | `src/pages/admin/auth/entrar.ts` | Aceptable con una usuaria; documentado en [acceso-y-roles.md](acceso-y-roles.md). |

## UX en celular (revisión de código y CSS)

| ID | Sev. | Pantalla | Hallazgo | Dónde | Mejora propuesta |
|---|---|---|---|---|---|
| U-01 | media | Ficha de prospecto | Por debajo de 940 px la ficha pasa a una columna, y **Mensaje** e **Historial** van antes que **Próxima acción**, **Situación** y **Convertir**. En el teléfono, lo que se hace en cada visita queda al fondo, tras varios scrolls. | `src/styles/admin.css:1040`, `prospectos/[id].astro` | En móvil, ordenar: cabecera → próxima acción → situación/convertir → mensaje → historial → origen/notas. |
| U-02 | media | Ficha de prospecto | Cinco botones en la cabecera (WhatsApp, Llamar, Anotar llamada, Agendar, Todos los prospectos) compiten entre sí. «Llamar» y «Anotar llamada» son dos pasos para un solo acto. | `prospectos/[id].astro` | Que «Llamar» anote la llamada al volver (como ya hace el aviso de WhatsApp), y «Todos los prospectos» como flecha atrás en la barra. |
| U-03 | media | Registrar pago | En el teléfono, **Guardar pago** queda al final, después de todo el formulario **y** del resumen lateral. | `pagos/nuevo.astro` | Barra de acción fija abajo con el saldo resultante y el botón. |
| U-04 | baja | Lista de prospectos | El estado se guarda **al soltar el selector**, sin confirmación ni aviso visible. Con el dedo es fácil cambiarlo al hacer scroll. | `prospectos/index.astro:333` | Aviso breve «Estado guardado · Deshacer». |
| U-06 | baja | Inicio, Pacientes, Pagos | La misma acción se llama **Cobrar** en Inicio y en la ficha, y **WhatsApp** en Pagos. En la ficha, las cuotas **vencidas no tienen «Registrar»** (solo la siguiente por vencer); en Pagos, todas lo tienen. | `pacientes/[id].astro:398`, `pagos/index.astro:286` | Mismo texto y mismas acciones en las tres pantallas. |
| U-05 | baja | Todas | Ninguna pantalla de detalle tiene «atrás» en la barra superior: se vuelve con un botón dentro del contenido o con el gesto del sistema, que en la PWA instalada de iPhone no siempre existe. | `AdminLayout.astro` | Flecha atrás en `.admin-barra` para las pantallas de detalle. |

## Auditoría móvil automática

_Pendiente de ejecutar._ `pnpm test:movil` escribe `test-results/movil/hallazgos.jsonl` y capturas por pantalla en `test-results/movil/capturas/<proyecto>/`. Se resume aquí por regla: `scroll-horizontal`, `area-tactil`, `texto-recortado`, `tapado-por-barra` y `axe:*`.

## Lotes de arreglo propuestos

1. **Higiene de pruebas** (H-01, H-02): antes de volver a correr la suite completa.
2. **Datos correctos** (H-03, H-04, H-05, H-07, H-08, H-12, H-13): cambios pequeños y con prueba e2e cada uno.
3. **Formularios que no pierden nada** (H-09, H-10, H-11, U-03).
4. **Ficha de prospecto móvil** (U-01, U-02, U-04, U-05).
5. **Métricas por cohorte** (H-06): conviene decidirlo con la doctora, porque cambia cómo se leen los números.
