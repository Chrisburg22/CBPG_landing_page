import { expect, test } from '@playwright/test';
import {
  cuotasDePaciente,
  entrarAlPanel,
  limpiar,
  nombreDePrueba,
  saldoDePaciente,
  sembrarPaciente,
} from './apoyo';

/**
 * El dinero. Todo lo que se comprueba aquí se contrasta contra la base y no
 * contra la pantalla: un saldo que se ve bien pero está mal guardado es peor que
 * uno que se ve mal, porque nadie lo descubre.
 */
test.describe('Alta de paciente desde cero', () => {
  let nombre: string;

  test.beforeEach(() => {
    nombre = nombreDePrueba('alta');
  });

  test.afterEach(async () => {
    await limpiar(nombre);
  });

  test('se crea sin pasar por un prospecto', async ({ page }) => {
    await entrarAlPanel(page, '/admin/pacientes');
    await page.getByRole('link', { name: '+ Nuevo paciente' }).first().click();

    await page.getByLabel('Nombre completo').fill(nombre);
    await page.getByLabel('Teléfono').fill('33 7777 8888');
    await page.getByLabel('Tratamiento', { exact: true }).fill('Brackets estéticos');
    await page.getByRole('button', { name: 'Crear paciente' }).click();

    await expect(page).toHaveURL(/\/admin\/pacientes\/[0-9a-f-]{36}/);
    await expect(page.getByRole('heading', { name: nombre })).toBeVisible();

    // Sin solicitud detrás, la ficha lo dice.
    await expect(page.getByText('Alta directa')).toBeVisible();
  });
});

test.describe('Plan de tratamiento y pagos', () => {
  let nombre: string;
  let pacienteId: string;

  test.beforeEach(async () => {
    nombre = nombreDePrueba('pago');
    pacienteId = await sembrarPaciente({ nombre });
  });

  test.afterEach(async () => {
    await limpiar(nombre);
  });

  test('el plan genera las cuotas y los importes cuadran al centavo', async ({ page }) => {
    await entrarAlPanel(page, `/admin/pacientes/${pacienteId}/plan`);

    // 10000 entre 3 no da un número exacto: es justo el caso donde un redondeo
    // ingenuo deja un centavo sin cobrar para siempre.
    await page.getByLabel('Costo total').fill('10000');
    await page.getByLabel('Enganche').fill('0');
    await page.getByLabel('Mensualidades').fill('3');
    await page.getByLabel('Día de corte').fill('15');
    await page.getByRole('button', { name: 'Crear plan' }).click();

    await expect(page).toHaveURL(/\/admin\/pacientes\//);
    await expect(page.getByText('Plan guardado')).toBeVisible();

    const cuotas = await cuotasDePaciente(pacienteId);
    expect(cuotas).toHaveLength(3);
    const suma = cuotas.reduce((t, c) => t + Math.round(Number(c.monto) * 100), 0);
    expect(suma).toBe(1_000_000); // 10.000,00 en centavos, exacto
  });

  test('registrar un pago baja el saldo', async ({ page }) => {
    await entrarAlPanel(page, `/admin/pacientes/${pacienteId}/plan`);
    await page.getByLabel('Costo total').fill('12000');
    await page.getByLabel('Mensualidades').fill('12');
    await page.getByRole('button', { name: 'Crear plan' }).click();
    await expect(page.getByText('Plan guardado')).toBeVisible();

    await page.goto(`/admin/pagos/nuevo?paciente=${pacienteId}`);
    await page.getByLabel('Monto').fill('1000');
    await page.getByLabel('Concepto').fill('Mensualidad 1');
    await page.getByRole('button', { name: 'Guardar pago' }).click();

    await expect(page).toHaveURL(new RegExp(`/admin/pacientes/${pacienteId}`));
    await expect(page.getByText('Pago registrado')).toBeVisible();

    const saldo = await saldoDePaciente(pacienteId);
    expect(Number(saldo?.pagado)).toBe(1000);
    expect(Number(saldo?.saldo)).toBe(11000);
  });

  test('un plan sin mensualidades no genera calendario pero sí saldo', async ({ page }) => {
    await entrarAlPanel(page, `/admin/pacientes/${pacienteId}/plan`);
    await page.getByLabel('Costo total').fill('8000');
    await page.getByLabel('Mensualidades').fill('0');
    await page.getByRole('button', { name: 'Crear plan' }).click();
    await expect(page.getByText('Plan guardado')).toBeVisible();

    expect(await cuotasDePaciente(pacienteId)).toHaveLength(0);

    const saldo = await saldoDePaciente(pacienteId);
    expect(Number(saldo?.costo_total)).toBe(8000);
    expect(Number(saldo?.saldo)).toBe(8000);
  });

  test('rehacer el plan conserva los pagos ya registrados', async ({ page }) => {
    await entrarAlPanel(page, `/admin/pacientes/${pacienteId}/plan`);
    await page.getByLabel('Costo total').fill('10000');
    await page.getByLabel('Mensualidades').fill('10');
    await page.getByRole('button', { name: 'Crear plan' }).click();
    await expect(page.getByText('Plan guardado')).toBeVisible();

    await page.goto(`/admin/pagos/nuevo?paciente=${pacienteId}`);
    await page.getByLabel('Monto').fill('2500');
    await page.getByRole('button', { name: 'Guardar pago' }).click();
    await expect(page.getByText('Pago registrado')).toBeVisible();

    // Cambian los términos: menos mensualidades, otro precio. El calendario se
    // rehace, pero el dinero que ya entró no puede desaparecer con él.
    await page.goto(`/admin/pacientes/${pacienteId}/plan`);
    await page.getByLabel('Costo total').fill('9000');
    await page.getByLabel('Mensualidades').fill('5');
    await page.getByRole('button', { name: 'Rehacer plan' }).click();
    await expect(page.getByText('Plan guardado')).toBeVisible();

    expect(await cuotasDePaciente(pacienteId)).toHaveLength(5);
    const saldo = await saldoDePaciente(pacienteId);
    expect(Number(saldo?.pagado)).toBe(2500);
    expect(Number(saldo?.saldo)).toBe(6500);
  });

  test('el monto tiene que ser un número mayor que cero', async ({ page }) => {
    await entrarAlPanel(page, `/admin/pagos/nuevo?paciente=${pacienteId}`);
    await page.getByLabel('Monto').fill('0');
    await page.getByRole('button', { name: 'Guardar pago' }).click();
    await expect(page.getByText('mayor que cero')).toBeVisible();

    // Y no se registró nada.
    expect(await saldoDePaciente(pacienteId)).toBeNull();
  });

  test('un pago mal tecleado se puede quitar', async ({ page }) => {
    await entrarAlPanel(page, `/admin/pagos/nuevo?paciente=${pacienteId}`);
    await page.getByLabel('Monto').fill('500');
    await page.getByRole('button', { name: 'Guardar pago' }).click();
    await expect(page.getByText('Pago registrado')).toBeVisible();

    await page.goto('/admin/pagos');
    const fila = page.locator('tr', { hasText: nombre });
    await expect(fila).toBeVisible();

    page.once('dialog', (d) => d.accept());
    await fila.getByRole('button', { name: 'Quitar' }).click();
    await expect(page.locator('tr', { hasText: nombre })).toHaveCount(0);
  });
});
