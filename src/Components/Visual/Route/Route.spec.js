import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Route is a JS-only Visual component (no .html/.css). `slice.build` treats it as
// js-only, so it mounts as an empty <slice-route> element. It does NOT register
// itself in the Router and renders nothing until `render()` / `renderIfCurrentRoute()`
// is called AND the URL path matches. On the /__test harness page the pathname is
// "/__test", so matching is exercised against an explicitly-set path.
//
// We mount with valid props (path + an existing component, "Button") and drive the
// element's own methods via `evaluate` to assert real behaviour. Where behaviour
// depends on browser navigation that the harness cannot perform, we assert the
// realistic outcome (no match -> no render) rather than faking success.

test.describe('Route', () => {
   test('smoke: builds and mounts as an empty slice-route', async ({ mount }) => {
      const c = await mount('Route', { path: '/btn', component: 'Button' });
      await expect(c.component).toBeAttached();
      // Tag is correct and the element starts empty (renders only on match).
      expect(
         await c.component.evaluate((el) => el.tagName.toLowerCase())
      ).toBe('slice-route');
      expect(await c.component.evaluate((el) => el.rendered)).toBe(false);
      expect(c.pageErrors()).toEqual([]);
   });

   test('exposes path and component via props/getters', async ({ mount }) => {
      const c = await mount('Route', { path: '/btn', component: 'Button' });
      expect(await c.component.evaluate((el) => el.path)).toBe('/btn');
      expect(await c.component.evaluate((el) => el.component)).toBe('Button');
   });

   test('matchesCurrentPath: false for a non-matching path', async ({ mount }) => {
      const c = await mount('Route', { path: '/btn', component: 'Button' });
      // On /__test, "/btn" does not match -> { matches: false }.
      const result = await c.component.evaluate((el) => el.matchesCurrentPath());
      expect(result.matches).toBe(false);
   });

   test('matchesCurrentPath: true (incl. dynamic params) when path matches the URL', async ({ mount }) => {
      // Use the harness pathname itself so the static match is true regardless of host.
      const c = await mount('Route', { path: '/__test', component: 'Button' });
      const exact = await c.component.evaluate((el) => el.matchesCurrentPath());
      expect(exact.matches).toBe(true);

      // Dynamic ${param} compilation: a /user/${id} pattern against /user/42.
      const dynamic = await c.component.evaluate((el) => {
         const { regex, paramNames } = el.compilePathPattern('/user/${id}');
         const m = '/user/42'.match(regex);
         return { paramNames, captured: m ? m[1] : null };
      });
      expect(dynamic.paramNames).toEqual(['id']);
      expect(dynamic.captured).toBe('42');
   });

   test('render() mounts the configured component into the route', async ({ mount }) => {
      const c = await mount('Route', { path: '/btn', component: 'Button' });
      // Drive render() directly (does not depend on the URL).
      await c.component.evaluate((el) => el.render());
      // Button mounts inside the route; its inner element appears.
      await expect(c.locator('slice-button')).toBeAttached();
      expect(await c.component.evaluate((el) => el.rendered)).toBe(true);
   });

   test('renderIfCurrentRoute returns false and renders nothing when path does not match', async ({ mount }) => {
      const c = await mount('Route', { path: '/btn', component: 'Button' });
      const matched = await c.component.evaluate((el) => el.renderIfCurrentRoute());
      expect(matched).toBe(false);
      await expect(c.locator('slice-button')).toHaveCount(0);
   });

   test('visual: route after render @visual', async ({ mount }) => {
      const c = await mount('Route', { path: '/btn', component: 'Button' });
      await c.component.evaluate((el) => el.render());
      await expect(c.component).toHaveScreenshot('route-rendered.png');
   });
});
