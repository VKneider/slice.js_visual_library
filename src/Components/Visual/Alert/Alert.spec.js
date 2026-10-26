import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const TONES = ['neutral', 'info', 'success', 'warning', 'danger'];
const box = (c) => c.locator('.slice-alert__box');

// Actions and onDismiss carry functions, which cannot cross into the page as
// props: these tests set them inside the page and record what happens on the
// element's dataset.
const record = (c, more = {}) => c.component.evaluate((el, extra) => {
   el.dataset.log = '';
   const log = (entry) => { el.dataset.log += `${entry};`; };
   el.onDismiss = ({ reason }) => log(`dismiss:${reason}`);
   if (extra.actions) {
      el.actions = extra.actions.map((a) => ({ ...a, onClick: () => log(`action:${a.label}`) }));
   }
}, more);
const log = (c) => c.component.evaluate((el) => el.dataset.log);

test.describe('Alert', () => {
   test('smoke: a message in a soft info box, with the tone icon', async ({ mount }) => {
      const c = await mount('Alert', { message: 'Changes saved' });
      expect(c.pageErrors()).toEqual([]);
      await expect(c.component).toHaveClass(/slice-alert/);
      await expect(c.component).toHaveAttribute('data-tone', 'info');
      await expect(c.component).toHaveAttribute('data-variant', 'soft');
      await expect(c.locator('.slice-alert__message')).toHaveText('Changes saved');
      await expect(c.locator('.slice-alert__title')).toBeHidden();
      await expect(c.locator('.slice-alert__icon slice-icon')).toHaveCount(1);
      await expect(box(c)).toHaveAttribute('role', 'status');
   });

   test('a problem interrupts: warning and danger are role=alert, assertive', async ({ mount }) => {
      const c = await mount('Alert', { tone: 'danger', title: 'Payment failed', message: 'The card was declined.' });
      await expect(box(c)).toHaveAttribute('role', 'alert');
      await expect(box(c)).toHaveAttribute('aria-live', 'assertive');
      await expect(c.locator('.slice-alert__title')).toHaveText('Payment failed');
      await c.component.evaluate((el) => { el.tone = 'success'; });
      await expect(box(c)).toHaveAttribute('role', 'status');
   });

   test('icon: the tone gives one, a name replaces it, false removes it; neutral has none', async ({ mount }) => {
      const c = await mount('Alert', { tone: 'neutral', message: 'Note' });
      await expect(c.locator('.slice-alert__icon')).toBeHidden();
      await c.component.evaluate((el) => { el.icon = 'bell'; });
      await expect(c.locator('.slice-alert__icon slice-icon')).toHaveCount(1);
      await c.component.evaluate((el) => { el.icon = false; });
      await expect(c.locator('.slice-alert__icon')).toBeHidden();
   });

   test('actions: a Button each; using one closes it with reason "action", unless keepOpen', async ({ mount }) => {
      const c = await mount('Alert', { message: '2 rows removed' });
      await record(c, { actions: [{ label: 'Undo' }] });
      await c.locator('button').filter({ hasText: 'Undo' }).click();
      await expect(c.component).toBeHidden();
      expect(await log(c)).toBe('action:Undo;dismiss:action;');

      await c.component.evaluate((el) => el.show());
      await record(c, { actions: [{ label: 'Details', keepOpen: true }] });
      await c.locator('button').filter({ hasText: 'Details' }).click();
      await expect(c.component).toBeVisible();
      expect(await log(c)).toBe('action:Details;');
   });

   test('dismissible: a ✕ that closes it with reason "close"', async ({ mount }) => {
      const c = await mount('Alert', { message: 'Hi', dismissible: true, dismissLabel: 'Cerrar' });
      await record(c);
      const close = c.locator('.slice-alert__close');
      await expect(close).toHaveAttribute('aria-label', 'Cerrar');
      await close.click();
      await expect(c.component).toBeHidden();
      expect(await log(c)).toBe('dismiss:close;');
   });

   test('timeout: closes by itself, but waits while the pointer is on it', async ({ mount, page }) => {
      const c = await mount('Alert', { message: 'Saved' });
      await record(c);
      await c.component.evaluate((el) => { el.timeout = 400; });
      await c.component.hover();
      await page.waitForTimeout(700);
      await expect(c.component).toBeVisible();
      await page.mouse.move(0, 0);
      await expect(c.component).toBeHidden({ timeout: 2000 });
      expect(await log(c)).toBe('dismiss:timeout;');
   });

   test('show(): new content, and an onDismiss for that showing only', async ({ mount }) => {
      const c = await mount('Alert', { open: false });
      await expect(c.component).toBeHidden();
      await record(c);
      await c.component.evaluate((el) => el.show({
         tone: 'danger', variant: 'filled', message: 'The change could not be saved.',
         onDismiss: ({ reason }) => { el.dataset.log += `once:${reason};`; },
      }));
      await expect(c.component).toBeVisible();
      await expect(c.component).toHaveAttribute('data-variant', 'filled');
      await expect(c.locator('.slice-alert__message')).toHaveText('The change could not be saved.');
      await c.component.evaluate((el) => el.hide());
      await c.component.evaluate((el) => { el.show(); el.hide('close'); });
      expect(await log(c)).toBe('once:api;dismiss:api;dismiss:close;');
   });

   test('destroying it destroys its icon and buttons', async ({ mount, page }) => {
      const c = await mount('Alert', { message: 'x', dismissible: true });
      await record(c, { actions: [{ label: 'Retry' }, { label: 'Help' }] });
      await expect(c.locator('slice-button')).toHaveCount(2);
      await page.waitForTimeout(150);
      const ids = await c.component.evaluate((el) => [...el.querySelectorAll('[slice-id]')].map((n) => n.getAttribute('slice-id')));
      expect(ids.length).toBeGreaterThanOrEqual(4);
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      expect(await page.evaluate((all) => all.filter((id) => !!slice.controller.getComponent(id)), ids)).toEqual([]);
   });
});

// ── Legibility, measured ───────────────────────────────────────────────────
// The title (the tone's readable shade) and the message, on what is really
// behind them, clear WCAG AA (4.5:1) for every tone, variant and theme.

async function contrasts(page, theme, variant) {
   return page.evaluate(async ([t, v, tones]) => {
      await slice.setTheme(t);
      await new Promise((r) => setTimeout(r, 800));
      const rgba = (css) => {
         const n = (css.match(/[\d.]+/g) || []).map(Number);
         if (css.startsWith('color(')) return [n[0] * 255, n[1] * 255, n[2] * 255, n[3] ?? 1];
         return [n[0], n[1], n[2], n[3] ?? 1];
      };
      const over = (fg, bg, a) => fg.map((c, i) => c * a + bg[i] * (1 - a));
      const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
      const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
      const pageBg = rgba(getComputedStyle(document.body).backgroundColor).slice(0, 3);
      const stage = document.createElement('div');
      stage.style.cssText = 'position:fixed;inset:0;padding:16px;z-index:99999';
      document.body.appendChild(stage);
      const out = {};
      for (const tone of tones) {
         const alert = await slice.build('Alert', { tone, variant: v, title: 'Title', message: 'Message' });
         stage.appendChild(alert);
         await new Promise((r) => setTimeout(r, 300));
         const bgRaw = rgba(getComputedStyle(alert.querySelector('.slice-alert__box')).backgroundColor);
         const bg = over(bgRaw.slice(0, 3), pageBg, bgRaw[3]);
         const title = rgba(getComputedStyle(alert.querySelector('.slice-alert__title')).color);
         const message = rgba(getComputedStyle(alert.querySelector('.slice-alert__message')).color);
         out[tone] = Math.min(ratio(over(title.slice(0, 3), bg, title[3]), bg), ratio(over(message.slice(0, 3), bg, message[3]), bg));
         slice.controller.destroyComponent(alert);
         alert.remove();
      }
      stage.remove();
      return out;
   }, [theme, variant, TONES]);
}

test.describe('Alert - legibility in every theme', () => {
   for (const theme of ['LIGHT', 'DARK']) {
      for (const variant of ['soft', 'filled', 'outlined']) {
         test(`${variant} clears AA in ${theme}`, async ({ mountHtml }) => {
            const h = await mountHtml('<div></div>');
            const ratios = await contrasts(h.page, theme, variant);
            for (const [tone, ratio] of Object.entries(ratios)) {
               expect(ratio, `${tone} ${variant} in ${theme}`).toBeGreaterThanOrEqual(4.5);
            }
         });
      }
   }
});