import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// ThemeOverride is NOT a registry component — it is an internal module of the
// Theme Creator page, imported directly. So there is nothing to `slice.build`:
// the spec reaches the class through `window.ThemeOverride` (the same escape
// hatch ToastProvider uses) and drives the shared instance.
//
// The contract worth protecting is the restore path. Applying an override is
// easy; putting the app back exactly as it was — including after a reload — is
// the part that silently goes wrong.

const TOKENS = {
   '--primary-color': '#ff0000',
   '--secondary-color': '#00ff00',
};

/** The value the browser actually resolves for a token right now. */
const resolved = (page, token) =>
   page.evaluate((t) => getComputedStyle(document.documentElement).getPropertyValue(t).trim(), token);

const STORAGE_KEY = 'slice-theme-override';

test.describe('ThemeOverride', () => {
   test('smoke: the shared instance exists and starts clean', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      const page = c.root.page();
      const pageErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      expect(await page.evaluate(() => !!window.ThemeOverride?.shared())).toBe(true);
      expect(await page.evaluate(() => window.ThemeOverride.shared().isApplied)).toBe(false);
      expect(await page.evaluate(() => !!document.getElementById('slice-theme-override'))).toBe(false);
      expect(pageErrors).toEqual([]);
   });

   test('shared() really is one instance', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      const same = await c.root.page().evaluate(() => window.ThemeOverride.shared() === window.ThemeOverride.shared());
      expect(same).toBe(true);
   });

   test('apply() re-themes the whole document, not a subtree', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      const page = c.root.page();
      await page.evaluate((tokens) => window.ThemeOverride.shared().apply(tokens), TOKENS);

      expect(await resolved(page, '--primary-color')).toBe('#ff0000');
      await page.evaluate(() => window.ThemeOverride.shared().clear());
   });

   test('clear() hands the app back to the real theme', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      const page = c.root.page();
      const original = await resolved(page, '--primary-color');

      await page.evaluate((t) => window.ThemeOverride.shared().apply(t), TOKENS);
      expect(await resolved(page, '--primary-color')).toBe('#ff0000');

      await page.evaluate(() => window.ThemeOverride.shared().clear());
      expect(await resolved(page, '--primary-color')).toBe(original);
   });

   test('clear() leaves nothing behind on :root or in storage', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      const page = c.root.page();
      await page.evaluate((t) => window.ThemeOverride.shared().apply(t), TOKENS);

      // The override lives in its own <style>, so :root carries no inline trace
      // of it — otherwise "clear" would have to guess whether an empty inline
      // value meant unset or set-to-empty.
      const inline = await page.evaluate(() =>
         document.documentElement.style.getPropertyValue('--primary-color')
      );
      expect(inline).toBe('');

      await page.evaluate(() => window.ThemeOverride.shared().clear());
      expect(await page.evaluate(() => !!document.getElementById('slice-theme-override'))).toBe(false);
      // A stored override that survived `clear()` would come back on reload.
      expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBe(null);
   });

   test('applying twice then clearing restores the REAL theme, not the first override', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      const page = c.root.page();
      const original = await resolved(page, '--primary-color');

      await page.evaluate(() => window.ThemeOverride.shared().apply({ '--primary-color': '#ff0000' }));
      // Second apply must NOT re-snapshot: if it did, the snapshot would become
      // "#ff0000" and clear() would restore a custom theme instead of LIGHT.
      await page.evaluate(() => window.ThemeOverride.shared().apply({ '--primary-color': '#0000ff' }));
      expect(await resolved(page, '--primary-color')).toBe('#0000ff');

      await page.evaluate(() => window.ThemeOverride.shared().clear());
      expect(await resolved(page, '--primary-color')).toBe(original);
   });

   test('a real theme switch supersedes the override instead of being ignored', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      const page = c.root.page();
      await page.evaluate((t) => window.ThemeOverride.shared().apply(t), TOKENS);

      // This is the exact sequence ThemeSelector performs. Without the override
      // dropping itself the switch would look broken: the icon changes and
      // nothing else does.
      await page.evaluate(async () => {
         await window.slice.setTheme('DARK');
         document.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeName: 'DARK' } }));
      });

      expect(await page.evaluate(() => window.ThemeOverride.shared().isApplied)).toBe(false);
      expect(await resolved(page, '--primary-color')).not.toBe('#ff0000');
      // …and the saved copy goes with it.
      expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBe(null);

      await page.evaluate(async () => {
         await window.slice.setTheme('LIGHT');
         document.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeName: 'LIGHT' } }));
      });
   });

   test('announces its state so any control can react', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      const reasons = await c.root.page().evaluate(async (t) => {
         const seen = [];
         const onEvent = (e) => seen.push(e.detail.reason);
         document.addEventListener('themeoverridechanged', onEvent);
         window.ThemeOverride.shared().apply(t);
         window.ThemeOverride.shared().clear();
         document.removeEventListener('themeoverridechanged', onEvent);
         return seen;
      }, TOKENS);

      expect(reasons).toEqual(['applied', 'cleared']);
   });

   test('ignores entries that are not usable custom properties', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      const page = c.root.page();
      await page.evaluate(() =>
         window.ThemeOverride.shared().apply({
            color: 'red', // not a custom property
            '--empty': '', // no value
            '--ok': '#123456',
         })
      );

      expect(await page.evaluate(() => window.ThemeOverride.shared().current)).toEqual({ '--ok': '#123456' });
      await page.evaluate(() => window.ThemeOverride.shared().clear());
   });

   test('persists so the theme survives a reload', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      const page = c.root.page();
      await page.evaluate((t) => window.ThemeOverride.shared().apply(t), TOKENS);

      const stored = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
      expect(stored).not.toBe(null);
      expect(JSON.parse(stored).values['--primary-color']).toBe('#ff0000');

      // Simulate the reload: drop the in-memory override and the <style>, keep
      // only what localStorage holds — which is all a reload would keep.
      await page.evaluate((k) => {
         localStorage.setItem(k, localStorage.getItem(k));
         document.getElementById('slice-theme-override')?.remove();
         window.ThemeOverride._shared = null;
      }, STORAGE_KEY);

      expect(await resolved(page, '--primary-color')).not.toBe('#ff0000');

      const restored = await page.evaluate(() => window.ThemeOverride.shared().restore());
      expect(restored).toBe(true);
      expect(await resolved(page, '--primary-color')).toBe('#ff0000');

      await page.evaluate(() => window.ThemeOverride.shared().clear());
   });

   test('a real reload keeps the applied theme', async ({ mount }) => {
      // The point of persisting at all. `mountHtml` navigates to /__test, but a
      // reload is only faithful on the real route, and the restore lives in the
      // App shell (App.js) — so this drives `/` for real.
      const first = await mount('ThemeCreator');
      const page = first.root.page();
      await page.evaluate(() => window.ThemeOverride.shared().apply({ '--primary-color': '#ff00ff' }));

      await page.goto('/');
      await page.waitForFunction(() => !!window.slice?.router, null, { timeout: 30_000 });
      await expect(page.locator('slice-app')).toBeVisible();

      expect(await resolved(page, '--primary-color')).toBe('#ff00ff');

      await page.evaluate(() => window.ThemeOverride.shared().clear());
   });

   test('a corrupt stored override is dropped instead of throwing on boot', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      const page = c.root.page();

      await page.evaluate((k) => localStorage.setItem(k, '{not json'), STORAGE_KEY);
      expect(await page.evaluate(() => window.ThemeOverride.shared().restore())).toBe(false);
      expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBe(null);

      await page.evaluate((k) => localStorage.setItem(k, '{"values": "nope"}'), STORAGE_KEY);
      expect(await page.evaluate(() => window.ThemeOverride.shared().restore())).toBe(false);
      expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBe(null);
   });

   test('survives the page that applied it being destroyed', async ({ mount }) => {
      // The whole reason this is a shared module-level instance and not a field
      // on the page: the override must outlive the component that applied it.
      const c = await mount('ThemeCreator');
      const page = c.root.page();

      await page.evaluate(async (tokens) => {
         const picker = await window.slice.build('ColorPicker', { label: 'x', value: '#ff0000' });
         document.querySelector('[data-test-root]').appendChild(picker);
         window.ThemeOverride.shared().apply(tokens);
         window.slice.controller.destroyComponent(picker);
      }, TOKENS);

      expect(await resolved(page, '--primary-color')).toBe('#ff0000');
      await page.evaluate(() => window.ThemeOverride.shared().clear());
   });
});