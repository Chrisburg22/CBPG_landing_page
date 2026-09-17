import { expect, test } from '@playwright/test';
import { entrarAlPanel } from '../apoyo';
import { auditarPantalla, vigilar } from './auditar';
import { diaMx, limpiarDemo, sembrarEscenario, type Escenario } from './escenario';

/**
 * Recorre TODAS las pantallas del panel a tamaño de teléfono y audita cada una.
 * Una prueba por sección para que el reporte diga dónde está cada cosa.
 */

let e: Escenario;
test.beforeAll(async () => {
  e = await sembrarEscenario();
});
test.afterAll(async () => {
  await limpiarDemo();
});

test('acceso', async ({ page }, info) => {
  const fin = vigilar(page, info);
  await page.goto('/admin/login');
  await auditarPantalla(page, info, '01-login');
  await page.goto('/admin/login?error=credenciales');
  await auditarPantalla(page, info, '01-login-error');
  fin();
});

test('inicio', async ({ page }, info) => {
  const fin = vigilar(page, info);
  await entrarAlPanel(page, '/admin');
  await auditarPantalla(page, info, '02-inicio');
  await page.goto('/admin?periodo=7d');
  await auditarPantalla(page, info, '02-inicio-7d');
  fin();
});

test('prospectos', async ({ page }, info) => {
  const fin = vigilar(page, info);
  await entrarAlPanel(page, '/admin/prospectos');
  await auditarPantalla(page, info, '03-prospectos');
  await page.goto('/admin/prospectos?seguimiento=vencido');
  await auditarPantalla(page, info, '03-prospectos-vencidos');
  await page.goto('/admin/prospectos?q=zzzz-nadie');
  await auditarPantalla(page, info, '03-prospectos-vacio');
  await page.goto(`/admin/prospectos/${e.solicitudes.nueva}`);
  await auditarPantalla(page, info, '03-prospecto-nueva');
  await page.goto(`/admin/prospectos/${e.solicitudes.contactada}`);
  await auditarPantalla(page, info, '03-prospecto-seguimiento-vencido');
  await page.goto(`/admin/prospectos/${e.solicitudes.largo}`);
  await auditarPantalla(page, info, '03-prospecto-nombre-largo');
  await page.goto(`/admin/prospectos/${e.solicitudes.valorada}/convertir`);
  await auditarPantalla(page, info, '03-convertir');
  fin();
});

test('agenda', async ({ page }, info) => {
  const fin = vigilar(page, info);
  await entrarAlPanel(page, '/admin/agenda');
  await auditarPantalla(page, info, '04-agenda-dia');
  await page.goto(`/admin/agenda?cita=${e.citas.agendadaHoy}`);
  await auditarPantalla(page, info, '04-agenda-cita-abierta');
  await page.goto(`/admin/agenda?vista=semana&dia=${diaMx()}`);
  await auditarPantalla(page, info, '04-agenda-semana');
  await page.goto(`/admin/agenda?dia=${diaMx(-1)}&cita=${e.citas.valoradaAyer}`);
  await auditarPantalla(page, info, '04-agenda-atendida-ofrece-convertir');
  await page.goto('/admin/agenda/nueva');
  await auditarPantalla(page, info, '04-cita-nueva');
  await page.goto(`/admin/agenda/nueva?solicitud=${e.solicitudes.nueva}`);
  await auditarPantalla(page, info, '04-cita-nueva-desde-prospecto');
  await page.goto(`/admin/agenda/${e.citas.agendadaHoy}`);
  await auditarPantalla(page, info, '04-cita-editar');
  fin();
});

test('pacientes', async ({ page }, info) => {
  const fin = vigilar(page, info);
  await entrarAlPanel(page, '/admin/pacientes');
  await auditarPantalla(page, info, '05-pacientes');
  await page.goto('/admin/pacientes/nuevo');
  await auditarPantalla(page, info, '05-paciente-nuevo');
  await page.goto(`/admin/pacientes/${e.pacientes.paciente}`);
  await auditarPantalla(page, info, '05-paciente-con-plan');
  await page.goto(`/admin/pacientes/${e.pacientes.pacienteSinPlan}`);
  await auditarPantalla(page, info, '05-paciente-sin-plan');
  await page.goto(`/admin/pacientes/${e.pacientes.paciente}/plan`);
  await auditarPantalla(page, info, '05-plan-editar');
  await page.goto(`/admin/pacientes/${e.pacientes.pacienteSinPlan}/plan`);
  await auditarPantalla(page, info, '05-plan-nuevo');
  fin();
});

test('pagos', async ({ page }, info) => {
  const fin = vigilar(page, info);
  await entrarAlPanel(page, '/admin/pagos');
  await auditarPantalla(page, info, '06-pagos');
  await page.goto('/admin/pagos/nuevo');
  await auditarPantalla(page, info, '06-pago-nuevo');
  await page.goto(`/admin/pagos/nuevo?paciente=${e.pacientes.paciente}`);
  await auditarPantalla(page, info, '06-pago-nuevo-paciente');
  fin();
});

test('google', async ({ page }, info) => {
  const fin = vigilar(page, info);
  await entrarAlPanel(page, '/admin/integracion/google');
  await expect(page.getByRole('heading', { level: 1, name: 'Google Calendar' })).toBeVisible();
  await auditarPantalla(page, info, '07-google');
  fin();
});
