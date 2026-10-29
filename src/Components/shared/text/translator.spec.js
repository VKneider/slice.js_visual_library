import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// The library's built-in texts are defaults at the translator's lowest layer.
// The app in this repo ships without a translator, so each test intercepts the
// config and the locale files before the harness boots: that is the only way to
// exercise the Spanish layer and the locale-change repaint against the real
// components.

const TRANSLATOR = {
   enabled: true,
   defaultLocale: 'en',
   fallbackLocale: 'en',
   locales: ['en', 'es'],
   path: '/locales',
};

const switchTo = (page, locale) => page.evaluate((value) => window.slice.translator.setLocale(value), locale);

test.beforeEach(async ({ page }) => {
   await page.route('**/sliceConfig.json', async (route) => {
      const response = await route.fetch();
      const config = await response.json();
      config.translator = TRANSLATOR;
      await route.fulfill({ response, json: config });
   });
   await page.route('**/locales/*.json', (route) => route.fulfill({ json: {} }));
});

test('Pagination: Spanish defaults, English first, and the texts prop wins', async ({ mount, page }) => {
   const c = await mount('Pagination', {
      totalPages: 5,
      totalItems: 100,
      pageSize: 10,
      showLabels: true,
      showInfo: true,
   });
   await expect(c.component).toBeAttached();
   await expect(c.locator('.slice-pagination__item--edge').first()).toContainText('Previous');
   await expect(c.locator('.slice-pagination')).toHaveAttribute('aria-label', 'Pagination');

   await switchTo(page, 'es');
   await expect(c.locator('.slice-pagination__item--edge').first()).toContainText('Anterior');
   await expect(c.locator('.slice-pagination')).toHaveAttribute('aria-label', 'Paginación');
   await expect(c.locator('.slice-pagination__info')).toContainText('de 100');

   const custom = await mount('Pagination', {
      totalPages: 5,
      showLabels: true,
      texts: { previous: 'Volver', label: 'Páginas' },
   });
   await switchTo(page, 'es');
   await expect(custom.locator('.slice-pagination__item--edge').first()).toContainText('Volver');
   await expect(custom.locator('.slice-pagination')).toHaveAttribute('aria-label', 'Páginas');
   expect(c.pageErrors()).toEqual([]);
});

test('Modal: the close button name follows the locale', async ({ mount, page }) => {
   const c = await mount('Modal', { title: 'Delete', open: true });
   const close = c.locator('.slice-modal__close');
   await expect(close).toHaveAttribute('aria-label', 'Close');

   await switchTo(page, 'es');
   await expect(close).toHaveAttribute('aria-label', 'Cerrar');
   expect(c.pageErrors()).toEqual([]);
});

test('Form: the actions and step labels repaint on a locale change', async ({ mount, page }) => {
   const c = await mount('Form', {
      schema: [{ name: 'email', component: 'Input', props: { label: 'Email' } }],
   });
   const submit = c.component.getByRole('button', { name: 'Submit' });
   await expect(submit).toHaveText('Submit');

   await switchTo(page, 'es');
   await expect(c.component.getByRole('button', { name: 'Enviar' })).toHaveText('Enviar');
   expect(c.pageErrors()).toEqual([]);
});

test('Table: the toolbar repaints on a locale change, and labels still win', async ({ mount, page }) => {
   const c = await mount('Table', {
      columns: [{ key: 'name', label: 'Name' }],
      rows: [{ id: 1, name: 'Ana' }],
      rowKey: 'id',
      searchable: true,
   });
   const search = c.locator('input[placeholder]').first();
   await expect(search).toHaveAttribute('placeholder', /Search/);

   await switchTo(page, 'es');
   await expect(search).toHaveAttribute('placeholder', /Buscar/);

   const custom = await mount('Table', {
      columns: [{ key: 'name', label: 'Name' }],
      rows: [{ id: 1, name: 'Ana' }],
      rowKey: 'id',
      searchable: true,
      labels: { searchPlaceholder: 'Filtrar aquí' },
   });
   await switchTo(page, 'es');
   await expect(custom.locator('input[placeholder]').first()).toHaveAttribute('placeholder', 'Filtrar aquí');
   expect(c.pageErrors()).toEqual([]);
});

test('Select: the empty state and the clear label follow the locale', async ({ mount, page }) => {
   const c = await mount('Select', { options: [], label: 'Pick one' });
   await switchTo(page, 'es');
   await expect(c.locator('.slice_select_clear')).toHaveAttribute('aria-label', 'Borrar selección');
   expect(c.pageErrors()).toEqual([]);
});
