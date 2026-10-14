import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// BottomNav item shape (§4): { text, path, icon? } (also supports type: 'dropdown').
// Each path item renders an <li.slice_bottomnav_tab> with a .slice_bottomnav_label and
// data-path; clicking it calls slice.router.navigate(path). The active tab is derived
// from window.location.pathname, so we keep paths that won't match the /__test route.
const ITEMS = [
   { text: 'Home', path: '/bn-home' },
   { text: 'Docs', path: '/bn-docs' },
   { text: 'About', path: '/bn-about' },
];

test.describe('BottomNav', () => {
   const readTabsCenterDelta = async (component) => component.locator('.slice_bottomnav').evaluate((root) => {
      const bar = root.querySelector('.slice_bottomnav_bar');
      const tabs = root.querySelector('.slice_bottomnav_tabs');
      if (!bar || !tabs) return 999;

      const barRect = bar.getBoundingClientRect();
      const tabsRect = tabs.getBoundingClientRect();
      const barCenter = barRect.left + (barRect.width / 2);
      const tabsCenter = tabsRect.left + (tabsRect.width / 2);
      return Math.round((tabsCenter - barCenter) * 100) / 100;
   });

   test('smoke: builds and mounts without errors', async ({ mount }) => {
      // The host (slice-bottom-nav) is display:block but the default `fixed`
      // position takes the inner bar out of flow, leaving the host zero-height
      // (reported "hidden"). Assert visibility on the inner root with a
      // static position instead.
      const c = await mount('BottomNav', { items: ITEMS, position: 'static' });
      await expect(c.locator('.slice_bottomnav')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('renders one tab per item with label text and data-path', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS });
      const tabs = c.locator('.slice_bottomnav_tab');
      await expect(tabs).toHaveCount(3);
      await expect(c.locator('.slice_bottomnav_label').nth(0)).toHaveText('Home');
      await expect(tabs.nth(1)).toHaveAttribute('data-path', '/bn-docs');
   });

   test('item icon renders a slice Icon inside the tab', async ({ mount }) => {
      const c = await mount('BottomNav', {
         items: [{ text: 'Home', path: '/bn-home', icon: 'home' }],
      });
      await expect(c.locator('.slice_bottomnav_tab .slice_bottomnav_icon')).toHaveCount(1);
   });

   test('position="fixed" sets data-position=fixed on the inner root', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'fixed' });
      await expect(c.locator('.slice_bottomnav')).toHaveAttribute('data-position', 'fixed');
   });

   test('position other than fixed maps to data-position=static', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'relative' });
      await expect(c.locator('.slice_bottomnav')).toHaveAttribute('data-position', 'static');
   });

   test('direction="reverse" adds the reverse modifier class to the bar', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, direction: 'reverse' });
      await expect(c.locator('.slice_bottomnav_bar')).toHaveClass(/slice_bottomnav_reverse/);
   });

   test('logo prop renders an img and marks the logo container visible', async ({ mount }) => {
      const c = await mount('BottomNav', {
         items: ITEMS,
         logo: { src: '/logo.png', alt: 'Brand', path: '/bn-home' },
      });
      const logo = c.locator('.slice_bottomnav_logo');
      await expect(logo).toHaveClass(/is-visible/);
      await expect(logo.locator('img')).toHaveAttribute('alt', 'Brand');
   });

   test('buttons render a Button into the actions container', async ({ mount }) => {
      const c = await mount('BottomNav', {
         items: ITEMS,
         buttons: [{ value: 'Login' }],
      });
      await expect(c.locator('.slice_bottomnav_actions .slice_button')).toHaveCount(1);
      await expect(c.locator('.slice_bottomnav_actions .slice_button_value')).toHaveText('Login');
   });

   test('clicking a tab marks it active without throwing', async ({ mount }) => {
      // Clicking calls slice.router.navigate(path); the tab also gets is-active.
      const c = await mount('BottomNav', { items: ITEMS });
      await c.locator('.slice_bottomnav_tab[data-path="/bn-docs"]').click();
      await expect(c.locator('.slice_bottomnav_tab[data-path="/bn-docs"]')).toHaveClass(/is-active/);
      expect(c.pageErrors()).toEqual([]);
   });

   test('tabs remain visually centered inside the bar', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'static' });
      const delta = await readTabsCenterDelta(c);

      expect(Math.abs(delta)).toBeLessThanOrEqual(0.5);
   });

   test('tabs stay centered even with trailing actions', async ({ mount }) => {
      const c = await mount('BottomNav', {
         items: ITEMS,
         position: 'static',
         buttons: [{ value: 'Login' }],
      });
      const delta = await readTabsCenterDelta(c);

      expect(Math.abs(delta)).toBeLessThanOrEqual(0.5);
   });

   test('visual: bottom nav with items @visual', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'static' });
      await expect(c.component).toHaveScreenshot('bottomnav-items.png');
   });

// ── geometry that only a screenshot would have caught ──────────────────────
//
// Every one of these was invisible to the existing specs: the component built,
// every element existed, and every assertion about classNames and handlers
// still passed. What was wrong was how it LOOKED.

const ITEMS4 = [
   { text: 'Home', icon: 'house', path: '/a' },
   { text: 'Search', icon: 'search', path: '/b' },
   { text: 'Saved', icon: 'bookmark', path: '/c' },
   { text: 'Profile', icon: 'user', path: '/d' },
];

const LOGO_SRC =
   'data:image/svg+xml;base64,' +
   btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="white"/></svg>');

/** Relative luminance + contrast, compositing alpha over an opaque backdrop. */
function contrastKit() {
   const lin = (c) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
   };
   const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
   // getComputedStyle resolves color-mix() to `color(srgb 0.57 0.2 0.91 / 0.86)`,
   // whose channels are 0..1 — reading them as 0..255 is what once made a light
   // purple bar come back as near-black.
   const parse = (css) => {
      const n = (css.match(/[\d.]+/g) || []).map(Number);
      if (css.startsWith('color(')) return [n[0] * 255, n[1] * 255, n[2] * 255, n[3] ?? 1];
      return [n[0], n[1], n[2], n[3] ?? 1];
   };
   const over = (fg, bg, a) => fg.map((c, i) => c * a + bg[i] * (1 - a));
   const ratio = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
   };
   return { parse, over, ratio };
}

test.describe('BottomNav - measured layout', () => {
   /** Mounts one nav detached from the fixed positioning, fully settled. */
   async function stage(h, props) {
      return h.page.evaluate(async (p) => {
         const strip = document.createElement('div');
         strip.id = 'probe';
         strip.style.cssText = 'padding:20px;width:1240px;background:#f6f5fb';
         document.body.appendChild(strip);

         const nav = await slice.build('BottomNav', p);
         strip.appendChild(nav);
         const root = nav.querySelector('.slice_bottomnav');
         root.style.position = 'relative';
         root.style.left = 'auto';
         root.style.bottom = 'auto';
         root.style.transform = 'none';

         // The rise animation is 0.55s with per-tab delays; measuring inside it
         // reports heights that correspond to nothing on screen.
         await new Promise((r) => setTimeout(r, 1300));
         nav.setActivePath('/b');
         await new Promise((r) => setTimeout(r, 700));
         return true;
      }, props);
   }

   /** Reads the staged bar's height and tears the probe down. */
   const barHeight = async (h, props) => {
      await stage(h, props);
      const height = await h.page.evaluate(() => {
         const nav = document.querySelector('#probe slice-bottom-nav');
         return Math.round(nav.querySelector('.slice_bottomnav_bar').getBoundingClientRect().height * 10) / 10;
      });
      await h.page.evaluate(() => document.getElementById('probe')?.remove());
      return height;
   };

   test('adding actions does not change the bar height', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const plain = await barHeight(h, { items: ITEMS4 });
      const withActions = await barHeight(h, {
         items: ITEMS4,
         buttons: [{ value: 'Sign in', color: { text: '#fff', background: '#7c3aed' } }],
      });

      // The invariant is that actions do not resize the bar, not an absolute
      // pixel: the label size moved once already (10.4 -> 11.2px for
      // legibility), so the bar reads 56.2px now. Before the fix the same
      // comparison was 55.4 vs 69 — the action button added 13.6px of nothing.
      expect(withActions).toBe(plain);
      expect(plain).toBeGreaterThan(45);
      expect(plain).toBeLessThan(62);
   });

   test('an action button label never wraps to a second line', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await stage(h, { items: ITEMS4, buttons: [{ value: 'Sign in', color: { text: '#fff', background: '#7c3aed' } }] });

      const value = await h.page.evaluate(() => {
         const val = document.querySelector('.slice_bottomnav_actions .slice_button_value');
         const cs = getComputedStyle(val);
         const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
         return {
            lines: val.getBoundingClientRect().height / lineHeight,
            hostHeight: document.querySelector('.slice_bottomnav_actions slice-button').getBoundingClientRect().height,
            paintedHeight: document.querySelector('.slice_bottomnav_actions .slice_button').getBoundingClientRect().height,
         };
      });

      expect(value.lines).toBeLessThan(1.3);
      // _balanceTabs pads the tab list to centre it, and that padding used to
      // squeeze the button until the text broke: 39px -> 56px.
      expect(value.hostHeight).toBe(value.paintedHeight);
   });

   test('the logo image gets a real box', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await stage(h, { items: ITEMS4, logo: { src: LOGO_SRC, alt: 'Acme', path: '/' } });

      const box = await h.page.evaluate(() => {
         const img = document.querySelector('.slice_bottomnav_logo img');
         const r = img.getBoundingClientRect();
         return { w: r.width, h: r.height, natural: img.naturalWidth };
      });

      // With only `max-height`, the used width resolved against a content box
      // sized by the image itself and the pair collapsed: 0x0 next to a loaded
      // 150x150 natural size, so the logo reserved its padding and drew nothing.
      expect(box.natural).toBeGreaterThan(0);
      expect(box.h).toBeCloseTo(22, 0);
      expect(box.w).toBeCloseTo(22, 0);
   });

   test('the active tab paints no background of its own', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await stage(h, { items: ITEMS4 });

      const state = await h.page.evaluate(() => {
         const tab = document.querySelector('.slice_bottomnav_tab.is-active');
         return { bg: getComputedStyle(tab).backgroundColor, indicator: getComputedStyle(document.querySelector('.slice_bottomnav_indicator')).backgroundColor };
      });

      // The sliding indicator already paints the pill at 16%. The tab painted
      // 14% underneath it, so the two stacked to ~28% and during the slide the
      // static one stayed behind the moving one — two pills, not one that moved.
      expect(state.bg).toBe('rgba(0, 0, 0, 0)');
      expect(state.indicator).not.toBe('rgba(0, 0, 0, 0)');
   });

   test('the indicator still tracks the active tab exactly', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await stage(h, { items: ITEMS4 });

      const fit = await h.page.evaluate(() => {
         const ind = document.querySelector('.slice_bottomnav_indicator').getBoundingClientRect();
         const tab = document.querySelector('.slice_bottomnav_tab.is-active').getBoundingClientRect();
         return { dw: Math.abs(ind.width - tab.width), dl: Math.abs(ind.left - tab.left) };
      });

      expect(fit.dw).toBeLessThanOrEqual(0.5);
      expect(fit.dl).toBeLessThanOrEqual(0.5);
   });
});

test.describe('BottomNav - label legibility', () => {
   test('labels meet AA against the capsule they sit on', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async (items) => {
         const strip = document.createElement('div');
         strip.style.cssText = 'padding:40px;background:#f6f5fb';
         document.body.appendChild(strip);

         const nav = await slice.build('BottomNav', { items });
         strip.appendChild(nav);
         const root = nav.querySelector('.slice_bottomnav');
         root.style.position = 'relative';
         root.style.left = 'auto';
         root.style.bottom = 'auto';
         root.style.transform = 'none';
         await new Promise((r) => setTimeout(r, 1300));
         nav.setActivePath('/b');
         await new Promise((r) => setTimeout(r, 700));

         // Both colours go through ONE normaliser. Handling color-mix() only
         // for the bar and not for the label is what produced a confident 3.99
         // instead of the real 4.29 — and a threshold that fails for the wrong
         // reason is worse than no threshold.
         const rgba = (css) => {
            const n = (css.match(/[\d.]+/g) || []).map(Number);
            if (css.startsWith('color(')) return [n[0] * 255, n[1] * 255, n[2] * 255, n[3] ?? 1];
            return [n[0], n[1], n[2], n[3] ?? 1];
         };

         const measure = (sel) => {
            const label = nav.querySelector(sel);
            const cs = getComputedStyle(label);
            const bar = getComputedStyle(nav.querySelector('.slice_bottomnav_bar'));
            const page = [246, 245, 251];
            const barC = rgba(bar.backgroundColor);
            const labelC = rgba(cs.color);

            const over = (fg, bg, a) => fg.map((c, i) => c * a + bg[i] * (1 - a));
            const lin = (c) => {
               const s = c / 255;
               return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
            };
            const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
            const barEff = over(barC.slice(0, 3), page, barC[3]);
            const labelEff = over(labelC.slice(0, 3), barEff, labelC[3]);
            const [hi, lo] = [lum(labelEff), lum(barEff)].sort((x, y) => y - x);
            return { ratio: (hi + 0.05) / (lo + 0.05), fontSize: parseFloat(cs.fontSize), text: label.textContent };
         };

         return {
            active: measure('.slice_bottomnav_tab.is-active .slice_bottomnav_label'),
            inactive: measure('.slice_bottomnav_tab:not(.is-active) .slice_bottomnav_label'),
         };
      }, ITEMS4);

      // Before: 4.35:1 active and 2.18:1 inactive — the inactive labels were
      // what read as washed out. The active label is the one AA really governs,
      // since it is the one that has to be readable at a glance.
      expect(out.active.ratio).toBeGreaterThanOrEqual(4.5);
      expect(out.inactive.ratio).toBeGreaterThanOrEqual(4);
      // 10.4px was small enough to lose legibility on its own.
      expect(out.active.fontSize).toBeGreaterThanOrEqual(11);
   });
});});
