import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { expect, type Page } from '@playwright/test';

/**
 * Estas pruebas corren contra el Supabase real: el plan gratuito no da ramas de
 * base de datos. Para no confundir filas de prueba con solicitudes de pacientes
 * de verdad, cada corrida etiqueta las suyas con un prefijo único y las borra al
 * terminar. Si una corrida se interrumpe, `limpiarTodoLoDePrueba()` barre lo que
 * haya quedado de corridas anteriores.
 */
export const PREFIJO_PRUEBA = 'E2E';

/** Nombre irrepetible y reconocible a simple vista en el panel. */
export function nombreDePrueba(etiqueta: string): string {
  return `${PREFIJO_PRUEBA} ${etiqueta} ${randomUUID().slice(0, 8)}`;
}

function exigir(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `Falta ${nombre}. Las pruebas e2e necesitan el .env de la aplicación más ` +
        `E2E_ADMIN_PASSWORD; mira .env.example.`
    );
  }
  return valor;
}

/** Cliente con la clave secreta: bypasa RLS. Solo para preparar y verificar. */
export function clienteAdmin() {
  return createClient(exigir('SUPABASE_URL'), exigir('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function credencialesAdmin() {
  const email =
    process.env.E2E_ADMIN_EMAIL ?? exigir('ADMIN_EMAILS').split(',')[0]?.trim() ?? '';
  return { email, password: exigir('E2E_ADMIN_PASSWORD') };
}

export const CLAVE_PUBLICABLE = () => exigir('SUPABASE_PUBLISHABLE_KEY');
export const URL_SUPABASE = () => exigir('SUPABASE_URL');

/**
 * Inserta una solicitud directamente, saltándose el formulario.
 *
 * `/api/contact` limita a 5 envíos por IP cada 10 minutos y todas las pruebas
 * salen de la misma IP, así que pasar por el formulario en cada una agotaría la
 * cuota y las haría fallar por 429. El recorrido completo formulario → panel se
 * prueba una sola vez, a propósito, en panel.spec.ts; el resto de pruebas del
 * panel siembran así porque lo que verifican es el panel, no el formulario.
 */
export async function sembrarSolicitud(datos: {
  nombre: string;
  telefono: string;
  tratamiento: string;
  mensaje?: string;
}): Promise<string> {
  const { data, error } = await clienteAdmin()
    .from('solicitudes')
    .insert({ ...datos, mensaje: datos.mensaje ?? '', aviso_version: 'pruebas' })
    .select('id')
    .single();
  if (error) throw new Error(`No se pudo sembrar: ${error.message}`);
  return data.id as string;
}

/**
 * Borra las filas de esta corrida (o todas las de prueba si no se pasa nombre).
 *
 * Los pacientes van primero: `pacientes.solicitud_id` apunta a `solicitudes`, y
 * aunque la FK es ON DELETE SET NULL y no impediría el borrado, dejaría
 * pacientes de prueba huérfanos que ningún filtro por nombre volvería a
 * encontrar si su nombre se hubiera editado.
 */
export async function limpiar(nombre?: string): Promise<void> {
  const cliente = clienteAdmin();

  for (const tabla of ['pacientes', 'solicitudes'] as const) {
    const consulta = cliente.from(tabla).delete();
    const { error } = nombre
      ? await consulta.eq('nombre', nombre)
      : await consulta.like('nombre', `${PREFIJO_PRUEBA} %`);
    if (error) throw new Error(`No se pudo limpiar ${tabla}: ${error.message}`);
  }
}

/** El paciente que salió de una solicitud, leído sin pasar por la interfaz. */
export async function pacienteDeSolicitud(solicitudId: string) {
  const { data, error } = await clienteAdmin()
    .from('pacientes')
    .select('id, nombre, telefono, tratamiento, estado, inicio')
    .eq('solicitud_id', solicitudId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el paciente: ${error.message}`);
  return data;
}

/** Da de alta un paciente sin pasar por la interfaz. */
export async function sembrarPaciente(datos: {
  nombre: string;
  telefono?: string;
  tratamiento?: string;
}): Promise<string> {
  const { data, error } = await clienteAdmin()
    .from('pacientes')
    .insert({
      nombre: datos.nombre,
      telefono: datos.telefono ?? '33 0000 0000',
      tratamiento: datos.tratamiento ?? 'Brackets metálicos',
    })
    .select('id')
    .single();
  if (error) throw new Error(`No se pudo sembrar el paciente: ${error.message}`);
  return data.id as string;
}

/** El saldo calculado por la vista, para contrastarlo con lo que pinta el panel. */
export async function saldoDePaciente(pacienteId: string) {
  const { data, error } = await clienteAdmin()
    .from('vista_saldo_paciente')
    .select('costo_total, pagado, saldo, cuotas_vencidas, cuotas_pagadas, num_cuotas')
    .eq('paciente_id', pacienteId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el saldo: ${error.message}`);
  return data;
}

/** Las cuotas generadas para un paciente, con su estado derivado. */
export async function cuotasDePaciente(pacienteId: string) {
  const { data, error } = await clienteAdmin()
    .from('vista_cuotas')
    .select('numero, monto, restante, vence_el, estado')
    .eq('paciente_id', pacienteId)
    .order('numero');
  if (error) throw new Error(`No se pudieron leer las cuotas: ${error.message}`);
  return data ?? [];
}

/** El estado en que quedó una solicitud, leído sin pasar por la interfaz. */
export async function estadoDeSolicitud(id: string): Promise<string | null> {
  const { data, error } = await clienteAdmin()
    .from('solicitudes')
    .select('estado')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el estado: ${error.message}`);
  return (data?.estado as string | undefined) ?? null;
}

/**
 * Entra al panel por la interfaz, como lo haría la doctora.
 *
 * Tras el acceso siempre se aterriza en /admin (el inicio); `destino` lleva de
 * ahí a la sección que la prueba quiera. Por defecto Prospectos, que es donde
 * está la tabla que mira la mayoría de las pruebas.
 */
export async function entrarAlPanel(page: Page, destino = '/admin/prospectos'): Promise<void> {
  const { email, password } = credencialesAdmin();
  await page.goto('/admin/login');
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/admin');
  if (destino !== '/admin') await page.goto(destino);
}

/**
 * El formulario es una isla React con `client:visible`. Astro le pone el
 * atributo `ssr` al renderizarla en el servidor y se lo quita al hidratar.
 *
 * Hay que esperar a eso antes de escribir: si no, `fill()` mete el texto en el
 * DOM, React monta después con su estado inicial vacío y lo borra. La prueba
 * enviaría un formulario en blanco y culparía al servidor.
 */
export async function esperarFormularioListo(page: Page): Promise<void> {
  const isla = page.locator('astro-island[component-url*="BookingForm"]');
  await isla.scrollIntoViewIfNeeded();
  await expect(isla).not.toHaveAttribute('ssr', /.*/, { timeout: 20_000 });
}

/**
 * Llena y envía el formulario público como una paciente.
 */
export async function enviarFormulario(
  page: Page,
  datos: { nombre: string; telefono: string; tratamiento: string; mensaje?: string }
): Promise<void> {
  await page.goto('/#contacto');
  await esperarFormularioListo(page);
  await page.getByLabel('Nombre completo').fill(datos.nombre);
  await page.getByLabel('Teléfono').fill(datos.telefono);
  await page.getByLabel('¿Qué te interesa?').selectOption(datos.tratamiento);
  if (datos.mensaje) await page.getByLabel('Mensaje (opcional)').fill(datos.mensaje);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Solicitar valoración' }).click();
}
