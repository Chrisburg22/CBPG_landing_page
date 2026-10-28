---
tipo: nota
area: web
estado: verificado
actualizado: 2026-10-27
resumen: Secciones de la landing, copy centralizado, formulario de contacto y fotos.
fuentes:
  - src/pages/index.astro
  - src/config/site.ts
  - src/components/BookingForm.tsx
  - src/lib/validate.ts
  - src/pages/api/contact.ts
  - src/assets/README.md
  - src/layouts/Layout.astro
tags:
  - web
  - landing
  - contenido
---

# Landing y contenido

Sitio público en Astro, estático, con islas React solo donde hacen falta
interacción (`BeforeAfter`, `FAQ`, `BookingForm`). El copy vive casi todo en un
solo archivo.

## Rutas públicas

| Ruta | Archivo |
| --- | --- |
| `/` | `src/pages/index.astro` |
| `/aviso-de-privacidad` | `src/pages/aviso-de-privacidad.astro` |
| `/terminos` | `src/pages/terminos.astro` |
| `/404` | `src/pages/404.astro` |

`Layout.astro` arma `<head>`, canonical, Open Graph, JSON-LD de `Dentist` y el
`noindex` opcional para las páginas legales. El dominio canónico sale de
`site` en `astro.config.mjs`.

## Secciones de la home

En orden, según `src/pages/index.astro`:

1. `Nav`
2. `Hero`
3. `Strip`
4. `About`
5. `Treatments`
6. `CaseStudy` (incluye comparadores `BeforeAfter`)
7. `Process`
8. `Contact`
9. `FAQ`
10. `Footer`

`Testimonials.astro` existe pero **está comentado** en la home: no se publica
hasta que haya testimonios reales con permiso.

## Dónde se cambia el copy

Todo el contenido estructurado está en `src/config/site.ts`:

| Export | Qué controla |
| --- | --- |
| `doctor` | Nombre, teléfono, WhatsApp, horario, Instagram, años, métricas |
| `legal` | Responsable, domicilio, correo ARCO, cédulas y fecha del aviso |
| `treatments` | Tarjetas de tratamientos |
| `faqs` | Preguntas frecuentes |
| `testimonials` | Testimonios (hoy sin publicar) |
| `caseStudy` | Caso clínico: etapas, textos y `alt` de las fotos |
| `processSteps` | Pasos del proceso |
| `AVISO_VERSION` | Versión que se graba con cada solicitud |

Los tipos están en `src/types/site.ts`.

### Datos pendientes de la doctora

- `legal` tiene los campos **vacíos a propósito**. `/aviso-de-privacidad` los
  marca en pantalla como datos faltantes; no inventes responsable, domicilio,
  correo ni cédulas.
- `caseStudy.treatment` y `caseStudy.duration` también están vacíos y se marcan
  en pantalla. El texto del caso es un **borrador del desarrollador**: la
  doctora debe revisarlo y confirmar lo clínico.
- `legal.ultimaActualizacion` vacío hace que `AVISO_VERSION` sea
  `'sin-publicar'`; es la verdad mientras no haya aviso publicado.

## Formulario de contacto

- `BookingForm.tsx` (isla React) valida en el navegador y hace `POST` a
  `/api/contact`.
- La validación se comparte con el servidor en `src/lib/validate.ts`: nunca
  confíes solo en la del cliente.
- Campos: nombre, teléfono, tratamiento, mensaje y consentimiento. **No se pide
  correo** a propósito; el consultorio contacta por teléfono o WhatsApp.
- Hay un campo trampa `empresa` (honeypot): si viene relleno, el endpoint
  responde como si todo hubiera ido bien y no guarda nada.
- `/api/contact` limita a **5 envíos por IP cada 10 minutos**, en memoria. Se
  reinicia con cada arranque de la función; frena ráfagas, no es un WAF.
- El insert usa la clave secreta (`servicio.ts`), porque el rol `anon` no puede
  escribir en `solicitudes`. El formulario público tampoco puede escribir
  `origen` ni la próxima acción: esos GRANT son solo para `authenticated`.
- Cada fila guarda `consentimiento_en` y `aviso_version`.
- El mensaje puede contener datos de salud: no lo pongas en logs, URLs ni
  `set:html`.

## Fotos

- Los componentes cargan las imágenes con `import.meta.glob`, así que el sitio
  **compila aunque falten**: se dibuja un marcador rayado y la foto aparece al
  copiarla, sin tocar código.
- Los archivos esperados y sus proporciones están en `src/assets/README.md`.
- No las generes a mano: usa `scripts/preparar-imagenes.mjs` desde los
  originales.
- Las fotos de pacientes solo se publican con **consentimiento firmado**.

## SEO y rastreo

- `robots.txt` pide `Disallow: /admin/`.
- El sitemap excluye `/admin`; `scripts/verificar-build.mjs` falla si aparece.
- El panel lleva `noindex` en el layout y `X-Robots-Tag` desde el middleware.
- No hay formulario de contacto en el HTML estático: la isla se hidrata y
  envía por `fetch`.

Ver [[Arquitectura]] y [[Comandos y verificacion]].
