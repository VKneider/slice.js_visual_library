import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

test.describe('Badge', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Badge', { label: 'New' });
      await expect(c.locator('.slice_badge')).toBeVisible();
      await expect(c.locator('.slice_badge__text')).toHaveText('New');
      expect(c.pageErrors()).toEqual([]);
   });

   test('variant applies its modifier and an unknown one falls back to neutral', async ({ mount }) => {
      const c = await mount('Badge', { label: 'Live', variant: 'success' });
      await expect(c.locator('.slice_badge')).toHaveClass(/slice_badge--success/);

      await c.component.evaluate((el) => { el.variant = 'not-a-variant'; });
      await expect(c.locator('.slice_badge')).toHaveClass(/slice_badge--neutral/);
      await expect(c.locator('.slice_badge')).not.toHaveClass(/slice_badge--success/);
   });

   test('a variant change never leaves a stale modifier class', async ({ mount }) => {
      const c = await mount('Badge', { label: 'X', variant: 'danger' });
      const cls = await c.locator('.slice_badge').getAttribute('class');
      expect(cls.match(/slice_badge--(neutral|accent|success|warning|danger|info)/g)).toHaveLength(1);
   });

   test('each variant derives from its theme token, not a fixed colour', async ({ mount }) => {
      const c = await mount('Badge', { label: '3', variant: 'danger' });
      const tokens = await c.component.evaluate((el) => {
         const badge = el.querySelector('.slice_badge');
         const probe = document.createElement('span');
         document.body.appendChild(probe);
         probe.style.color = 'var(--danger-color)';
         const danger = getComputedStyle(probe).color;
         probe.style.color = 'var(--danger-contrast)';
         const contrast = getComputedStyle(probe).color;
         probe.remove();
         const cs = getComputedStyle(badge);
         return { bg: cs.backgroundColor, fg: cs.color, danger, contrast };
      });

      // The CONTRACT is that both come from the theme token, so a retheme
      // carries the badge with it. It used to be asserted as "bg === danger"
      // exactly, which is no longer the mechanism: the treatment is a tint,
      // because a solid fill with --danger-contrast measured 4.83:1 and three
      // other variants failed AA outright.
      //
      // So the token's channels must be present in both, and the foreground
      // must come from the token rather than the raw contrast colour.
      const norm = (css) => (css.match(/[\d.]+/g) || []).map(Number);
      const [dr, dg, db] = norm(tokens.danger);

      // getComputedStyle resolves color-mix() to color(srgb r g b / a) with
      // 0..1 channels and to rgb() with 0..255. Normalise before comparing, or
      // the check passes or fails for the wrong reason.
      const channels = (css) => {
         const n = norm(css);
         return css.startsWith('color(') ? [n[0] * 255, n[1] * 255, n[2] * 255] : n.slice(0, 3);
      };
      const near = (a, b) => Math.abs(a - b) < 6;

      const [bgR, bgG, bgB] = channels(tokens.bg);
      const [fgR, fgG, fgB] = channels(tokens.fg);

      // The wash keeps the token's channels; the text is a DARKER shade of it.
      // Comparing the text's channels to the token was wrong — shading is the
      // point — so the text is checked by hue instead: same colour, less light.
      const hue = ([r, g, b]) => {
         const max = Math.max(r, g, b);
         const min = Math.min(r, g, b);
         if (max === min) return 0;
         const d = max - min;
         if (max === r) return ((g - b) / d + 6) % 6;
         if (max === g) return (b - r) / d + 2;
         return (r - g) / d + 4;
      };
      const light = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

      expect(near(bgR, dr) && near(bgG, dg) && near(bgB, db), `bg ${tokens.bg} derives from ${tokens.danger}`).toBe(true);
      expect(
         Math.abs(hue([fgR, fgG, fgB]) - hue([dr, dg, db])) < 0.15,
         `fg ${tokens.fg} keeps the hue of ${tokens.danger}`
      ).toBe(true);
      expect(light([fgR, fgG, fgB]), 'fg is a darker shade than the token').toBeLessThan(light([dr, dg, db]));
      expect(tokens.fg).not.toBe(tokens.contrast);
   });

   test('value wins over label and is capped by max', async ({ mount }) => {
      const c = await mount('Badge', { label: 'ignored', value: 7 });
      await expect(c.locator('.slice_badge__text')).toHaveText('7');

      await c.component.evaluate((el) => { el.value = 1200; });
      await expect(c.locator('.slice_badge__text')).toHaveText('99+');

      await c.component.evaluate((el) => { el.max = 500; });
      await expect(c.locator('.slice_badge__text')).toHaveText('500+');
   });

   test('an empty badge hides itself', async ({ mount }) => {
      const c = await mount('Badge', { label: '' });
      await expect(c.locator('.slice_badge')).toBeHidden();
   });

   test('dot renders a circle with an accessible name but no text', async ({ mount }) => {
      const c = await mount('Badge', { dot: true, label: 'Unread messages' });
      const badge = c.locator('.slice_badge');
      await expect(badge).toHaveClass(/slice_badge--dot/);
      await expect(c.locator('.slice_badge__text')).toBeHidden();
      // Nothing is painted, so the name has to come from aria-label.
      await expect(badge).toHaveAttribute('aria-label', 'Unread messages');
   });

   test('size switches the modifier', async ({ mount }) => {
      const c = await mount('Badge', { label: '1', size: 'sm' });
      await expect(c.locator('.slice_badge')).toHaveClass(/slice_badge--sm/);
   });

   test('visual: badge row @visual', async ({ mount }) => {
      const c = await mount('Badge', { label: 'New', variant: 'accent' });
      await expect(c.component).toHaveScreenshot('badge-accent.png');
   });

// ── measured legibility ────────────────────────────────────────────────────
//
// The solid-fill treatment failed WCAG AA on three of six variants — success
// 3.77, info 3.68, warning 3.19, all under the 4.5:1 bar for 12px text — while
// the one variant that passed looked like an unstyled chip. Nothing in the
// existing specs could see that: they assert classes, props and text, and a
// badge that paints itself illegibly satisfies all of them.

const VARIANTS = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];

test.describe('Badge - legibility', () => {
   /**
    * Composites the badge's text over its own tint over the page.
    *
    * getComputedStyle resolves color-mix() to `color(srgb 0.5 0.2 0.9 / 0.3)`,
    * whose channels are 0..1 — reading them as 0..255 once made a light purple
    * bar come back as near-black and report a nonsense 1.19:1.
    */
   async function contrastOf(h, variant) {
      return h.page.evaluate(async (v) => {
         const rgba = (css) => {
            const n = (css.match(/[\d.]+/g) || []).map(Number);
            if (css.startsWith('color(')) return [n[0] * 255, n[1] * 255, n[2] * 255, n[3] ?? 1];
            return [n[0], n[1], n[2], n[3] ?? 1];
         };
         const over = (fg, bg, a) => fg.map((c, i) => c * a + bg[i] * (1 - a));
         const lin = (c) => {
            const s = c / 255;
            return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
         };
         const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
         const ratio = (a, b) => {
            const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
            return (hi + 0.05) / (lo + 0.05);
         };

         const page = [246, 245, 251];
         const stage = document.createElement('div');
         stage.style.cssText = 'position:fixed;inset:0;background:#f6f5fb;z-index:99999';
         document.body.appendChild(stage);

         const badge = await slice.build('Badge', { label: 'Texto', variant: v });
         stage.appendChild(badge);
         await new Promise((r) => setTimeout(r, 250));

         const el = badge.querySelector('.slice_badge');
         const cs = getComputedStyle(el);
         const fg = rgba(cs.color).slice(0, 3);
         const bg = rgba(cs.backgroundColor);
         const tint = over(bg.slice(0, 3), page, bg[3]);

         stage.remove();
         return Math.round(ratio(fg, tint) * 100) / 100;
      }, variant);
   }

   for (const variant of VARIANTS) {
      test(`${variant} clears WCAG AA on its own tint`, async ({ mountHtml }) => {
         const h = await mountHtml(`<div></div>`);
         const ratio = await contrastOf(h, variant);

         // 12px at weight 700 is normal text, so 4.5 is the honest bar rather
         // than the 3.0 that large-text rules would allow.
         expect(ratio, `${variant} contrast`).toBeGreaterThanOrEqual(4.5);
      });
   }

   test('the declared height is the height it measures', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const measured = await h.page.evaluate(async () => {
         const stage = document.createElement('div');
         document.body.appendChild(stage);
         const out = {};
         for (const size of ['sm', 'md']) {
            const b = await slice.build('Badge', { label: '8', size });
            stage.appendChild(b);
            await new Promise((r) => setTimeout(r, 200));
            out[size] = b.querySelector('.slice_badge').getBoundingClientRect().height;
         }
         return out;
      });

      // 1.5em of a 0.75rem font is 18px. With content-box sizing the 1px border
      // was added on top and the badge measured 20px for a declared 18px.
      expect(Math.round(measured.md * 10) / 10).toBe(18);
      // 1.25em of 0.65rem is 13px. It measured 15 before border-box added the
      // two 1px borders on top of the declared height.
      expect(Math.round(measured.sm * 10) / 10).toBe(13);
   });

   test('a dot is big enough to see', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const box = await h.page.evaluate(async () => {
         const b = await slice.build('Badge', { dot: true, label: 'Nuevo' });
         document.body.appendChild(b);
         await new Promise((r) => setTimeout(r, 250));
         const r = b.querySelector('.slice_badge').getBoundingClientRect();
         return { w: r.width, h: r.height };
      });

      // 0.6em measured 9.2px, which reads as dust. Fixed px, so it does not
      // shrink further at the `sm` size.
      expect(box.w).toBeGreaterThanOrEqual(10);
      expect(box.h).toBeGreaterThanOrEqual(10);
   });
});
// ── optical alignment ──────────────────────────────────────────────────────
//
// `vertical-align: middle` put the pill's centre 2.25px below the text's, and
// the gap GREW with the text size — 2.25px at 15px, 3.25px at 19px — which is
// what aligning to the baseline plus half the PARENT's x-height does, rather
// than to the text's own optical centre. The kind of thing that reads as "this
// badge looks slightly off" with no one able to say why.

test.describe('Badge - optical alignment', () => {
   test('the pill is centred on the text it sits beside', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const offsets = await h.page.evaluate(async () => {
         const style = document.createElement('style');
         style.textContent = 'body{background:#fff;margin:0;font-family:system-ui,sans-serif}';
         document.head.appendChild(style);

         const out = {};
         for (const size of [13, 15, 19]) {
            const line = document.createElement('div');
            line.style.cssText = `font-size:${size}px;color:#1a0b2e;padding:12px 16px`;
            line.textContent = 'Notificaciones ';

            const badge = await slice.build('Badge', { value: 1200, size: size === 13 ? 'sm' : 'md' });
            line.appendChild(badge);
            line.append(' pendientes');
            document.body.appendChild(line);
            await new Promise((r) => setTimeout(r, 300));

            const pill = badge.querySelector('.slice_badge').getBoundingClientRect();

            // The inline box of the text run, which is what the eye aligns to.
            const range = document.createRange();
            range.setStart(line.firstChild, 0);
            range.setEnd(line.firstChild, line.firstChild.length);
            const text = range.getBoundingClientRect();

            out[size] = {
               offset: Math.round(((pill.top + pill.bottom) / 2 - (text.top + text.bottom) / 2) * 100) / 100,
            };
            line.remove();
         }
         return out;
      });

      for (const [size, { offset }] of Object.entries(offsets)) {
         // Half a pixel, because that is below what a rendering shows.
         expect(Math.abs(offset), `offset at ${size}px text`).toBeLessThanOrEqual(0.5);
      }
   });

   test('tabular-nums is deliberately NOT applied', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const widths = await h.page.evaluate(async () => {
         const stage = document.createElement('div');
         document.body.appendChild(stage);

         const read = async (tabular) => {
            const el = document.createElement('span');
            el.className = 'slice_badge';
            el.style.cssText =
               'display:inline-flex;align-items:center;justify-content:center;' +
               'height:18px;min-width:18px;padding:0 0.45em;border-radius:999px;' +
               'font:700 12px system-ui;font-family:system-ui,sans-serif;' +
               'border:1px solid transparent;box-sizing:border-box' +
               (tabular ? ';font-variant-numeric: tabular-nums;' : ';');
            stage.appendChild(el);
            await new Promise((r) => setTimeout(r, 120));

            const out = {};
            for (const n of ['1', '8', '11', '88', '99+', '1200']) {
               el.textContent = n;
               await new Promise((r) => setTimeout(r, 60));
               out[n] = Math.round(el.getBoundingClientRect().width * 10) / 10;
            }
            el.remove();
            return out;
         };

         return { off: await read(false), on: await read(true) };
      });

      // The rule says add tabular-nums to any changing number. Measured, it is
      // a NO-OP here: the system font already ships tabular figures, so every
      // width is identical with and without. Pinned so the next person does not
      // add a declaration that does nothing.
      expect(widths.on).toEqual(widths.off);
   });
});
// ── legibility in BOTH themes ─────────────────────────────────────────────
//
// The first version of this spec only ever ran in LIGHT, and passed there. In
// DARK, five of six variants measured 3.00-4.05:1: the text was darkened toward
// black — a light-mode tuning — while DARK.css ships status colours that are
// already light, so darkening them produced a mid-tone on a dark surface.
//
// A contrast spec that runs in one theme is a spec that certifies the wrong
// thing. This one runs in both, so a palette change has nowhere to hide.

const BOTH = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];

async function contrastOf(h, variant, theme) {
   return h.page.evaluate(
      async ([v, t]) => {
         await slice.setTheme(t);
         await new Promise((r) => setTimeout(r, 800));

         const rgba = (css) => {
            const n = (css.match(/[\d.]+/g) || []).map(Number);
            if (css.startsWith('color(')) return [n[0] * 255, n[1] * 255, n[2] * 255, n[3] ?? 1];
            return [n[0], n[1], n[2], n[3] ?? 1];
         };
         const over = (fg, bg, a) => fg.map((c, i) => c * a + bg[i] * (1 - a));
         const lin = (c) => {
            const s = c / 255;
            return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
         };
         const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
         const ratio = (a, b) => {
            const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
            return (hi + 0.05) / (lo + 0.05);
         };

         // The page colour is READ, not assumed: in dark mode the harness body
         // is not the light lavender the light-mode spec measured against.
         const page = rgba(getComputedStyle(document.body).backgroundColor).slice(0, 3);

         const stage = document.createElement('div');
         stage.style.cssText = 'position:fixed;inset:0;padding:16px;z-index:99999';
         document.body.appendChild(stage);

         const badge = await slice.build('Badge', { label: 'Texto', variant: v });
         stage.appendChild(badge);
         await new Promise((r) => setTimeout(r, 250));

         const el = badge.querySelector('.slice_badge');
         const cs = getComputedStyle(el);
         const fg = rgba(cs.color).slice(0, 3);
         const bg = rgba(cs.backgroundColor);
         const tint = over(bg.slice(0, 3), page, bg[3]);

         stage.remove();
         return Math.round(ratio(fg, tint) * 100) / 100;
      },
      [variant, theme]
   );
}

test.describe('Badge - legibility in every theme', () => {
   for (const theme of ['LIGHT', 'DARK']) {
      for (const variant of BOTH) {
         test(`${variant} clears AA in ${theme}`, async ({ mountHtml }) => {
            const h = await mountHtml(`<div></div>`);
            const ratio = await contrastOf(h, variant, theme);

            // 12px at weight 700 is normal text, so 4.5 is the honest bar.
            expect(ratio, `${variant} in ${theme}`).toBeGreaterThanOrEqual(4.5);
         });
      }
   }
});});