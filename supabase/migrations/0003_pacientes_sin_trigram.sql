-- Revierte el índice trigram de `pacientes` que introdujo 0002.
--
-- 0002 creó `pg_trgm` para que el `ilike '%…%'` del buscador usara un índice GIN.
-- Fue optimizar de más: el linter de seguridad de Supabase marca cualquier
-- extensión instalada en `public` (0014_extension_in_public), y a cambio de ese
-- aviso permanente ganábamos nada — un consultorio maneja cientos de pacientes,
-- no millones, y `solicitudes` resuelve exactamente la misma búsqueda con un
-- escaneo secuencial sin que se note.
--
-- Si algún día el volumen lo pide: instalar la extensión en el esquema
-- `extensions`, no en `public`.
--
-- El índice por estado sí se queda: lo usa el filtro del listado y no depende de
-- ninguna extensión.

drop index if exists public.pacientes_nombre_trgm;
drop extension if exists pg_trgm;
