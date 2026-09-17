import { clienteAdmin } from '../apoyo';

/**
 * Un consultorio de mentira, creíble, para auditar el panel y grabar el manual.
 *
 * Los nombres son inventados y están elegidos para no parecerse a nadie: no se
 * usa el prefijo `E2E` porque en un video de manual distrae. A cambio la
 * limpieza no busca por prefijo sino por esta lista exacta, **y** por el
 * teléfono de mentira (`33 0000 07xx`), así que nunca puede llevarse por
 * delante una fila real que casualmente se llame igual.
 */
export const DEMO = {
  nueva: 'Valeria Ontiveros Garza',
  contactada: 'Rodrigo Castañeda Ibarra',
  agendada: 'Ximena Arreola Duarte',
  valorada: 'Emilio Zavala Rentería',
  descartada: 'Paulina Echeverría Soto',
  paciente: 'Lucía Barragán Peña',
  pacienteSinPlan: 'Mateo Villaseñor Cruz',
  /** Para el recorrido de alta directa: la crea el propio video. */
  pacienteNuevo: 'Andrea Solórzano Muñiz',
  /** 60 caracteres: la auditoría comprueba que no rompa filas ni cabeceras. */
  largo: 'María de los Ángeles Fernández de Córdoba Villarreal Ochoa',
} as const;

export const NOMBRES_DEMO: readonly string[] = Object.values(DEMO);

/** Todos los teléfonos de demo comparten este prefijo. */
const TEL = '33 0000 07';
export const telDemo = (n: number) => `${TEL}${String(n).padStart(2, '0')}`;

/** 'AAAA-MM-DD' de dentro de `dias` días, en hora de México. */
export function diaMx(dias = 0): string {
  return new Date(Date.now() + dias * 86_400_000).toLocaleDateString('en-CA', {
    timeZone: 'America/Mexico_City',
  });
}

/** ISO en UTC de un día y hora de México (México no tiene horario de verano desde 2022). */
export function isoMx(dia: string, hhmm: string): string {
  return new Date(`${dia}T${hhmm}:00-06:00`).toISOString();
}

/** Primer día hábil (lunes a viernes) a partir de hoy + `desde`. */
export function diaHabil(desde = 0): string {
  for (let i = desde; i < desde + 7; i++) {
    const d = diaMx(i);
    const semana = new Date(`${d}T12:00:00-06:00`).getUTCDay();
    if (semana >= 1 && semana <= 5) return d;
  }
  return diaMx(desde);
}

function exigirOk<T = { id: string }>(r: { data: unknown; error: { message: string } | null }, que: string): T {
  if (r.error) throw new Error(`No se pudo sembrar ${que}: ${r.error.message}`);
  return r.data as T;
}

/** Borra todo lo de demo. Seguro de repetir. */
export async function limpiarDemo(): Promise<void> {
  const c = clienteAdmin();
  const nombres = [...NOMBRES_DEMO];
  // Citas primero: su FK a solicitudes/pacientes es SET NULL y se quedarían.
  exigirOk(
    await c.from('citas').delete().in('nombre_contacto', nombres).like('telefono_contacto', `${TEL}%`),
    'limpieza de citas'
  );
  // Citas creadas desde la interfaz para un paciente de demo copian su teléfono,
  // pero una editada a mano podría no hacerlo: por nombre y sin teléfono, solo
  // si además cuelgan de un paciente o prospecto de demo.
  const { data: pac } = await c.from('pacientes').select('id').in('nombre', nombres).like('telefono', `${TEL}%`);
  const { data: sol } = await c.from('solicitudes').select('id').in('nombre', nombres).like('telefono', `${TEL}%`);
  const idsPac = (pac ?? []).map((p) => p.id);
  const idsSol = (sol ?? []).map((s) => s.id);
  if (idsPac.length) exigirOk(await c.from('citas').delete().in('paciente_id', idsPac), 'citas de pacientes');
  if (idsSol.length) exigirOk(await c.from('citas').delete().in('solicitud_id', idsSol), 'citas de prospectos');
  // Pacientes antes que solicitudes; pagos, planes, cuotas y recordatorios caen en cascada.
  if (idsPac.length) exigirOk(await c.from('pacientes').delete().in('id', idsPac), 'pacientes');
  // Un paciente convertido desde un prospecto de demo hereda su teléfono.
  if (idsSol.length) exigirOk(await c.from('solicitudes').delete().in('id', idsSol), 'solicitudes');
}

export interface Escenario {
  solicitudes: Record<'nueva' | 'contactada' | 'agendada' | 'valorada' | 'descartada' | 'largo', string>;
  pacientes: Record<'paciente' | 'pacienteSinPlan', string>;
  citas: Record<'agendadaHoy' | 'valoradaAyer' | 'controlPaciente' | 'fueraHorario', string>;
}

/**
 * Siembra el consultorio completo. Todo relativo a hoy, para que la cola de
 * Inicio, la rejilla y las cuotas vencidas tengan algo que enseñar.
 */
export async function sembrarEscenario(): Promise<Escenario> {
  await limpiarDemo();
  const c = clienteAdmin();
  const hoy = diaMx();
  const ayer = diaMx(-1);

  const solicitud = async (
    nombre: string,
    n: number,
    extra: Record<string, unknown>
  ): Promise<string> =>
    exigirOk(
      await c
        .from('solicitudes')
        .insert({ nombre, telefono: telDemo(n), aviso_version: 'demo', ...extra })
        .select('id')
        .single(),
      nombre
    ).id as string;

  const solicitudes = {
    nueva: await solicitud(DEMO.nueva, 1, {
      tratamiento: 'Alineadores invisibles',
      mensaje:
        'Hola, vi su página y me interesan los alineadores. ¿Tienen citas por la tarde entre semana?',
      origen: 'sitio',
    }),
    contactada: await solicitud(DEMO.contactada, 2, {
      tratamiento: 'Brackets metálicos',
      mensaje: 'Quisiera saber el costo de los brackets para mi hijo de 13 años.',
      origen: 'instagram',
      estado: 'contactada',
      proxima_accion_en: isoMx(ayer, '17:00'),
      proxima_accion_tipo: 'llamada',
      proxima_accion_nota: 'Llamar después de las 5',
    }),
    agendada: await solicitud(DEMO.agendada, 3, {
      tratamiento: 'Ortodoncia infantil',
      mensaje: 'Me la recomendó mi hermana. Mi hija tiene 9 años.',
      origen: 'recomendacion',
      estado: 'agendada',
    }),
    valorada: await solicitud(DEMO.valorada, 4, {
      tratamiento: 'Alineadores invisibles',
      mensaje: '',
      origen: 'instagram',
      estado: 'agendada',
    }),
    descartada: await solicitud(DEMO.descartada, 5, {
      tratamiento: 'Blanqueamiento',
      mensaje: 'Solo quería información de precios.',
      origen: 'otro',
      estado: 'descartada',
    }),
    largo: await solicitud(DEMO.largo, 6, {
      tratamiento: 'Retenedores',
      mensaje: 'Mensaje de prueba de longitud. '.repeat(12).trim(),
      origen: 'sitio',
    }),
  };

  const acciones = [
    { solicitud_id: solicitudes.contactada, tipo: 'whatsapp', nota: '' },
    { solicitud_id: solicitudes.agendada, tipo: 'llamada', nota: '' },
    { solicitud_id: solicitudes.valorada, tipo: 'whatsapp', nota: '' },
  ];
  exigirOk(await c.from('acciones_prospecto').insert(acciones), 'acciones');

  const paciente = async (nombre: string, n: number, tratamiento: string, inicio: string) =>
    exigirOk(
      await c
        .from('pacientes')
        .insert({ nombre, telefono: telDemo(n), tratamiento, inicio })
        .select('id')
        .single(),
      nombre
    ).id as string;

  const pacientes = {
    paciente: await paciente(DEMO.paciente, 10, 'Brackets estéticos', diaMx(-95)),
    pacienteSinPlan: await paciente(DEMO.pacienteSinPlan, 11, 'Alineadores invisibles', diaMx(-3)),
  };

  // Plan que empezó hace tres meses: deja cuotas pagadas, una vencida y la siguiente por vencer.
  exigirOk(
    await c.rpc('crear_plan_con_cuotas', {
      p_paciente_id: pacientes.paciente,
      p_tratamiento: 'Brackets estéticos',
      p_costo_total: 24000,
      p_enganche: 6000,
      p_num_cuotas: 12,
      p_dia_corte: 5,
      p_inicio: diaMx(-95),
    }),
    'plan'
  );
  const { data: cuotas } = await c
    .from('cuotas')
    .select('id, numero, monto')
    .order('numero')
    .eq(
      'plan_id',
      exigirOk(
        await c.from('planes_tratamiento').select('id').eq('paciente_id', pacientes.paciente).single(),
        'plan id'
      ).id
    );
  const pagos = [
    { paciente_id: pacientes.paciente, tipo: 'enganche', monto: '6000.00', metodo: 'transferencia', pagado_el: diaMx(-95), concepto: 'Enganche' },
    ...(cuotas ?? []).slice(0, 2).map((q, i) => ({
      paciente_id: pacientes.paciente,
      cuota_id: q.id,
      tipo: 'mensualidad',
      monto: String(q.monto),
      metodo: i === 0 ? 'efectivo' : 'tarjeta',
      pagado_el: diaMx(-60 + i * 30),
      concepto: `Mensualidad ${q.numero}`,
    })),
  ];
  exigirOk(await c.from('pagos').insert(pagos), 'pagos');

  const cita = async (datos: Record<string, unknown>) =>
    exigirOk(
      await c
        .from('citas')
        .insert({ google_sync: 'desactivada', duracion_min: 30, ...datos })
        .select('id')
        .single(),
      'cita'
    ).id as string;

  const citas = {
    agendadaHoy: await cita({
      nombre_contacto: DEMO.agendada,
      telefono_contacto: telDemo(3),
      solicitud_id: solicitudes.agendada,
      inicia_en: isoMx(hoy, '17:30'),
      duracion_min: 45,
      tipo: 'valoracion',
      nota: 'Viene con su mamá',
    }),
    valoradaAyer: await cita({
      nombre_contacto: DEMO.valorada,
      telefono_contacto: telDemo(4),
      solicitud_id: solicitudes.valorada,
      inicia_en: isoMx(ayer, '11:00'),
      duracion_min: 45,
      tipo: 'valoracion',
      estado: 'atendida',
    }),
    controlPaciente: await cita({
      nombre_contacto: DEMO.paciente,
      telefono_contacto: telDemo(10),
      paciente_id: pacientes.paciente,
      inicia_en: isoMx(hoy, '10:00'),
      tipo: 'control',
      estado: 'confirmada',
    }),
    // 19:30 en México = 01:30 UTC del día siguiente: prueba el día que enseña cada enlace.
    fueraHorario: await cita({
      nombre_contacto: DEMO.largo,
      telefono_contacto: telDemo(6),
      solicitud_id: solicitudes.largo,
      inicia_en: isoMx(diaHabil(1), '19:30'),
      tipo: 'valoracion',
    }),
  };
  exigirOk(
    await c.from('acciones_prospecto').insert([
      { solicitud_id: solicitudes.agendada, tipo: 'cita_creada', cita_id: citas.agendadaHoy },
      { solicitud_id: solicitudes.valorada, tipo: 'cita_creada', cita_id: citas.valoradaAyer },
      { solicitud_id: solicitudes.largo, tipo: 'cita_creada', cita_id: citas.fueraHorario },
    ]),
    'acciones de cita'
  );

  return { solicitudes, pacientes, citas };
}
