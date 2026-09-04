/**
 * Tipos de la base de datos. Espejo de la migración `crear_solicitudes_y_admins`.
 *
 * Cotejado contra `generate_typescript_types` del proyecto wffqduqgnknopjrwyjpe
 * el 2026-09-03, y revisado el 2026-09-04 al retirar `email`, `notificada` y
 * `notificacion_id`. Se mantiene escrito a mano por dos divergencias deliberadas,
 * las dos en la dirección de ser más estricto que lo generado:
 *
 *   1. `estado` se declara como unión y no como `string`. En la base es un CHECK
 *      sobre texto, no un enum de Postgres, así que el generador no puede
 *      estrecharlo — pero nosotros sí sabemos los cuatro valores.
 *   2. `Update` solo admite las columnas que la doctora puede tocar. El generador
 *      no ve los GRANT por columna; sin esto, un update ilegal compilaría y
 *      fallaría en producción en vez de en `astro check`.
 *
 * Al cambiar el esquema: regenerar, comparar, y reflejar aquí lo que cambie
 * conservando esas dos divergencias.
 */

export type EstadoSolicitud = 'nueva' | 'contactada' | 'agendada' | 'descartada';

export const ESTADOS = ['nueva', 'contactada', 'agendada', 'descartada'] as const;

/** Etiquetas para la interfaz. El valor en base de datos es la clave. */
export const ETIQUETA_ESTADO: Record<EstadoSolicitud, string> = {
  nueva: 'Nueva',
  contactada: 'Contactada',
  agendada: 'Agendada',
  descartada: 'Descartada',
};

/**
 * Alias de tipo y no `interface` a propósito: postgrest-js exige que cada Row
 * satisfaga `Record<string, unknown>`, y solo los alias de objeto reciben índice
 * implícito. Con una interface aquí, la resolución del esquema entero colapsa y
 * hasta un `.select()` devuelve `never`.
 */
type SolicitudFila = {
  id: string;
  creado_en: string;
  actualizado_en: string;
  nombre: string;
  telefono: string;
  tratamiento: string;
  /** PUEDE CONTENER DATOS DE SALUD. Nunca a logs, nunca a una URL, nunca `set:html`. */
  mensaje: string;
  consentimiento_en: string;
  aviso_version: string;
  estado: EstadoSolicitud;
  notas: string;
};

export type Database = {
  // supabase-js resuelve con esto los tipos de escritura; sin él, `.update()`
  // colapsa a `never` y no compila nada. Copiado de la salida del generador.
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      solicitudes: {
        Row: SolicitudFila;
        Insert: Partial<Omit<SolicitudFila, 'id'>> &
          Pick<SolicitudFila, 'nombre' | 'telefono' | 'tratamiento'>;
        // La doctora solo puede tocar estas dos columnas: el GRANT por columna
        // lo impone en la base de datos, esto lo refleja en el tipo.
        Update: Partial<Pick<SolicitudFila, 'estado' | 'notas'>>;
        Relationships: [];
      };
      admins: {
        Row: { user_id: string; email: string; creado_en: string };
        Insert: { user_id: string; email: string; creado_en?: string };
        Update: Partial<{ email: string }>;
        Relationships: [];
      };
    };
    // Vacíos con la forma que exige postgrest-js (mapeados, no Record<never,…>:
    // ese último no satisface `Record<string, …>` y colapsa `.update()` a never).
    // `es_admin` no aparece: vive en el esquema `privado`, fuera de PostgREST.
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

export type Solicitud = SolicitudFila;
