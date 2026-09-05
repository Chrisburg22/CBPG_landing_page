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

export type EstadoSolicitud =
  | 'nueva'
  | 'contactada'
  | 'agendada'
  | 'descartada'
  | 'terminado';

export const ESTADOS = [
  'nueva',
  'contactada',
  'agendada',
  'descartada',
  'terminado',
] as const;

/** Etiquetas para la interfaz. El valor en base de datos es la clave. */
export const ETIQUETA_ESTADO: Record<EstadoSolicitud, string> = {
  nueva: 'Nueva',
  contactada: 'Contactada',
  agendada: 'Agendada',
  descartada: 'Descartada',
  terminado: 'Terminado',
};

/**
 * `terminado` no se ofrece a mano en ningún selector: lo pone la conversión a
 * paciente y nada más. Dejarlo elegible permitiría marcar como terminado un
 * prospecto sin ficha de paciente detrás, que es justo la incoherencia que la
 * conversión existe para evitar. Sí aparece como filtro y como etiqueta.
 */
export const ESTADOS_MANUALES = ESTADOS.filter((valor) => valor !== 'terminado');

export type EstadoPaciente = 'activo' | 'retencion' | 'alta' | 'pausado';

export const ESTADOS_PACIENTE = ['activo', 'retencion', 'alta', 'pausado'] as const;

export const ETIQUETA_ESTADO_PACIENTE: Record<EstadoPaciente, string> = {
  activo: 'Activo',
  retencion: 'En retención',
  alta: 'Alta',
  pausado: 'Pausado',
};

/**
 * Alias de tipo y no `interface` a propósito: postgrest-js exige que cada Row
 * satisfaga `Record<string, unknown>`, y solo los alias de objeto reciben índice
 * implícito. Con una interface aquí, la resolución del esquema entero colapsa y
 * hasta un `.select()` devuelve `never`.
 */
type PacienteFila = {
  id: string;
  creado_en: string;
  actualizado_en: string;
  /** Solicitud de la que salió. `null` si llegó por recomendación, sin formulario. */
  solicitud_id: string | null;
  nombre: string;
  telefono: string;
  tratamiento: string;
  estado: EstadoPaciente;
  /** `date` de Postgres, no `timestamptz`: llega como 'AAAA-MM-DD'. */
  inicio: string;
  /** PUEDE CONTENER DATOS DE SALUD, igual que `solicitudes.mensaje`. */
  notas: string;
};

/** Lo que la doctora puede escribir. Espejo del GRANT por columna de 0002. */
type PacienteEscribible = Pick<
  PacienteFila,
  'solicitud_id' | 'nombre' | 'telefono' | 'tratamiento' | 'estado' | 'inicio' | 'notas'
>;

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
      pacientes: {
        Row: PacienteFila;
        // `nombre` es lo único imprescindible: el resto tiene default en la base.
        Insert: Partial<PacienteEscribible> & Pick<PacienteFila, 'nombre'>;
        Update: Partial<PacienteEscribible>;
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
export type Paciente = PacienteFila;
