import { expect, test } from '@playwright/test';
import {
  clienteAdmin,
  enviarFormulario,
  esperarFormularioListo,
  limpiar,
  nombreDePrueba,
} from './apoyo';

test.describe('Formulario público', () => {
  test('no pide correo ni publica ninguna dirección', async ({ page }) => {
    await page.goto('/');

    const formulario = page.locator('#contacto');
    await expect(formulario.getByLabel('Nombre completo')).toBeVisible();
    await expect(formulario.getByLabel('Teléfono')).toBeVisible();
    await expect(formulario.getByLabel('¿Qué te interesa?')).toBeVisible();

    // El consultorio no lee correo: pedirlo sería guardar un dato sin finalidad.
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
    await expect(page.locator('input[name="email"]')).toHaveCount(0);

    // Y no se publica ninguna dirección, ni en contacto ni en el pie.
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  });

  test('una solicitud enviada llega a la base de datos', async ({ page }) => {
    const nombre = nombreDePrueba('formulario');
    const mensaje = 'Pregunto por horarios de sábado.';

    await enviarFormulario(page, {
      nombre,
      telefono: '33 2244 6688',
      tratamiento: 'Brackets estéticos',
      mensaje,
    });

    // La paciente ve la confirmación…
    await expect(page.getByText('¡Solicitud enviada!')).toBeVisible();

    // …y la fila existe de verdad, con los valores que escribió.
    const { data, error } = await clienteAdmin()
      .from('solicitudes')
      .select('nombre, telefono, tratamiento, mensaje, estado, aviso_version')
      .eq('nombre', nombre)
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      nombre,
      telefono: '33 2244 6688',
      tratamiento: 'Brackets estéticos',
      mensaje,
      // Toda solicitud nace sin atender: es lo que hace útil el contador del panel.
      estado: 'nueva',
    });
    // Se guarda qué versión del aviso aceptó, para poder acreditarlo (LFPDPPP art. 8).
    expect(data?.aviso_version).toBeTruthy();

    await limpiar(nombre);
  });

  test('un envío incompleto no escribe nada', async ({ page }) => {
    await page.goto('/#contacto');
    await esperarFormularioListo(page);
    // Con nombre pero sin teléfono ni consentimiento: la validación debe frenarlo.
    await page.getByLabel('Nombre completo').fill(nombreDePrueba('incompleto'));
    await page.getByRole('button', { name: 'Solicitar valoración' }).click();

    await expect(page.getByText('¡Solicitud enviada!')).toHaveCount(0);
    await expect(page.getByText('Ingresa un teléfono válido.')).toBeVisible();

    const { count } = await clienteAdmin()
      .from('solicitudes')
      .select('id', { count: 'exact', head: true })
      .like('nombre', 'E2E incompleto%');
    expect(count).toBe(0);
  });

  test('el honeypot descarta bots sin escribir en la base', async ({ page, request }) => {
    const nombre = nombreDePrueba('bot');
    const respuesta = await request.post('/api/contact', {
      data: {
        nombre,
        telefono: '3300000000',
        tratamiento: 'Alineadores invisibles',
        mensaje: '',
        consentimiento: true,
        empresa: 'relleno de bot',
      },
    });

    // 200 a propósito: un 4xx le diría al bot que hay un honeypot.
    expect(respuesta.status()).toBe(200);

    const { count } = await clienteAdmin()
      .from('solicitudes')
      .select('id', { count: 'exact', head: true })
      .eq('nombre', nombre);
    expect(count).toBe(0);
  });
});
