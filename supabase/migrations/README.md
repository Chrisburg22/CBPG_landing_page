# Migraciones

`solicitudes` y `admins` son **anteriores** a esta carpeta: se crearon con la
migración `crear_solicitudes_y_admins` directamente en el proyecto remoto
(`wffqduqgnknopjrwyjpe`) y no tienen `.sql` aquí. Lo que hay en esta carpeta es
todo lo que vino después, para que el esquema deje de vivir solo en la nube y se
pueda revisar en un diff.

## Cómo se aplican

Cada archivo se aplica al remoto con la herramienta de Supabase (`apply_migration`),
con el mismo nombre que el archivo pero sin el número ni la extensión. No hay CLI
de Supabase en el proyecto ni base local: el plan gratuito no da ramas de base de
datos, así que **se aplica sobre producción**. Por eso cada migración va sola y es
lo más pequeña posible.

El nombre registrado en el remoto debe coincidir con el del archivo, o `list_migrations`
deja de servir para saber qué falta por aplicar.

## Reglas que sigue el esquema

Tomadas de las tablas que ya existían, para no tener dos estilos:

- Columnas **NOT NULL con `default`** (`''` para texto, `now()` para fechas). En este
  esquema no hay nulos salvo donde el nulo significa algo (`pacientes.solicitud_id`).
- `id uuid primary key default gen_random_uuid()`.
- `creado_en` / `actualizado_en timestamptz not null default now()`, y un trigger
  `BEFORE UPDATE` que llama a `public.tocar_actualizado_en()`.
- Los estados son **CHECK sobre texto**, no enums de Postgres: cambiar un enum
  requiere migración con bloqueo; ampliar un CHECK, no.
- Límites de longitud como CHECK, no como `varchar(n)`.
- **RLS activo en todas**, con `privado.es_admin()` — la misma función que protege
  `solicitudes`. Esa función es `SECURITY DEFINER` con `search_path` vacío.
- **GRANT por columna** cuando la doctora no debe poder escribir algo. El tipo de
  TypeScript en `src/lib/supabase/tipos.ts` refleja esos GRANT en su `Update`, así
  que un update ilegal falla en `astro check` y no en producción.

## Después de aplicar

Actualizar `src/lib/supabase/tipos.ts` a mano y cotejar con `generate_typescript_types`,
conservando las dos divergencias que el archivo documenta (uniones estrechas para
los CHECK, `Update` limitado a lo que se puede escribir).
