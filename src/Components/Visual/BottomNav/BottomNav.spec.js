import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// BottomNav: <nav.slice_bottomnav data-position> > .slice_bottomnav_bar >
//   a.slice_bottomnav_logo + ul.slice_bottomnav_tabs (li.slice_bottomnav_tab[data-path] > a.slice_bottomnav_link,
//   span.slice_bottomnav_indicator) + .slice_bottomnav_actions.
// The active tab comes from the URL (exact, then longest prefix), so the paths
// here never match the /__test route.
const ITEMS = [
   { text: 'Home', path: '/bn-home' },
   { text: 'Docs', path: '/bn-docs' },
   { text: 'About', path: '/bn-about' },
];

const readTabsCenterDelta = async (component) => component.locator('.slice_bottomnav').evaluate((root) => {
   const bar = root.querySelector('.slice_bottomnav_bar');
   const tabs = root.querySelector('.slice_bottomnav_tabs');
   if (!bar || !tabs) return 999;
   const barRect = bar.getBoundingClientRect();
   const tabsRect = tabs.getBoundingClientRect();
   return Math.round(((tabsRect.left + tabsRect.width / 2) - (barRect.left + barRect.width / 2)) * 100) / 100;
});

/** Build inside the page (for props carrying Nodes or functions). */
async function build(page, props, setup = '') {
   await page.evaluate(async ({ props, setup }) => {
      window.__log = [];
      // eslint-disable-next-line no-new-func
      const extra = setup ? new Function('log', `return (${setup});`)((...a) => window.__log.push(a)) : {};
      const el = await slice.build('BottomNav', { ...props, ...extra });
      el.id = 'bn';
      document.getElementById('host').appendChild(el);
      window.__bn = el;
   }, { props, setup });
   return page.locator('#bn');
}

test.describe('BottomNav — compatibility', () => {
   test('smoke: builds and mounts without errors; a named nav landmark', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'static' });
      await expect(c.locator('.slice_bottomnav')).toBeVisible();
      await expect(c.component.getByRole('navigation', { name: 'Main' })).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('renders one tab per item with label text and data-path; each tab is a real link', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS });
      const tabs = c.locator('.slice_bottomnav_tab');
      await expect(tabs).toHaveCount(3);
      await expect(c.locator('.slice_bottomnav_label').nth(0)).toHaveText('Home');
      await expect(tabs.nth(1)).toHaveAttribute('data-path', '/bn-docs');
      await expect(c.component.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/bn-docs');
   });

   test('item icon renders a slice Icon inside the tab', async ({ mount }) => {
      const c = await mount('BottomNav', { items: [{ text: 'Home', path: '/bn-home', icon: 'home' }] });
      await expect(c.locator('.slice_bottomnav_tab .slice_bottomnav_icon')).toHaveCount(1);
   });

   test('position: fixed / sticky / static; anything else maps to static, as before', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'fixed' });
      await expect(c.locator('.slice_bottomnav')).toHaveAttribute('data-position', 'fixed');
      await c.component.evaluate((el) => { el.position = 'relative'; });
      await expect(c.locator('.slice_bottomnav')).toHaveAttribute('data-position', 'static');
      await c.component.evaluate((el) => { el.position = 'sticky'; });
      await expect(c.locator('.slice_bottomnav')).toHaveCSS('position', 'sticky');
   });

   test('direction="reverse" mirrors the bar and the tab order', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, direction: 'reverse' });
      await expect(c.locator('.slice_bottomnav_bar')).toHaveClass(/slice_bottomnav_reverse/);
      await expect(c.locator('.slice_bottomnav_label')).toHaveText(['About', 'Docs', 'Home']);
   });

   test('logo renders one img (even when set twice) and marks the logo visible', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, logo: { src: '/logo.png', alt: 'Brand', path: '/bn-home' } });
      const logo = c.locator('.slice_bottomnav_logo');
      await expect(logo).toHaveClass(/is-visible/);
      await expect(logo.locator('img')).toHaveAttribute('alt', 'Brand');
      await c.component.evaluate((el) => { el.logo = { src: '/other.png', alt: 'Other' }; });
      await expect(logo.locator('img')).toHaveCount(1);
      await c.component.evaluate((el) => { el.logo = null; });
      await expect(logo).not.toHaveClass(/is-visible/);
   });

   test('buttons render as the bar\'s own pills (not Button), round when icon-only', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'static', buttons: [{ value: 'Login' }, { icon: 'bell', ariaLabel: 'Alerts' }] }, { spies: [] });
      const actions = c.locator('.slice_bottomnav_actions .slice_bottomnav_action');
      await expect(actions).toHaveCount(2);
      await expect(c.locator('.slice_bottomnav_actions slice-button')).toHaveCount(0);
      await expect(c.component.getByRole('button', { name: 'Login' })).toHaveCSS('border-radius', /999px|9\.99e\+?\d+px/);
      const bell = c.component.getByRole('button', { name: 'Alerts' });
      const box = await bell.boundingBox();
      expect(Math.abs(box.width - box.height)).toBeLessThan(1);
   });

   test('a button config still runs its onClick', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const bn = await build(page, { items: ITEMS, position: 'static' }, `{ buttons: [{ value: 'Login', onClick: () => log('login') }] }`);
      await bn.getByRole('button', { name: 'Login' }).click();
      expect(await page.evaluate(() => window.__log)).toEqual([['login']]);
   });

   test('legacy dropdown items (type + options) still build a DropDown', async ({ mount }) => {
      const c = await mount('BottomNav', { items: [...ITEMS, { text: 'More', type: 'dropdown', options: [{ text: 'A', href: '#a' }] }], position: 'static' });
      await expect(c.locator('.slice_bottomnav_tab.is-dropdown slice-dropdown')).toHaveCount(1);
   });

   test('tabs remain visually centered inside the bar, with or without trailing actions', async ({ mount }) => {
      const a = await mount('BottomNav', { items: ITEMS, position: 'static', layout: 'floating' });
      expect(Math.abs(await readTabsCenterDelta(a))).toBeLessThanOrEqual(0.5);
      const b = await mount('BottomNav', { items: ITEMS, position: 'static', layout: 'floating', buttons: [{ value: 'Login' }] });
      await expect(b.locator('.slice_bottomnav_actions .slice_bottomnav_action')).toHaveCount(1);
      await expect.poll(async () => Math.abs(await readTabsCenterDelta(b))).toBeLessThanOrEqual(0.5);
   });
});

test.describe('BottomNav — current tab', () => {
   test('a click marks the tab, sets aria-current, navigates and reports onChange', async ({ mount, page }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'static' }, { spies: ['onChange'] });
      await page.evaluate(() => { window.__nav = []; slice.router.navigate = (p) => { window.__nav.push(p); }; });
      await c.locator('.slice_bottomnav_tab[data-path="/bn-docs"]').click();
      await expect(c.locator('.slice_bottomnav_tab[data-path="/bn-docs"]')).toHaveClass(/is-active/);
      await expect(c.component.getByRole('link', { name: 'Docs' })).toHaveAttribute('aria-current', 'page');
      expect(await page.evaluate(() => window.__nav)).toEqual(['/bn-docs']);
      expect((await c.eventArgs('onChange'))[0][0].text).toBe('Docs');
      expect(c.pageErrors()).toEqual([]);
   });

   test('exact match beats a prefix; "/" and exact tabs only match themselves', async ({ mount }) => {
      const c = await mount('BottomNav', {
         items: [{ text: 'Root', path: '/' }, { text: 'Docs', path: '/docs' }, { text: 'API', path: '/docs/api', exact: true }],
         position: 'static',
      });
      const current = () => c.component.evaluate((el) => [...el.querySelectorAll('.slice_bottomnav_tab.is-active')].map((t) => t.textContent.trim()));
      await c.component.evaluate((el) => el.setActivePath('/docs/guide'));
      expect(await current()).toEqual(['Docs']);
      await c.component.evaluate((el) => el.setActivePath('/docs/api'));
      expect(await current()).toEqual(['API']);
      await c.component.evaluate((el) => el.setActivePath('/docs/api/v2'));
      expect(await current()).toEqual(['Docs']);
      await c.component.evaluate((el) => el.setActivePath('/nowhere'));
      expect(await current()).toEqual([]);
      await expect(c.locator('.slice_bottomnav_indicator')).not.toHaveClass(/is-visible/);
   });

   test('follows router:change and popstate', async ({ mount, page }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'static' });
      const original = await page.evaluate(() => location.pathname);
      await page.evaluate(() => {
         history.pushState({}, '', '/bn-about/team');
         window.dispatchEvent(new CustomEvent('router:change', { detail: {} }));
      });
      await expect(c.locator('.slice_bottomnav_tab[data-path="/bn-about"]')).toHaveClass(/is-active/);
      await page.evaluate(() => {
         history.pushState({}, '', '/bn-home');
         window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await expect(c.locator('.slice_bottomnav_tab[data-path="/bn-home"]')).toHaveClass(/is-active/);
      await page.evaluate((path) => history.replaceState({}, '', path), original);
   });

   test('← → move between tabs', async ({ mount, page }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'static' });
      await c.component.getByRole('link', { name: 'Home' }).focus();
      await page.keyboard.press('ArrowRight');
      await expect(c.component.getByRole('link', { name: 'Docs' })).toBeFocused();
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await expect(c.component.getByRole('link', { name: 'About' })).toBeFocused();
   });
});

test.describe('BottomNav — badges, centre action, labels', () => {
   test('badges: numbers (99+ cap), a dot, and setBadge() to change them', async ({ mount }) => {
      const c = await mount('BottomNav', {
         items: [{ text: 'Inbox', icon: 'inbox', path: '/i', badge: 3 }, { text: 'News', icon: 'bell', path: '/n', badge: true }, { text: 'Max', path: '/m', badge: 250 }],
         position: 'static',
      });
      const badges = c.locator('.slice_bottomnav_badge');
      await expect(badges).toHaveCount(3);
      await expect(badges.nth(0)).toHaveText('3');
      await expect(badges.nth(1)).toHaveClass(/slice_bottomnav_badge--dot/);
      await expect(badges.nth(2)).toHaveText('99+');
      const inbox = c.component.getByRole('link', { name: 'Inbox' });
      expect(await inbox.getAttribute('aria-describedby')).toBe(await badges.nth(0).getAttribute('id'));
      await c.component.evaluate((el) => { el.setBadge('/i', 12); el.setBadge(1, null); });
      await expect(c.locator('.slice_bottomnav_badge')).toHaveCount(2);
      await expect(c.locator('.slice_bottomnav_badge').first()).toHaveText('12');
   });

   test('fab: a raised centre action in the middle of the tabs', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const bn = await build(page, { items: [...ITEMS, { text: 'Me', path: '/me' }], position: 'static' }, `{ fab: { icon: 'plus', label: 'New post', onClick: () => log('fab') } }`);
      const order = await bn.locator('.slice_bottomnav_tabs > li').evaluateAll((lis) => lis.map((li) => li.className.includes('fab') ? 'FAB' : li.textContent.trim()));
      expect(order).toEqual(['Home', 'Docs', 'FAB', 'About', 'Me']);
      await bn.getByRole('button', { name: 'New post' }).click();
      expect(await page.evaluate(() => window.__log)).toEqual([['fab']]);
   });

   test("labels: 'active' shows only the current label; 'none' keeps the name for screen readers", async ({ mount }) => {
      const items = [{ text: 'Home', icon: 'home', path: '/bn-home' }, { text: 'Docs', icon: 'book', path: '/bn-docs' }];
      const c = await mount('BottomNav', { items, position: 'static', labels: 'active' });
      await c.component.evaluate((el) => el.setActivePath('/bn-docs'));
      await expect(c.locator('.slice_bottomnav_tab.is-active .slice_bottomnav_label')).toBeVisible();
      await expect.poll(() => c.locator('.slice_bottomnav_tab:not(.is-active) .slice_bottomnav_label').evaluate((l) => l.getBoundingClientRect().height)).toBe(0);
      await c.component.evaluate((el) => { el.labels = 'none'; });
      await expect(c.component.getByRole('link', { name: 'Docs' })).toBeVisible();
      expect(await c.locator('.slice_bottomnav_label').first().evaluate((l) => l.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
   });

   test('variant, size, indicator and layout are reflected; layout auto docks below the breakpoint', async ({ mount, page }) => {
      const c = await mount('BottomNav', { items: ITEMS, variant: 'glass', size: 'lg', indicator: 'line' });
      await expect(c.component).toHaveAttribute('data-variant', 'glass');
      await expect(c.component).toHaveAttribute('data-size', 'lg');
      await expect(c.component).toHaveAttribute('data-indicator', 'line');
      await page.setViewportSize({ width: 400, height: 700 });
      await expect(c.component).toHaveClass(/slice_bottomnav--docked/);
      await page.setViewportSize({ width: 1100, height: 700 });
      await expect(c.component).not.toHaveClass(/slice_bottomnav--docked/);
      await c.component.evaluate((el) => { el.layout = 'docked'; });
      await expect(c.component).toHaveClass(/slice_bottomnav--docked/);
   });
});

test.describe('BottomNav — reactivity and scrolling', () => {
   test('items, buttons and actions are reactive; nodes an app appended survive', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'static' });
      await c.component.evaluate((el) => {
         const mine = document.createElement('span');
         mine.className = 'app-extra';
         el.querySelector('.slice_bottomnav_actions').appendChild(mine);
         el.items = [{ text: 'One', path: '/one' }];
         el.buttons = [{ value: 'Join' }];
      });
      await expect(c.locator('.slice_bottomnav_label')).toHaveText(['One']);
      await expect(c.locator('.slice_bottomnav_actions .slice_bottomnav_action')).toHaveText('Join');
      await expect(c.locator('.slice_bottomnav_actions .app-extra')).toHaveCount(1);
   });

   test('hideOnScroll hides going down and comes back going up', async ({ mountHtml, page }) => {
      await page.setViewportSize({ width: 900, height: 600 });
      await mountHtml('<div id="host"></div><div style="height:3000px"></div>');
      const bn = await build(page, { items: ITEMS, hideOnScroll: true });
      await page.evaluate(() => window.scrollTo(0, 500));
      await expect(bn).toHaveClass(/slice_bottomnav--hidden/);
      await page.evaluate(() => window.scrollTo(0, 400));
      await expect(bn).not.toHaveClass(/slice_bottomnav--hidden/);
   });

   test('spacer: true reserves the height of a fixed bar', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS });
      expect(await c.component.evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
      await c.component.evaluate((el) => { el.spacer = true; });
      await expect.poll(() => c.component.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(40);
   });

   test('destroying it leaves no errors', async ({ mount, page }) => {
      const c = await mount('BottomNav', { items: ITEMS, hideOnScroll: true });
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      await page.evaluate(() => { window.scrollTo(0, 100); window.dispatchEvent(new Event('resize')); window.dispatchEvent(new PopStateEvent('popstate')); });
      expect(c.pageErrors()).toEqual([]);
   });
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
      // The floating bar grew on purpose (roomier tabs on desktop): ~70px at md.
      expect(plain).toBeGreaterThan(60);
      expect(plain).toBeLessThan(76);
   });

   test('an action button label never wraps to a second line', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await stage(h, { items: ITEMS4, buttons: [{ value: 'Sign in', color: { text: '#fff', background: '#7c3aed' } }] });

      const value = await h.page.evaluate(() => {
         const val = document.querySelector('.slice_bottomnav_actions .slice_bottomnav_action_label');
         const cs = getComputedStyle(val);
         const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
         return {
            lines: val.getBoundingClientRect().height / lineHeight,
            hostHeight: document.querySelector('.slice_bottomnav_actions').getBoundingClientRect().height,
            paintedHeight: document.querySelector('.slice_bottomnav_actions .slice_bottomnav_action').getBoundingClientRect().height,
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
});