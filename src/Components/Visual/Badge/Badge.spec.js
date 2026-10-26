import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const TONES = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];
const body = (c) => c.locator('.slice-badge__body');

test.describe('Badge', () => {
   test('smoke: a label in a soft neutral pill', async ({ mount }) => {
      const c = await mount('Badge', { label: 'New' });
      expect(c.pageErrors()).toEqual([]);
      await expect(c.component).toHaveClass(/slice-badge/);
      await expect(c.component).toHaveAttribute('data-tone', 'neutral');
      await expect(c.component).toHaveAttribute('data-variant', 'soft');
      await expect(c.locator('.slice-badge__text')).toHaveText('New');
   });

   test('tone is the meaning, variant the loudness; unknown values fall back', async ({ mount }) => {
      const c = await mount('Badge', { label: 'Paid', tone: 'success', variant: 'filled' });
      await expect(c.component).toHaveAttribute('data-tone', 'success');
      await expect(c.component).toHaveAttribute('data-variant', 'filled');
      await c.component.evaluate((el) => { el.tone = 'nope'; el.variant = 'nope'; });
      await expect(c.component).toHaveAttribute('data-tone', 'neutral');
      await expect(c.component).toHaveAttribute('data-variant', 'soft');
   });

   test('the old variant names still work, as tones, with one note in the log', async ({ mount, page }) => {
      const result = await page.evaluate(async () => {
         const seen = [];
         const listener = slice.logger.onLog((log) => seen.push(String(log.message)));
         const badge = await slice.build('Badge', { label: 'Down', variant: 'danger' });
         slice.logger.offLog?.(listener);
         const out = { tone: badge.tone, variant: badge.variant, noted: seen.some((m) => m.includes("tone: 'danger'")) };
         slice.controller.destroyComponent(badge);
         return out;
      });
      expect(result).toEqual({ tone: 'danger', variant: 'soft', noted: true });
   });

   test('a count: value wins over label, is capped by max, and 0 hides unless showZero', async ({ mount }) => {
      const c = await mount('Badge', { label: 'ignored', value: 7, tone: 'danger' });
      await expect(c.locator('.slice-badge__text')).toHaveText('7');
      await expect(c.component).toHaveClass(/is-count/);
      await c.component.evaluate((el) => { el.value = 1200; });
      await expect(c.locator('.slice-badge__text')).toHaveText('99+');
      await c.component.evaluate((el) => { el.max = 500; });
      await expect(c.locator('.slice-badge__text')).toHaveText('500+');
      await c.component.evaluate((el) => { el.value = 0; });
      await expect(c.component).toBeHidden();
      await c.component.evaluate((el) => { el.showZero = true; });
      await expect(c.locator('.slice-badge__text')).toHaveText('0');
   });

   test('nothing to show: hidden', async ({ mount }) => {
      const c = await mount('Badge', { label: '' });
      await expect(c.component).toBeHidden();
   });

   test('indicator: a dot before the text; pulse makes it breathe', async ({ mount }) => {
      const c = await mount('Badge', { label: 'Online', tone: 'success', indicator: true, pulse: true });
      await expect(c.locator('.slice-badge__indicator')).toBeVisible();
      await expect(c.component).toHaveClass(/is-pulsing/);
      const name = await c.locator('.slice-badge__indicator').evaluate((el) => getComputedStyle(el).animationName);
      expect(name).toBe('slice-badge-pulse');
   });

   test('dot: only a dot, named by its label', async ({ mount }) => {
      const c = await mount('Badge', { dot: true, label: 'Unread messages', tone: 'accent' });
      await expect(c.component).toHaveClass(/is-dot/);
      await expect(c.locator('.slice-badge__text')).toBeHidden();
      await expect(body(c)).toHaveAttribute('role', 'img');
      await expect(body(c)).toHaveAttribute('aria-label', 'Unread messages');
      const box = await body(c).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(10);
   });

   test('icon: an Icon before the text, destroyed with the badge', async ({ mount, page }) => {
      const c = await mount('Badge', { label: 'Verified', icon: 'check', tone: 'success' });
      await expect(c.locator('.slice-badge__icon slice-icon')).toHaveCount(1);
      const id = await c.locator('slice-icon').evaluate((el) => el.sliceId);
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      expect(await page.evaluate((i) => !!slice.controller.getComponent(i), id)).toBe(false);
   });

   test('color: a colour of your own instead of a tone', async ({ mount }) => {
      const c = await mount('Badge', { label: 'Design', color: 'rgb(219, 39, 119)' });
      await expect(c.component).toHaveClass(/has-color/);
      const bg = await body(c).evaluate((el) => getComputedStyle(el).backgroundColor);
      // A tint of the colour: its red channel dominates.
      const [r, g] = (bg.match(/[\d.]+/g) || []).map(Number);
      expect(bg.startsWith('color(') ? r * 255 : r).toBeGreaterThan(bg.startsWith('color(') ? g * 255 : g);
   });

   test('sizes are legible: 20, 24 and 30px tall', async ({ mount }) => {
      const c = await mount('Badge', { label: 'Size' });
      const heights = {};
      for (const size of ['sm', 'md', 'lg']) {
         heights[size] = await c.component.evaluate((el, s) => { el.size = s; return Math.round(el.querySelector('.slice-badge__body').getBoundingClientRect().height); }, size);
      }
      expect(heights).toEqual({ sm: 20, md: 24, lg: 30 });
      const font = await c.component.evaluate((el) => { el.size = 'md'; return parseFloat(getComputedStyle(el.querySelector('.slice-badge__body')).fontSize); });
      expect(font).toBeGreaterThanOrEqual(12);
   });

   test('shape: rounded for labels that are not states', async ({ mount }) => {
      const c = await mount('Badge', { label: 'v3.4', shape: 'rounded' });
      const radius = await body(c).evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
      expect(radius).toBeLessThan(10);
   });
});

// ── Legibility, measured ───────────────────────────────────────────────────
// Every tone, in every variant, in both themes, clears WCAG AA (4.5:1) for its
// text against what is really behind it (its own tint, its fill, or the page).

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
      const page = rgba(getComputedStyle(document.body).backgroundColor).slice(0, 3);
      const stage = document.createElement('div');
      stage.style.cssText = 'position:fixed;inset:0;padding:16px;z-index:99999';
      document.body.appendChild(stage);
      const out = {};
      for (const tone of tones) {
         const badge = await slice.build('Badge', { label: 'Texto', tone, variant: v });
         stage.appendChild(badge);
         await new Promise((r) => setTimeout(r, 80));
         const cs = getComputedStyle(badge.querySelector('.slice-badge__body'));
         const fg = rgba(cs.color).slice(0, 3);
         const bg = rgba(cs.backgroundColor);
         out[tone] = Math.round(ratio(fg, over(bg.slice(0, 3), page, bg[3])) * 100) / 100;
         slice.controller.destroyComponent(badge);
         badge.remove();
      }
      stage.remove();
      return out;
   }, [theme, variant, TONES]);
}

test.describe('Badge - legibility in every theme', () => {
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

// ── Optical alignment ──────────────────────────────────────────────────────
// A badge in a line of text sits on the text's optical centre, at any size.

test.describe('Badge - optical alignment', () => {
   test('the pill is centred on the text it sits beside', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const offsets = await h.page.evaluate(async () => {
         const out = {};
         for (const [size, badgeSize] of [[13, 'sm'], [15, 'md'], [19, 'lg']]) {
            const line = document.createElement('div');
            line.style.cssText = `font-size:${size}px;padding:12px 16px;font-family:system-ui,sans-serif`;
            line.textContent = 'Notificaciones ';
            const badge = await slice.build('Badge', { value: 12, size: badgeSize, tone: 'danger' });
            line.appendChild(badge);
            line.append(' pendientes');
            document.body.appendChild(line);
            await new Promise((r) => setTimeout(r, 200));
            const pill = badge.querySelector('.slice-badge__body').getBoundingClientRect();
            const range = document.createRange();
            range.setStart(line.firstChild, 0);
            range.setEnd(line.firstChild, line.firstChild.length);
            const text = range.getBoundingClientRect();
            out[size] = Math.round(((pill.top + pill.bottom) / 2 - (text.top + text.bottom) / 2) * 100) / 100;
            line.remove();
         }
         return out;
      });
      for (const [size, offset] of Object.entries(offsets)) {
         expect(Math.abs(offset), `offset at ${size}px text`).toBeLessThanOrEqual(1);
      }
   });
});