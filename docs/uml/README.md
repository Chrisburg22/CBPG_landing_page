# Documentación UML de la aplicación

Set completo de diagramas de ingeniería de software de CBPG: landing, formulario, `/api/*`, panel `/admin`, Supabase, Google Calendar y la PWA. Todo sale del código del repositorio y cada diagrama cita sus fuentes.

GitHub dibuja los bloques Mermaid directamente. Los mismos diagramas se están pasando a un tablero de FigJam:

**Tablero FigJam:** https://www.figma.com/board/1G5l7tKjzITEo8OgkuzwWG

| # | Documento | Diagramas |
|---|---|---|
| 1 | [Requisitos](01-requisitos.md) | R-01 funcionales · R-02 no funcionales · R-03 restricciones |
| 2 | [Casos de uso](02-casos-de-uso.md) | CU-00 general · CU-01 sitio · CU-02 acceso · CU-03 captación · CU-04 agenda · CU-05 pacientes y cobranza · CU-06 integración y operación, más especificación breve |
| 3 | [Estructura](03-estructura.md) | E-01 componentes · E-02 despliegue · E-03 paquetes · E-04 clases de dominio · E-05 módulos de servicio · E-06 entidad-relación · E-07 contratos de API · E-08 flujo de datos y caché |
| 4 | [Actividad](04-actividad.md) | A-01 recorrido completo · A-02 formulario · A-03 middleware · A-04 cola de Hoy · A-05 agendar · A-06 asistencia y conversión · A-07 registrar pago · A-08 cobranza · A-09 sincronización Google · A-10 service worker · A-11 keepalive · A-12 errores |
| 5 | [Estados](05-estados.md) | S-01 solicitud · S-02 seguimiento · S-03 cita · S-04 sincronización · S-05 cuota · S-06 paciente · S-07 sesión · S-08 integración Google |
| 6 | [Secuencia](06-secuencia.md) | Q-01 a Q-11 |
| 7 | [Trazabilidad](07-trazabilidad.md) | T-01 caso de uso → código → prueba → hallazgo · T-02 permisos por rol |
| 8 | [Decisiones y crecimiento](08-decisiones.md) | D-01 ADR · D-02 modos de fallo · D-03 qué revisar al crecer |

Los errores y las mejoras encontrados al levantar estos diagramas están en [../panel/hallazgos.md](../panel/hallazgos.md) (H-01 a H-18, U-01 a U-06).

## Cómo leer la notación

| Símbolo | Significado |
|---|---|
| Óvalo dentro de un recuadro | Caso de uso dentro del límite del sistema |
| Flecha punteada «include» | El caso siempre incluye al otro |
| Flecha punteada «extend» | El caso agrega comportamiento opcional al otro, bajo una condición |
| `*--` en clases | Composición: la parte se borra con el todo (`ON DELETE CASCADE`) |
| `o--` en clases | Agregación: la parte sobrevive (`ON DELETE SET NULL`) |
| `"1"`, `"0..1"`, `"0..*"` | Multiplicidad |
| Círculo negro / círculo con anillo | Estado inicial / estado final |
| Rombo | Decisión (actividad) o elección (estados) |
| Flecha continua / punteada en secuencia | Petición / respuesta |

## Estado del tablero de FigJam

El tablero se construye con el MCP de Figma. En el plan Starter se agota el tope de llamadas, así que se completa por tandas. Al 2026-09-16:

- Hecho: las 9 zonas y las tarjetas S-01 a S-07.
- S-08: generado en el tablero, sin colocar todavía en su zona.
- Pendiente: el resto. Las fuentes Mermaid de este directorio son exactamente las que se usan para generarlo; los casos de uso y las clases se dibujan con formas de FigJam.
