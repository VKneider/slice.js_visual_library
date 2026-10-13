import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// E2E for a real, popular npm frontend library (GSAP) imported with a bare
// import and used inside a Slice component, running in a REAL browser via
// `slice dev`. The dev server resolves `gsap` from node_modules on demand.

test.describe('GSAP demo (real npm animation library)', () => {
   test('gsap loads and the mount animation reaches its end state', async ({ mount }) => {
      const c = await mount('GsapDemo', { bars: 3, duration: 0.2 });
      const root = c.locator('.gsap-demo');

      // gsap resolved to a real object exposing its API.
      await expect(root).toHaveAttribute('data-gsap-type', 'function');
      // The tween runs to completion and marks the root.
      await expect(root).toHaveAttribute('data-gsap', 'done');
      // Bars ended visible (opacity animated 0 → 1).
      await expect(c.locator('.gsap-demo__bar').first()).toHaveCSS('opacity', '1');

      expect(c.pageErrors()).toEqual([]);
   });

   test('the served component module has its gsap import rewritten and served', async ({ request }) => {
      const mod = await request.get('/Components/DemoComponents/GsapDemo/GsapDemo.js');
      expect(mod.status()).toBe(200);
      const src = await mod.text();
      expect(src).toContain('/@slice-modules/gsap');
      expect(src).not.toContain("from 'gsap'");

      const bundle = await request.get('/@slice-modules/gsap');
      expect(bundle.status()).toBe(200);
      expect(bundle.headers()['content-type']).toContain('javascript');
   });

   // The visible demo view: /playground builds the GSAP demo for real.
   //
   // It builds THREE of them on purpose - "Entrance (on mount)" with the
   // default 3 bars, "fast" with 6, and "big" with 12 - so a bare
   // `.gsap-demo` locator is a strict-mode violation. Asserting against all
   // three is also more useful than asserting against the first: it checks the
   // props actually reach the demo, and it would catch one of them failing to
   // animate.
   test('the /playground view renders the GSAP demo and it animates', async ({ page }) => {
      await page.goto('/playground');

      const roots = page.locator('.gsap-demo');
      await expect(roots).toHaveCount(3, { timeout: 15_000 });

      const counts = [3, 6, 12];
      for (let i = 0; i < counts.length; i++) {
         const root = roots.nth(i);

         // gsap resolved to a real object exposing its API.
         await expect(root).toHaveAttribute('data-gsap-type', 'function', { timeout: 15_000 });
         // The tween runs to completion and marks the root.
         await expect(root).toHaveAttribute('data-gsap', 'done', { timeout: 15_000 });
         // Each demo has the number of bars its card advertises.
         await expect(root.locator('.gsap-demo__bar')).toHaveCount(counts[i]);
         // Bars ended visible (opacity animated 0 -> 1).
         await expect(root.locator('.gsap-demo__bar').first()).toHaveCSS('opacity', '1');
      }
   });
});
