import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// start() moves the overlay out of the test's root (to the page, or to a
// container), so the tests hold the element itself, and find what is inside
// it by an id that moves with it.
async function setup(mount, page, props = {}) {
   const c = await mount('Loading', props);
   const handle = await c.component.elementHandle();
   await handle.evaluate((el) => { el.id = 'loading-under-test'; });
   return {
      c,
      run: (fn, arg) => handle.evaluate(fn, arg),
      host: page.locator('#loading-under-test'),
      $: (selector) => page.locator(`#loading-under-test ${selector}`),
   };
}

// Every test stops what it starts: the overlay covers the whole page.
const stop = (t) => t.run((el) => { el.minVisibleMs = 0; el.stop(); });

test.describe('Loading — start and stop', () => {
   test('smoke: the slice variant by default, with the logo in the accent colour', async ({ mount, page }) => {
      const t = await setup(mount, page);
      const { c } = t;
      expect(c.pageErrors()).toEqual([]);
      await expect(t.host).toHaveClass(/slice-loading/);
      await expect(t.host).toHaveAttribute('data-variant', 'slice');
      const { fills } = await t.run((el) => ({
         fills: [...el.querySelectorAll('.slice-loading__logo path')].map((p) => getComputedStyle(p).fill),
      }));
      expect(fills.length).toBeGreaterThan(0);
      expect(new Set(fills).size).toBe(1);
      expect(fills[0]).not.toBe('rgb(0, 0, 0)');
   });

   test('start() covers the page above every other layer; stop() removes it', async ({ mount, page }) => {
      const t = await setup(mount, page);
      const { c } = t;
      await t.run((el) => el.start());
      expect(await t.run((el) => el.parentElement === document.body && el.style.position === 'fixed')).toBe(true);
      expect(await t.run((el) => Number(el.style.zIndex))).toBeGreaterThan(999999);
      expect(await page.evaluate(() => document.body.getAttribute('aria-busy'))).toBe('true');
      await expect(t.$('.slice-loading__status')).toHaveText('Loading…');
      await t.run((el) => el.stop());
      // The way out is a fade, not a cut: still there, already out of the way.
      await expect(t.host).toHaveClass(/is-leaving/);
      expect(await t.run((el) => getComputedStyle(el).pointerEvents)).toBe('none');
      await expect.poll(() => t.run((el) => el.isConnected)).toBe(false);
      expect(await page.evaluate(() => document.body.hasAttribute('aria-busy'))).toBe(false);
   });

   test('stop() fades the page in instead of cutting to it', async ({ mount, page }) => {
      const t = await setup(mount, page);
      await t.run((el) => el.start());
      // A measurable fade, not the old one-frame disappearance.
      const during = await t.run((el) => {
         el.stop();
         const overlay = el.querySelector('.slice-loading__overlay');
         return {
            leaving: el.classList.contains('is-leaving'),
            animation: getComputedStyle(overlay).animationName,
            duration: parseFloat(getComputedStyle(overlay).animationDuration) * 1000,
         };
      });
      expect(during.leaving).toBe(true);
      expect(during.animation).toBe('slice-loading-fade-out');
      expect(during.duration).toBeGreaterThan(120);
      // Long enough to be seen, short enough to feel like a handover.
      expect(during.duration).toBeLessThan(400);
      expect(await t.run((el) => el.isConnected)).toBe(true);
      expect(await t.run((el) => el.active)).toBe(false);
      await expect.poll(() => t.run((el) => el.isConnected), { timeout: 1500 }).toBe(false);
   });

   test('a start() during the fade-out takes the same overlay back', async ({ mount, page }) => {
      const t = await setup(mount, page);
      await t.run((el) => el.start());
      const back = await t.run(async (el) => {
         el.stop();
         const mid = { leaving: el.classList.contains('is-leaving'), connected: el.isConnected };
         // Halfway through the 220 ms fade, the app turns busy again.
         await new Promise((resolve) => setTimeout(resolve, 60));
         el.start();
         return {
            mid,
            after: { leaving: el.classList.contains('is-leaving'), active: el.active, visible: el.visible, parent: el.parentElement === document.body },
         };
      });
      expect(back.mid).toEqual({ leaving: true, connected: true });
      // The same overlay, still where it was: no teardown, no second entrance.
      expect(back.after).toEqual({ leaving: false, active: true, visible: true, parent: true });
      await expect(t.host).not.toHaveClass(/is-leaving/);
      await expect(t.$('.slice-loading__indicator')).toBeVisible();
      await stop(t);
   });

   test('over a container: it covers only that box, and gives its styles back', async ({ mount, page }) => {
      const t = await setup(mount, page, { label: 'Saving…' });
      const { c } = t;
      const result = await t.run((el) => {
         const box = document.createElement('div');
         box.id = 'box';
         box.style.cssText = 'width:300px;height:200px';
         document.body.append(box);
         el.start(box);
         const r = el.getBoundingClientRect();
         return { parent: el.parentElement.id, w: Math.round(r.width), h: Math.round(r.height), pos: box.style.position, busy: box.getAttribute('aria-busy') };
      });
      expect(result).toEqual({ parent: 'box', w: 300, h: 200, pos: 'relative', busy: 'true' });
      await expect(t.$('.slice-loading__label')).toHaveText('Saving…');
      await expect(t.$('.slice-loading__status')).toHaveText('Saving…');
      await t.run((el) => el.stop());
      // The box keeps its own styles until the fade ends.
      await expect.poll(() => page.evaluate(() => { const box = document.getElementById('box'); return [box.style.position, box.style.overflow, box.hasAttribute('aria-busy')]; }))
         .toEqual(['', '', false]);
      await page.evaluate(() => document.getElementById('box')?.remove());
   });

   test('a container not in the page yet still holds the overlay', async ({ mount, page }) => {
      const t = await setup(mount, page);
      const position = await t.run((el) => {
         const box = document.createElement('div');
         el.start(box);
         const value = box.style.position;
         el.stop();
         return value;
      });
      expect(position).toBe('relative');
   });

   test('active and the deprecated isActive start and stop it', async ({ mount, page }) => {
      const t = await setup(mount, page);
      const { c } = t;
      expect(await t.run((el) => el.active)).toBe(false);
      await t.run((el) => { el.active = true; });
      expect(await t.run((el) => el.active && el.parentElement === document.body)).toBe(true);
      await t.run((el) => { el.active = false; });
      // Stopped at once, even though the overlay is still fading out.
      expect(await t.run((el) => el.active)).toBe(false);
      await expect.poll(() => t.run((el) => el.isConnected)).toBe(false);
      await t.run((el) => { el.isActive = true; });
      expect(await t.run((el) => el.active)).toBe(true);
      expect(c.consoleMessages().some((m) => m.text.includes('"isActive" is deprecated'))).toBe(true);
      await stop(t);
   });

   test('delayMs: work faster than the delay never shows it', async ({ mount, page }) => {
      const t = await setup(mount, page, { delayMs: 200 });
      const { c } = t;
      await t.run((el) => el.start());
      expect(await t.run((el) => [el.active, el.visible, el.isConnected])).toEqual([true, false, true]);
      await t.run((el) => el.stop());
      await page.waitForTimeout(300);
      expect(await t.run((el) => [el.active, el.visible, el.parentElement === document.body])).toEqual([false, false, false]);

      await t.run((el) => el.start());
      await page.waitForTimeout(300);
      expect(await t.run((el) => [el.visible, el.parentElement === document.body])).toEqual([true, true]);
      await stop(t);
   });

   test('minVisibleMs: once shown it stays up for the floor, and a new start() keeps it', async ({ mount, page }) => {
      const t = await setup(mount, page, { minVisibleMs: 400 });
      const { c } = t;
      await t.run((el) => { el.start(); el.stop(); });
      expect(await t.run((el) => el.active)).toBe(true);
      await t.run((el) => el.start());
      await page.waitForTimeout(500);
      expect(await t.run((el) => el.active)).toBe(true);
      await t.run((el) => el.stop());
      expect(await t.run((el) => el.active)).toBe(false);
   });

   test('destroying it cancels a stop that was waiting', async ({ mount, page }) => {
      const t = await setup(mount, page, { minVisibleMs: 300 });
      const { c } = t;
      await t.run((el) => { el.start(); el.stop(); slice.controller.destroyComponent(el); });
      await page.waitForTimeout(400);
      expect(c.pageErrors()).toEqual([]);
      expect(await page.evaluate(() => document.querySelectorAll('body > slice-loading').length)).toBe(0);
   });
});

test.describe('Loading — looks', () => {
   test('variants: slice, spinner, dots and bar show their own indicator', async ({ mount, page }) => {
      const t = await setup(mount, page);
      const { c } = t;
      for (const [variant, selector] of [['slice', '.slice-loading__logo'], ['spinner', '.slice-loading__mark--spinner'], ['dots', '.slice-loading__mark--dots'], ['bar', '.slice-loading__mark--bar']]) {
         await t.run((el, v) => { el.variant = v; el.start(); }, variant);
         await expect(t.$(selector)).toBeVisible();
         await stop(t);
      }
   });

   test('bar: no backdrop, blocks nothing, and can show a known amount', async ({ mount, page }) => {
      const t = await setup(mount, page, { variant: 'bar' });
      const { c } = t;
      await t.run((el) => el.start());
      await expect(t.host).toHaveAttribute('data-backdrop', 'none');
      expect(await t.run((el) => getComputedStyle(el).pointerEvents)).toBe('none');
      await t.run((el) => { el.progress = 0.5; });
      await expect(t.host).toHaveAttribute('data-progress', 'determinate');
      // The bar eases to its new width.
      await expect.poll(() => t.run((el) => {
         const bar = el.querySelector('.slice-loading__mark--bar');
         return Math.round(bar.firstElementChild.getBoundingClientRect().width / bar.getBoundingClientRect().width * 100);
      })).toBe(50);
      await stop(t);
   });

   test('backdrop and size', async ({ mount, page }) => {
      const t = await setup(mount, page, { backdrop: 'blur', size: 'lg', variant: 'spinner' });
      const { c } = t;
      await t.run((el) => el.start());
      await expect(t.host).toHaveAttribute('data-backdrop', 'blur');
      // offsetWidth: the ring spins, so its bounding box grows with the angle.
      expect(await t.$('.slice-loading__mark--spinner').evaluate((el) => /** @type {HTMLElement} */ (el).offsetWidth)).toBe(72);
      await stop(t);
   });

   test('reduce motion: no entrance and no movement out, but the fade stays', async ({ mount, page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const t = await setup(mount, page, { variant: 'spinner' });
      await t.run((el) => el.start());
      const motion = await t.run((el) => ({
         entrance: getComputedStyle(el.querySelector('.slice-loading__overlay')).animationName,
         spinner: getComputedStyle(el.querySelector('.slice-loading__mark--spinner')).animationName,
      }));
      expect(motion.entrance).toBe('none');
      expect(motion.spinner).toBe('slice-loading-pulse');
      const out = await t.run((el) => {
         el.stop();
         return {
            overlay: getComputedStyle(el.querySelector('.slice-loading__overlay')).animationName,
            indicator: getComputedStyle(el.querySelector('.slice-loading__indicator')).animationName,
         };
      });
      // Opacity only: the overlay still hands the page over instead of cutting.
      expect(out.overlay).toBe('slice-loading-fade-out');
      expect(out.indicator).toBe('none');
      await expect.poll(() => t.run((el) => el.isConnected)).toBe(false);
   });

   test('sliceConfig.loading sets the defaults, and props win over it', async ({ mount, page }) => {
      const t = await setup(mount, page);
      const { c } = t;
      const result = await t.run(async () => {
         const saved = slice.loadingConfig;
         slice.loadingConfig = { ...(saved || {}), variant: 'dots', label: 'Un momento…', delayMs: 120 };
         try {
            const fromConfig = await slice.build('Loading');
            const fromProps = await slice.build('Loading', { variant: 'spinner' });
            const out = [fromConfig.variant, fromConfig.label, fromConfig.delayMs, fromProps.variant];
            slice.controller.destroyComponent(fromConfig);
            slice.controller.destroyComponent(fromProps);
            return out;
         } finally {
            slice.loadingConfig = saved;
         }
      });
      expect(result).toEqual(['dots', 'Un momento…', 120, 'spinner']);
   });
});

test.describe('Loading — welcome', () => {
   test('the built-in welcome: logo, kicker, title and subtitle on a solid page', async ({ mount, page }) => {
      const t = await setup(mount, page, { welcome: { kicker: 'Welcome to', title: 'Conclave', subtitle: 'Getting your space ready', logo: '/images/favicon.svg', minVisibleMs: 0 } });
      const { c } = t;
      await t.run((el) => el.start(null, { welcome: true }));
      await expect(t.host).toHaveClass(/is-welcome/);
      await expect(t.host).toHaveAttribute('data-backdrop', 'solid');
      await expect(t.$('.slice-loading__kicker')).toHaveText('Welcome to');
      await expect(t.$('.slice-loading__title')).toHaveText('Conclave');
      await expect(t.$('.slice-loading__subtitle')).toHaveText('Getting your space ready');
      await expect(t.$('.slice-loading__brand')).toHaveAttribute('src', '/images/favicon.svg');
      await expect(t.$('.slice-loading__status')).toHaveText('Welcome to Conclave Getting your space ready');
      await stop(t);
   });

   test('welcome: true shows the template as the app wrote it', async ({ mount, page }) => {
      const t = await setup(mount, page, { welcome: true });
      // What an app does in its copy of Loading.html: its own text, no kicker.
      await t.run((el) => {
         el.querySelector('.slice-loading__title').textContent = 'Mi app';
         el.querySelector('.slice-loading__card').insertAdjacentHTML('beforeend', '<p class="extra">Cargando tus tableros</p>');
      });
      await t.run((el) => { el.welcome = { minVisibleMs: 0 }; el.start(null, { welcome: true }); });
      await expect(t.$('.slice-loading__title')).toHaveText('Mi app');
      await expect(t.$('.extra')).toBeVisible();
      await expect(t.$('.slice-loading__kicker')).toBeHidden();
      await expect(t.$('.slice-loading__brand')).toBeHidden();
      await expect(t.$('.slice-loading__status')).toHaveText('Mi app');
      await stop(t);
   });

   test('it fades out, and the next start is the plain indicator', async ({ mount, page }) => {
      const t = await setup(mount, page, { welcome: { title: 'Conclave', minVisibleMs: 0 } });
      const { c } = t;
      await t.run((el) => el.start(null, { welcome: true }));
      await t.run((el) => el.stop());
      await expect(t.host).toHaveClass(/is-leaving/);
      // The card steps back under the fade, not with the page.
      expect(await t.run((el) => [
         getComputedStyle(el.querySelector('.slice-loading__overlay')).animationName,
         getComputedStyle(el.querySelector('.slice-loading__card')).animationName,
      ])).toEqual(['slice-loading-fade-out', 'slice-loading-card-out']);
      await page.waitForTimeout(450);
      expect(await t.run((el) => el.isConnected)).toBe(false);
      await t.run((el) => el.start());
      await expect(t.host).not.toHaveClass(/is-welcome/);
      await expect(t.$('.slice-loading__welcome')).toBeHidden();
      await stop(t);
   });

   test('it stays at least welcome.minVisibleMs', async ({ mount, page }) => {
      const t = await setup(mount, page, { welcome: { title: 'Conclave', minVisibleMs: 500 } });
      const { c } = t;
      await t.run((el) => { el.start(null, { welcome: true }); el.stop(); });
      await page.waitForTimeout(250);
      expect(await t.run((el) => el.active)).toBe(true);
      await page.waitForTimeout(700);
      expect(await t.run((el) => el.active)).toBe(false);
   });

   test('welcome.component: the app\'s own view, destroyed when it ends', async ({ mount, page }) => {
      const t = await setup(mount, page, { welcome: { component: 'Card', props: { title: 'My splash', text: 'Loading your boards' }, minVisibleMs: 0 } });
      const { c } = t;
      await t.run((el) => el.start(null, { welcome: true }));
      await expect(t.$('.slice-loading__welcome-custom slice-card')).toHaveCount(1);
      await expect(t.$('.slice-loading__welcome-custom')).toContainText('My splash');
      await expect(t.$('.slice-loading__card')).toBeHidden();
      const id = await t.$('slice-card').evaluate((el) => el.sliceId);
      await t.run((el) => el.stop());
      await page.waitForTimeout(450);
      expect(await page.evaluate((id) => !!slice.controller.getComponent(id), id)).toBe(false);
   });

   test('welcome: false turns it off even when asked for the first load', async ({ mount, page }) => {
      const t = await setup(mount, page, { welcome: false });
      const { c } = t;
      expect(await t.run((el) => el.welcome)).toBe(null);
      await t.run((el) => el.start(null, { welcome: false }));
      await expect(t.host).not.toHaveClass(/is-welcome/);
      await stop(t);
   });

   test('an explicit welcome during a fade-out rebuilds the overlay as the welcome', async ({ mount, page }) => {
      const t = await setup(mount, page, { welcome: { title: 'Conclave', minVisibleMs: 0 } });
      await t.run((el) => el.start(null, { welcome: false }));
      const shown = await t.run(async (el) => {
         el.stop();
         // Mid-fade, the app asks for the welcome (e.g. after a sign-in).
         await new Promise((resolve) => setTimeout(resolve, 40));
         el.start(null, { welcome: true });
         return {
            welcome: el.classList.contains('is-welcome'),
            leaving: el.classList.contains('is-leaving'),
            connected: el.isConnected,
            title: el.querySelector('.slice-loading__title').textContent,
         };
      });
      expect(shown).toEqual({ welcome: true, leaving: false, connected: true, title: 'Conclave' });
      await expect(t.$('.slice-loading__title')).toBeVisible();
      await stop(t);
   });
});