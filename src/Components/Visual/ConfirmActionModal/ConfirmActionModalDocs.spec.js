import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// The bug this guards: the demo called
//   slice.build('ConfirmDialog', { singleton: true })
// and `singleton` is only honoured for components registered as "Service", so
// build() returned null and every button threw
// "TypeError: confirm.ask is not a function".
//
// It drives the real docs page and clicks the real buttons, because the bug
// only exists in the page's live previews, not in the component's own spec.
test('the ConfirmActionModal docs page runs its demos without page errors', async ({ page }) => {
   const errors = [];
   page.on('pageerror', (e) => errors.push(String(e.message ?? e)));
   page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const text = m.text();
      // The docs shell loads cloudflareinsights.com/cdn-cgi/rum, which is
      // blocked in a sandbox. Unrelated to anything on this page.
      if (text.includes('cloudflareinsights.com')) return;
      // The console text for a blocked resource carries no URL, so same-origin
      // resource failures are checked in requestfailed below instead.
      if (text.includes('Failed to load resource')) return;
      errors.push(text);
   });

   // Same-origin resource failures are ours; third-party ones are not.
   page.on('requestfailed', (r) => {
      if (!/(127\.0\.0\.1|localhost)/.test(r.url())) return;
      errors.push(`requestfailed ${r.url()} (${r.failure()?.errorText})`);
   });

   await page.goto('/docs/display/confirm-action-modal');
   await page.waitForFunction(() => !!(window.slice && window.slice.router), null, { timeout: 30_000 });
   // The live previews are built after the code blocks render.
   await page.waitForTimeout(1500);

   const read = () =>
      page.evaluate(() => {
         const out = {};
         for (const id of ['demo-confirm', 'demo-confirm-evt']) {
            const m = slice.getComponent(id);
            out[id] = m ? { isOpen: m.isOpen, title: m.$modal?.title ?? null } : null;
         }
         return out;
      });

   const initial = await read();
   expect(initial['demo-confirm'], 'demo-confirm was not registered').not.toBeNull();
   expect(initial['demo-confirm-evt'], 'demo-confirm-evt was not registered').not.toBeNull();
   expect(initial['demo-confirm'].isOpen).toBe(false);

   // Ask / prompt, from the promise demo. One click at a time, asserted as we
   // go: clicking both would just make the second replace the first, which is
   // correct behaviour but says nothing.
   await page.locator('slice-button', { hasText: 'Delete the report' }).first().click({ force: true });
   await page.waitForTimeout(350);
   expect((await read())['demo-confirm']).toMatchObject({
      isOpen: true,
      title: 'Delete “Quarterly report”?',
   });

   await page.locator('slice-button', { hasText: 'Rename instead' }).first().click({ force: true });
   await page.waitForTimeout(350);
   expect((await read())['demo-confirm']).toMatchObject({
      isOpen: true,
      title: 'Rename report',
   });

   // The event demo. Its own modal, its own channel: opening it must leave
   // the promise demo's dialog showing ITS question. If both instances shared
   // the default channel, the second emit would overwrite this title.
   await page.locator('slice-button', { hasText: 'Emit a question' }).first().click({ force: true });
   await page.waitForTimeout(400);

   const afterEmit = await read();
   expect(afterEmit['demo-confirm-evt']).toMatchObject({
      isOpen: true,
      title: 'Discard 3 unsent responses?',
   });
   expect(afterEmit['demo-confirm'].title).toBe('Rename report');

   // The prompt variant over the same channel.
   await page.locator('slice-button', { hasText: 'Emit a prompt' }).first().click({ force: true });
   await page.waitForTimeout(400);
   expect((await read())['demo-confirm-evt']).toMatchObject({
      isOpen: true,
      title: 'Your name',
   });

   expect(errors, `page errors:\n${errors.join('\n')}`).toEqual([]);
});