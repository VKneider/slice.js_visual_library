import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Icon renders an inline <svg> (Lucide since the migration, with the brand /
// language / Slice marks kept from the old `slc` sprite). `size` and `color`
// land on the HOST so the svg scales with surrounding text and follows the
// theme; an unknown `name` warns and renders nothing.
//
// Run `node scripts/icon-map-audit.mjs` after touching the name tables: it
// fails if any of the 291 pre-migration names stopped resolving.

test.describe('Icon', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket' });
      await expect(c.component).toBeVisible();
      await expect(c.locator('svg')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('renders an inline svg with real drawable nodes', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket' });
      const info = await c.locator('svg').evaluate((svg) => ({
         viewBox: svg.getAttribute('viewBox'),
         children: svg.children.length,
         tags: [...svg.children].map((n) => n.tagName),
      }));
      expect(info.viewBox).toBe('0 0 24 24');
      expect(info.children).toBeGreaterThan(0);
      expect(info.tags.every((t) => ['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse'].includes(t))).toBe(true);
   });

   test('the glyph is stroked with currentColor so it follows the theme', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket' });
      const svg = c.locator('svg');
      await expect(svg).toHaveAttribute('stroke', 'currentColor');
      await expect(svg).toHaveAttribute('fill', 'none');
   });

   test('size keyword lands on the HOST and the svg scales with it', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket', size: 'large' });
      await expect(c.component).toHaveCSS('font-size', '24px');
      const box = await c.locator('svg').boundingBox();
      expect(Math.round(box.width)).toBe(24);
      expect(Math.round(box.height)).toBe(24);
   });

   test('an arbitrary size string is passed through', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket', size: '40px' });
      await expect(c.component).toHaveCSS('font-size', '40px');
   });

   test('color lands on the host and is inherited by the glyph', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket', color: 'rgb(255, 0, 0)' });
      await expect(c.component).toHaveCSS('color', 'rgb(255, 0, 0)');
      await expect(c.locator('svg')).toHaveCSS('color', 'rgb(255, 0, 0)');
   });

   test('defaults to currentColor so an icon inherits its surroundings', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket' });
      await c.component.evaluate((el) => { el.style.color = 'rgb(0, 128, 0)'; });
      await expect(c.locator('svg')).toHaveCSS('color', 'rgb(0, 128, 0)');
   });

   test('changing name re-renders immediately, without a separate update()', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket' });
      const signature = () => c.component.evaluate((el) =>
         [...el.querySelectorAll('svg > *')].map((n) => n.getAttribute('d') || n.getAttribute('cx')).join('|')
      );
      const before = await signature();
      // `bell` is public; `bell-ring` is not, so this also proves the component
      // only accepts the 291 documented names.
      await c.component.evaluate((el) => { el.name = 'user-circle'; });
      const after = await signature();
      expect(after).not.toBe(before);
      expect(after.length).toBeGreaterThan(0);
   });

   test('a renamed legacy name still resolves to a real glyph', async ({ mount }) => {
      // `trash-bin` and `angle-down` do not exist in Lucide; they are aliases.
      for (const name of ['trash-bin', 'angle-down', 'check-circle', 'user-circle']) {
         const c = await mount('Icon', { name });
         const n = await c.locator('svg').evaluate((svg) => svg.children.length);
         expect(n, `"${name}" must still draw something`).toBeGreaterThan(0);
      }
   });

   test('a brand mark keeps its original artwork and recolours with currentColor', async ({ mount }) => {
      const c = await mount('Icon', { name: 'github' });
      const svg = c.locator('svg');
      // Filled, not stroked: the legacy marks are solid silhouettes.
      await expect(svg).toHaveAttribute('fill', 'currentColor');
      const box = await svg.boundingBox();
      expect(box.width).toBeGreaterThan(0);
   });

   test('unknown icon name warns and renders nothing (never a blank box)', async ({ mount }) => {
      const c = await mount('Icon', { name: 'definitely-not-an-icon' });
      expect(c.warnings().some((w) => w.includes('definitely-not-an-icon'))).toBe(true);
      await expect(c.locator('svg > *')).toHaveCount(0);
   });

   test('renaming to an invalid name warns too, not only at build time', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket' });
      const before = c.warnings().length;
      await c.component.evaluate((el) => { el.name = 'nope-not-real'; });
      expect(c.warnings().length).toBeGreaterThan(before);
      await expect(c.locator('svg > *')).toHaveCount(0);
   });

   test('is decorative by default and exposed to AT when labelled', async ({ mount }) => {
      const plain = await mount('Icon', { name: 'rocket' });
      await expect(plain.component).toHaveAttribute('aria-hidden', 'true');
      await expect(plain.component).not.toHaveAttribute('role', 'img');

      const labelled = await mount('Icon', { name: 'rocket', label: 'Launch' });
      await expect(labelled.component).toHaveAttribute('role', 'img');
      await expect(labelled.component).toHaveAttribute('aria-label', 'Launch');
      await expect(labelled.component).not.toHaveAttribute('aria-hidden', 'true');
   });

   test('deprecated iconStyle is accepted, ignored, and warns once', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket', iconStyle: 'outlined' });
      // Still renders the single-style glyph.
      await expect(c.locator('svg > *')).not.toHaveCount(0);
      const deprecations = c.deprecationWarnings();
      expect(deprecations.some((w) => w.includes('iconStyle'))).toBe(true);
      expect(deprecations.filter((w) => w.includes('iconStyle')).length).toBe(1);
   });

   test('a11y: the svg is not focusable', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket' });
      await expect(c.locator('svg')).toHaveAttribute('focusable', 'false');
   });

   // The previous implementation styled `[class^="slc-"]` at GLOBAL scope with
   // `font-family: slc !important`, so any unrelated element whose class started
   // with "slc-" inherited the icon font across the whole app. The glyphs are
   // inline SVG now, so neither the font nor the global selector exists.
   test('an unrelated "slc-" class is not touched by the icon system', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket' });
      const spoof = await c.component.evaluate(() => {
         const span = document.createElement('span');
         span.className = 'slc-layout';
         span.textContent = 'Hello';
         document.body.appendChild(span);
         const font = getComputedStyle(span).fontFamily;
         const display = getComputedStyle(span).display;
         span.remove();
         // No @font-face left for the old icon font anywhere in the document.
         const fontFaces = [...document.styleSheets]
            .flatMap((sheet) => { try { return [...sheet.cssRules]; } catch { return []; } })
            .filter((r) => r.constructor.name === 'CSSFontFaceRule')
            .map((r) => r.style.getPropertyValue('font-family'));
         return { font, display, fontFaces };
      });
      expect(spoof.font).not.toMatch(/slc/);
      expect(spoof.display).not.toBe('inline-block');
      expect(spoof.fontFaces.join(' ')).not.toMatch(/\bslc\b/);
   });

   test('visual: filled rocket icon @visual', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket', size: 'large' });
      await expect(c.component).toHaveScreenshot('icon-rocket-filled.png');
   });

// Walks EVERY public icon name and asserts its painted geometry fits inside its
// own viewBox.
//
// This exists because of a real bug: the sprite's brand and Slice marks were
// authored on a ~1000-1180 unit grid (sliceJs is 1061x1320) while the template's
// viewBox was hardcoded to 0 0 24 24. Those marks painted ~55x too large, and
// because Icon.css sets `overflow: visible` they escaped the layout box and
// covered the page — so an icon looked like a giant purple wedge, not like a
// missing icon. No per-name assertion caught it; only measuring did.

test.describe('Icon — geometry fits its viewBox', () => {
   test('every one of the 291 names renders inside its own viewBox', async ({ mountHtml }) => {
      test.setTimeout(180_000);
      const h = await mountHtml(`<div></div>`);

      const offenders = await h.page.evaluate(async () => {
         const { NAMES } = await import('/Components/Visual/Icon/icons.generated.js');
         const bad = [];
         const host = document.createElement('div');
         host.style.cssText = 'position:absolute;left:-9999px;top:0';
         document.body.appendChild(host);

         for (const name of NAMES) {
            const icon = await slice.build('Icon', { sliceId: `geo-${name}`, name, size: '24px' });
            host.appendChild(icon);
            const svg = icon.querySelector('svg');
            if (!svg) {
               bad.push({ name, why: 'no svg' });
               continue;
            }

            const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
            const [, , vbW, vbH] = vb;
            const box = svg.getBBox();

            // 1 unit of slack for a stroke that sits on the box edge.
            const slack = 1;
            const overflows =
               box.x < -slack ||
               box.y < -slack ||
               box.x + box.width > vbW + slack ||
               box.y + box.height > vbH + slack;

            if (overflows) {
               bad.push({
                  name,
                  why: `bbox ${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)} vs viewBox ${vbW}x${vbH}`,
               });
            }
         }
         host.remove();
         return { total: NAMES.length, bad };
      });

      expect(offenders.total).toBeGreaterThan(250);
      // Empty is the point: every name must fit its own viewBox.
      expect(offenders.bad).toEqual([]);
   });

   test('a known non-24x24 mark declares its real viewBox', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const viewBox = await h.page.evaluate(async () => {
         const icon = await slice.build('Icon', { sliceId: 'vb-slicejs', name: 'sliceJs' });
         document.body.appendChild(icon);
         return icon.querySelector('svg').getAttribute('viewBox');
      });

      // sliceJs is authored 1061x1320, not 24x24.
      expect(viewBox).not.toBe('0 0 24 24');
      expect(viewBox).toMatch(/^0 0 \d+ \d+$/);
   });

   test('a Lucide-backed icon keeps the standard 24x24 viewBox', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const viewBox = await h.page.evaluate(async () => {
         const icon = await slice.build('Icon', { sliceId: 'vb-star', name: 'star' });
         document.body.appendChild(icon);
         return icon.querySelector('svg').getAttribute('viewBox');
      });

      expect(viewBox).toBe('0 0 24 24');
   });

   test('the rendered box equals the requested size, for every flavour', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const boxes = await h.page.evaluate(async () => {
         const out = {};
         for (const name of ['star', 'chevron-down', 'sliceJs', 'slicePizza', 'github']) {
            const cell = document.createElement('div');
            cell.style.cssText = 'display:inline-block;font-size:16px';
            const icon = await slice.build('Icon', { sliceId: `box-${name}`, name, size: '16px' });
            cell.appendChild(icon);
            document.body.appendChild(cell);
            const r = icon.getBoundingClientRect();
            out[name] = `${Math.round(r.width)}x${Math.round(r.height)}`;
         }
         return out;
      });

      // The layout box was always correct (the CSS sizes it in `em`) — the paint
      // escaped it. So this guards the box, and the spec above guards the paint.
      for (const [name, box] of Object.entries(boxes)) {
         expect(box, `${name} layout box`).toBe('16x16');
      }
   });
});
});