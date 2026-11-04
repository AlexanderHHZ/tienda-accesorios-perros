import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

const endpoint = 'http://127.0.0.1:4100/api/v1/empaquetados';
const input = {
  peso: 4.5,
  tamano: 'mediano',
  medidas: { largo: 40, ancho: 30, alto: 20 },
  tipoEmpacado: 'caja',
};

async function create(request: APIRequestContext, overrides: Record<string, unknown> = {}) {
  const response = await request.post(endpoint, { data: { ...input, ...overrides } });
  expect(response.status()).toBe(201);
  const body: { data: { id: number; updatedAt: string } } = await response.json();
  return body.data;
}

async function fillForm(page: Page) {
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Peso', { exact: true }).fill('4.5');
  await dialog.getByLabel('Largo', { exact: true }).fill('40');
  await dialog.getByLabel('Ancho', { exact: true }).fill('30');
  await dialog.getByLabel('Alto', { exact: true }).fill('20');
}

test.beforeEach(async ({ request }) => {
  const response = await request.get(`${endpoint}?limit=100`);
  const body: { data: { id: number }[] } = await response.json();
  for (const item of body.data)
    expect((await request.delete(`${endpoint}/${item.id}`)).status()).toBe(204);
});

test('crear, consultar, editar, cancelar y confirmar eliminación', async ({
  page,
  request,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('El orden empieza con el primer paquete')).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo empaquetado', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Introduce un valor mayor que 0.').first()).toBeVisible();
  await fillForm(page);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Empaquetado creado correctamente.')).toBeVisible();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const stored: { data: { id: number; peso: number }[] } = await (
    await request.get(endpoint)
  ).json();
  expect(stored.data).toHaveLength(1);
  expect(stored.data[0]?.peso).toBe(4.5);
  await page.getByRole('button', { name: /^Ver EMP-/ }).click();
  await expect(page.getByText('DIMENSIONES EXTERIORES')).toBeVisible();
  await page.getByRole('button', { name: 'Editar empaquetado', exact: true }).click();
  await page.getByLabel('Peso', { exact: true }).fill('6.25');
  await page.getByRole('dialog').getByText('Bolsa', { exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('formulario.png'), fullPage: true });
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Cambios guardados correctamente.')).toBeVisible();
  await expect(page.locator('#registros')).toContainText('6.25');
  await page.getByRole('button', { name: /^Eliminar EMP-/ }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Ver EMP-/ })).toBeVisible();
  await page.getByRole('button', { name: /^Eliminar EMP-/ }).click();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(page.getByText('Empaquetado eliminado correctamente.')).toBeVisible();
  await expect(page.getByText('El orden empieza con el primer paquete')).toBeVisible();
  expect(errors).toEqual([]);
});

test('búsqueda, filtros, ordenamiento y paginación reales', async ({ page, request }, testInfo) => {
  const first = await create(request, { peso: 1, tamano: 'chico' });
  for (let index = 2; index <= 12; index++)
    await create(request, { peso: index, tipoEmpacado: index % 2 ? 'caja' : 'bolsa' });
  await page.goto('/');
  await expect(page.getByText('1–10')).toBeVisible();
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByText('11–12')).toBeVisible();
  await page.getByLabel('Filtrar por tipo').selectOption('bolsa');
  await expect(page.getByText('1–6')).toBeVisible();
  await page.getByLabel('Ordenar empaquetados').selectOption('peso-asc');
  await expect(page.locator('#registros')).toContainText('2');
  await page.screenshot({ path: testInfo.outputPath('listado.png'), fullPage: true });
  await page.getByLabel('Filtrar por tipo').selectOption('');
  await page.getByLabel('Buscar empaquetados').fill(`EMP-${String(first.id).padStart(4, '0')}`);
  await expect(page.getByText('1–1')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
  await page.getByLabel('Filtrar por tamaño').selectOption('chico');
  await expect(page.getByText('1–1')).toBeVisible();
  await page.getByLabel('Buscar empaquetados').fill('sin-coincidencias');
  await expect(page.getByText('No encontramos coincidencias')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(page.getByText('1–10')).toBeVisible();
});

test('informa un conflicto y conserva el cambio del otro cliente', async ({ page, request }) => {
  const item = await create(request);
  await page.goto('/');
  await page.getByRole('button', { name: /^Editar EMP-/ }).click();
  const changed = await request.patch(`${endpoint}/${item.id}`, { data: { peso: 9 } });
  expect(changed.status()).toBe(200);
  await page.getByLabel('Peso', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('El registro cambió');
  const result: { data: { peso: number } } = await (
    await request.get(`${endpoint}/${item.id}`)
  ).json();
  expect(result.data.peso).toBe(9);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
});

test('muestra un error recuperable si la API no está disponible', async ({ page }) => {
  await page.route(`${endpoint}**`, (route) => route.abort('failed'));
  await page.goto('/');
  await expect(
    page.getByRole('region', { name: 'Registro de empaquetados' }).getByRole('alert'),
  ).toContainText('No pudimos conectar con la API');
  await page.unroute(`${endpoint}**`);
  await page.getByRole('button', { name: 'Volver a intentar' }).click();
  await expect(page.getByText('El orden empieza con el primer paquete')).toBeVisible();
});

test('sin desbordamiento horizontal en teléfono, tablet y escritorio', async ({
  page,
  request,
}) => {
  await create(request);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Ver EMP-/ })).toBeVisible();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole('button', { name: 'Nuevo empaquetado', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(
    await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      return Boolean(modal && modal.scrollWidth <= modal.clientWidth);
    }),
  ).toBe(true);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
});

test('diálogo accesible: teclado, Escape y devolución del foco', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.getByText('El orden empieza con el primer paquete')).toBeVisible();
  const opener = page.getByRole('button', { name: 'Nuevo empaquetado', exact: true });
  await opener.click();
  await expect(page.getByLabel('Peso', { exact: true })).toBeFocused();
  if (!isMobile) {
    for (let index = 0; index < 15; index++) {
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))),
      ).toBe(true);
    }
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(opener).toBeFocused();
});
