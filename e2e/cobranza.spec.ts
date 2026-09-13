import { expect, test } from '@playwright/test';
import {
  entrarAlPanel,
  limpiar,
  nombreDePrueba,
  recordatoriosDePaciente,
  sembrarPaciente,
  sembrarPlan,
} from './apoyo';
import { mensajeCobro } from '../src/lib/cobranza';

/**
 * Cobranza a mano, que es la única que hay en esta versión.
 *
 * La aplicación no manda ningún mensaje: abre WhatsApp con el texto escrito y
 * registra que la doctora lo dio por enviado. Lo que se prueba es esa frontera
 * — que el registro exista y que el texto no lleve nada que no deba viajar por
 * una URL.
 */

test.describe('Recordatorios de cobro', () => {
  let nombre: string;
  let pacienteId: string;

  test.beforeEach(async () => {
    nombre = nombreDePrueba('cobro');
    pacienteId = await sembrarPaciente({ nombre, telefono: '3312345678' });
    // Plan de enero: a día de hoy, sus tres mensualidades están vencidas.
    await sembrarPlan({ pacienteId, inicio: '2026-01-01' });
  });

  test.afterEach(async () => {
    await limpiar(nombre);
  });

  test('se anota el recordatorio y queda a la vista para no repetirlo', async ({ page }) => {
    await entrarAlPanel(page, '/admin/pagos');

    const fila = page.locator('tr', { hasText: nombre }).first();
    await expect(fila).toBeVisible();

    // El enlace de WhatsApp existe, pero no se pulsa: abre otra aplicación.
    await expect(fila.getByRole('link', { name: 'WhatsApp' })).toBeVisible();

    await fila.getByRole('button', { name: 'Marcar enviado' }).click();
    await page.waitForURL('**/admin/pagos**');

    const registrados = await recordatoriosDePaciente(pacienteId);
    expect(registrados).toHaveLength(1);
    expect(registrados[0]!.tipo).toBe('whatsapp');

    // Y se ve cuándo fue: es lo que evita cobrar dos veces el mismo día. El
    // botón desaparece de esa fila hasta mañana por lo mismo.
    const tras = page.locator('tr', { hasText: nombre }).first();
    await expect(tras).toContainText('Recordado hoy');
    await expect(tras.getByRole('button', { name: 'Marcar enviado' })).toHaveCount(0);
  });

  test('el mensaje de cobro no lleva tratamiento ni diagnóstico', () => {
    const texto = mensajeCobro({
      nombre: 'Ana Gómez',
      numero: 2,
      restante: '4000.00',
      venceEl: '2026-02-05',
      vencida: true,
    });

    expect(texto).toContain('Ana');
    expect(texto).toContain('mensualidad 2');
    expect(texto).toContain('venció');
    // Viaja dentro de una URL: historial del navegador, registros intermedios y
    // servidores de Meta. Nada clínico entra ahí.
    expect(texto.toLowerCase()).not.toContain('bracket');
    expect(texto.toLowerCase()).not.toContain('tratamiento');
  });
});
