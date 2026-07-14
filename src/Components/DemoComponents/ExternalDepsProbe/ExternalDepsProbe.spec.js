import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// E2E validation of the external-dependencies feature (bare imports from
// node_modules) running in a REAL browser via `slice dev`. The fixture component
// imports dayjs (default / CommonJS interop) and marked (named / ESM). The dev
// server rewrites those bare specifiers to /@slice-modules/… and serves each
// package pre-bundled with esbuild. If these pass, npm packages really work
// inside a Slice component in the browser.

test.describe('external dependencies (bare imports)', () => {
   test('dayjs (default import) formats a date in the browser', async ({ mount }) => {
      const c = await mount('ExternalDepsProbe', { date: '2020-01-15' });
      await expect(c.locator('.edp-date')).toHaveText('2020/01/15');
      expect(c.pageErrors()).toEqual([]);
   });

   test('marked (named import) renders markdown to HTML', async ({ mount }) => {
      const c = await mount('ExternalDepsProbe', { markdown: '# Hello **world**' });
      await expect(c.locator('.edp-md h1')).toContainText('Hello');
      await expect(c.locator('.edp-md strong')).toHaveText('world');
   });

   test('both packages resolve to callable exports', async ({ mount }) => {
      const c = await mount('ExternalDepsProbe');
      await expect(c.locator('.edp-status')).toHaveText('ok');
      await expect(c.locator('.edp-status')).toHaveAttribute('data-dayjs', 'function');
      await expect(c.locator('.edp-status')).toHaveAttribute('data-marked', 'function');
   });

   test('the dev server rewrites bare imports and serves the pre-bundled package', async ({ request }) => {
      // The served component module has its bare specifiers rewritten.
      const moduleRes = await request.get(
         '/Components/DemoComponents/ExternalDepsProbe/ExternalDepsProbe.js'
      );
      expect(moduleRes.status()).toBe(200);
      const src = await moduleRes.text();
      expect(src).toContain('/@slice-modules/dayjs');
      expect(src).toContain('/@slice-modules/marked');
      expect(src).not.toContain("from 'dayjs'");

      // The virtual endpoint returns a self-contained ESM bundle of the package.
      const dayjsRes = await request.get('/@slice-modules/dayjs');
      expect(dayjsRes.status()).toBe(200);
      expect(dayjsRes.headers()['content-type']).toContain('javascript');
      const bundled = await dayjsRes.text();
      expect(bundled).toMatch(/export\s*\{|export default/);
   });
});
