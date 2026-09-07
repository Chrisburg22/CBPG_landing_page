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

export type EstadoCuota = 'pendiente' | 'parcial' | 'pagada' | 'vencida';

export const ETIQUETA_ESTADO_CUOTA: Record<EstadoCuota, string> = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagada: 'Pagada',
  vencida: 'Vencida',
};

export type TipoPago = 'mensualidad' | 'enganche' | 'cargo_suelto';

export const TIPOS_PAGO = ['mensualidad', 'enganche', 'cargo_suelto'] as const;

export const ETIQUETA_TIPO_PAGO: Record<TipoPago, string> = {
  mensualidad: 'Mensualidad',
  enganche: 'Enganche',
  cargo_suelto: 'Cargo suelto',
};

export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta';

export const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta'] as const;

export const ETIQUETA_METODO_PAGO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
};

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

/**
 * Los importes llegan como `string`, no como `number`.
 *
 * `numeric` de Postgres tiene más precisión que un `number` de JavaScript, así
 * que supabase-js lo entrega sin convertir para no perder centavos por el
 * camino. Convertir es responsabilidad de quien lo muestra: ver `dinero()` en
 * `src/lib/formato.ts`.
 */
type Importe = string;

type PlanFila = {
  id: string;
  creado_en: string;
  actualizado_en: string;
  paciente_id: string;
  tratamiento: string;
  costo_total: Importe;
  enganche: Importe;
  num_cuotas: number;
  dia_corte: number;
  inicio: string;
};

type PlanEscribible = Pick<
  PlanFila,
  'paciente_id' | 'tratamiento' | 'costo_total' | 'enganche' | 'num_cuotas' | 'dia_corte' | 'inicio'
>;

type CuotaFila = {
  id: string;
  creado_en: string;
  plan_id: string;
  numero: number;
  monto: Importe;
  vence_el: string;
};

type PagoFila = {
  id: string;
  creado_en: string;
  actualizado_en: string;
  paciente_id: string;
  /** Nulo = no corresponde a una mensualidad: enganche o cargo suelto. */
  cuota_id: string | null;
  tipo: TipoPago;
  concepto: string;
  monto: Importe;
  metodo: MetodoPago;
  pagado_el: string;
  nota: string;
};

type PagoEscribible = Pick<
  PagoFila,
  'paciente_id' | 'cuota_id' | 'tipo' | 'concepto' | 'monto' | 'metodo' | 'pagado_el' | 'nota'
>;

/** Cuota con lo pagado y su estado, ya derivados. Vista, no tabla: solo lectura. */
type VistaCuotaFila = {
  id: string;
  plan_id: string;
  paciente_id: string;
  numero: number;
  monto: Importe;
  vence_el: string;
  pagado: Importe;
  restante: Importe;
  estado: EstadoCuota;
};

/** Un renglón por paciente CON plan. Los que no tienen plan no aparecen. */
type VistaSaldoFila = {
  paciente_id: string;
  plan_id: string;
  costo_total: Importe;
  num_cuotas: number;
  pagado: Importe;
  saldo: Importe;
  cuotas_vencidas: number;
  monto_vencido: Importe;
  proxima_vence_el: string | null;
  cuotas_pagadas: number;
};

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
      planes_tratamiento: {
        Row: PlanFila;
        Insert: Partial<PlanEscribible> & Pick<PlanFila, 'paciente_id'>;
        Update: Partial<Omit<PlanEscribible, 'paciente_id'>>;
        Relationships: [];
      };
      cuotas: {
        Row: CuotaFila;
        Insert: Pick<CuotaFila, 'plan_id' | 'numero' | 'monto' | 'vence_el'>;
        // Sin columnas actualizables: el GRANT de 0004 no da UPDATE sobre
        // cuotas. Se rehacen borrando el plan y volviéndolo a crear.
        Update: Record<string, never>;
        Relationships: [];
      };
      pagos: {
        Row: PagoFila;
        Insert: Partial<PagoEscribible> & Pick<PagoFila, 'paciente_id' | 'monto'>;
        Update: Partial<Omit<PagoEscribible, 'paciente_id'>>;
        Relationships: [];
      };
      admins: {
        Row: { user_id: string; email: string; creado_en: string };
        Insert: { user_id: string; email: string; creado_en?: string };
        Update: Partial<{ email: string }>;
        Relationships: [];
      };
    };
    // Una vista se declara igual que una tabla pero SOLO con `Row`: sin `Insert`
    // ni `Update`, escribir en ella deja de compilar, que es exactamente lo que
    // queremos. Las dos llevan `security_invoker`, así que RLS sigue aplicando.
    Views: {
      vista_cuotas: {
        Row: VistaCuotaFila;
        Relationships: [];
      };
      vista_saldo_paciente: {
        Row: VistaSaldoFila;
        Relationships: [];
      };
    };
    // `es_admin` no aparece: vive en el esquema `privado`, fuera de PostgREST.
    Functions: {
      crear_plan_con_cuotas: {
        Args: {
          p_paciente_id: string;
          p_tratamiento: string;
          p_costo_total: number;
          p_enganche: number;
          p_num_cuotas: number;
          p_dia_corte: number;
          p_inicio: string;
        };
        // Devuelve el id del plan creado.
        Returns: string;
      };
    };
    // Vacíos con la forma que exige postgrest-js (mapeados, no Record<never,…>:
    // ese último no satisface `Record<string, …>` y colapsa `.update()` a never).
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

export type Solicitud = SolicitudFila;
export type Paciente = PacienteFila;
export type Plan = PlanFila;
export type Cuota = CuotaFila;
export type Pago = PagoFila;
export type CuotaConEstado = VistaCuotaFila;
export type SaldoPaciente = VistaSaldoFila;
