import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// MultiRoute is a JS-only Visual component (no .html/.css). It mounts as an empty
// <slice-multi-route> and chooses which `routes[].component` to show based on the
// current URL. It does NOT register routes in the Router and renders nothing until
// `render()` / `renderIfCurrentRoute()` is called AND a route path matches. On the
// /__test harness page the pathname is "/__test".
//
// We mount with a valid `routes` array of { path, component, title } pointing at an
// existing component ("Button") and drive the element's own methods via `evaluate`.
// Where behaviour requires real navigation, we assert the realistic no-match outcome.

const ROUTES = [
   { path: '/home', component: 'Button', title: 'Home' },
   { path: '/user/${id}', component: 'Button', title: 'User' },
];

test.describe('MultiRoute', () => {
   test('smoke: builds and mounts as an empty slice-multi-route', async ({ mount }) => {
      const c = await mount('MultiRoute', { routes: ROUTES });
      await expect(c.component).toBeAttached();
      expect(
         await c.component.evaluate((el) => el.tagName.toLowerCase())
      ).toBe('slice-multi-route');
      expect(c.pageErrors()).toEqual([]);
   });

   test('matchRoute: returns the matching route for an exact static path', async ({ mount }) => {
      const c = await mount('MultiRoute', { routes: ROUTES });
      const res = await c.component.evaluate((el) => {
         const { route } = el.matchRoute('/home');
         return route ? route.component : null;
      });
      expect(res).toBe('Button');
   });

   test('matchRoute: extracts params from a dynamic ${id} route', async ({ mount }) => {
      const c = await mount('MultiRoute', { routes: ROUTES });
      const res = await c.component.evaluate((el) => el.matchRoute('/user/99'));
      expect(res.route.component).toBe('Button');
      expect(res.params).toEqual({ id: '99' });
   });

   test('matchRoute: returns null route when nothing matches', async ({ mount }) => {
      const c = await mount('MultiRoute', { routes: ROUTES });
      const res = await c.component.evaluate((el) => {
         const { route } = el.matchRoute('/nope');
         return route;
      });
      expect(res).toBeNull();
   });

   test('renderIfCurrentRoute returns false and renders nothing when no route matches the URL', async ({ mount }) => {
      // On /__test none of ROUTES match.
      const c = await mount('MultiRoute', { routes: ROUTES });
      const matched = await c.component.evaluate((el) => el.renderIfCurrentRoute());
      expect(matched).toBe(false);
      await expect(c.locator('slice-button')).toHaveCount(0);
   });

   test('render() of a matching route mounts the component and dispatches route-rendered', async ({ mount }) => {
      // A placeholder path is aligned to the live URL inside the page context below.
      const c = await mount('MultiRoute', {
         routes: [{ path: '/__placeholder', component: 'Button', title: 'T' }],
      });
      const detail = await c.component.evaluate(async (el) => {
         // Align the route's path with the live URL so render() resolves a match.
         el.props.routes[0].path = window.location.pathname;
         const captured = new Promise((resolve) => {
            el.addEventListener('route-rendered', (e) => resolve(e.detail), { once: true });
         });
         await el.render();
         return captured;
      });
      expect(detail.component).toBe('Button');
      await expect(c.locator('slice-button')).toBeAttached();
   });

   test('invalid routes prop logs an error and does not throw', async ({ mount }) => {
      // init() guards against a missing/invalid routes array.
      const c = await mount('MultiRoute', { routes: null });
      await expect(c.component).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('visual: empty multi-route on non-matching path @visual', async ({ mount }) => {
      const c = await mount('MultiRoute', { routes: ROUTES });
      await expect(c.component).toHaveScreenshot('multiroute-empty.png');
   });
});
