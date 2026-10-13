import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Two bugs this guards, both of which shipped because the old version of this
// spec asserted the component's JS flag instead of what is on screen:
//
//  1. The demo built the modal and never appended it, so `showModal()` on the
//     detached <dialog> was a silent no-op. `isOpen` and `title` were both
//     correct while nothing appeared on screen.
//  2. The scenario demos were not rendered at all, because four :::warning
//     blocks were left unterminated and nested into each other.
//
// So every assertion below is about the real DOM: `dialog[open]`, and how many
// are open at once.
test('the ConfirmActionModal docs page runs its demos and really opens the dialog', async ({ page }) => {
   const errors = [];
   page.on('pageerror', (e) => errors.push(String(e.message ?? e)));
   page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const text = m.text();
      // The docs shell loads cloudflareinsights.com/cdn-cgi/rum, blocked here.
      if (text.includes('cloudflareinsights.com')) return;
      // A blocked resource logs with no URL; same-origin ones are checked in
      // requestfailed below instead.
      if (text.includes('Failed to load resource')) return;
      errors.push(text);
   });
   page.on('requestfailed', (r) => {
      if (!/(127\.0\.0\.1|localhost)/.test(r.url())) return;
      errors.push(`requestfailed ${r.url()} (${r.failure()?.errorText})`);
   });

   await page.goto('/docs/display/confirm-action-modal');
   await page.waitForFunction(() => !!(window.slice && window.slice.router), null, { timeout: 30_000 });

   // The live previews mount on scroll, so they do not exist until the page has
   // actually been scrolled. Without this every locator finds nothing and the
   // spec silently asserts against an empty page.
   await page.evaluate(async () => {
      const step = Math.floor(window.innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
         window.scrollTo(0, y);
         await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 600));
   });
   await page.waitForTimeout(800);

   const read = () =>
      page.evaluate(() => {
         const out = {};
         for (const id of ['demo-confirm', 'demo-confirm-evt']) {
            const m = slice.getComponent(id);
            out[id] = m
               ? {
                    connected: m.isConnected,
                    isOpen: m.isOpen,
                    title: m.$modal?.title ?? null,
                    nativeOpen: m.$modal?.querySelector('dialog')?.open ?? false,
                 }
               : null;
         }
         out.openDialogs = document.querySelectorAll('dialog[open]').length;
         return out;
      });

   // Answer the dialog that is on screen. An open <dialog> lives in the top
   // layer and swallows clicks aimed at anything underneath it, so the demo
   // buttons cannot be clicked while a question is unanswered.
   const answer = async (label = 'Cancel') => {
      const btn = page.locator('dialog[open] slice-button', { hasText: label }).first();
      await btn.waitFor({ state: 'visible', timeout: 10_000 });
      await btn.click({ force: true });
      await page.waitForFunction(() => document.querySelectorAll('dialog[open]').length === 0, null, {
         timeout: 10_000,
      });
   };

   const initial = await read();
   expect(initial['demo-confirm'], 'demo-confirm was not registered').not.toBeNull();
   expect(initial['demo-confirm-evt'], 'demo-confirm-evt was not registered').not.toBeNull();
   // The component has to be in the document, or its Modal cannot open.
   expect(initial['demo-confirm'].connected).toBe(true);
   expect(initial['demo-confirm-evt'].connected).toBe(true);
   expect(initial.openDialogs).toBe(0);

   // --- the promise demo -------------------------------------------------
   await page.locator('slice-button', { hasText: 'Delete the report' }).first().click({ force: true });
   await page.waitForFunction(() => document.querySelectorAll('dialog[open]').length === 1, null, {
      timeout: 10_000,
   });

   const afterAsk = await read();
   expect(afterAsk['demo-confirm']).toMatchObject({
      connected: true,
      isOpen: true,
      title: 'Delete “Quarterly report”?',
      nativeOpen: true,
   });
   expect(afterAsk.openDialogs).toBe(1);

   await answer();
   expect((await read())['demo-confirm'].nativeOpen).toBe(false);

   // The prompt half of the same demo.
   await page.locator('slice-button', { hasText: 'Rename instead' }).first().click({ force: true });
   await page.waitForFunction(() => document.querySelectorAll('dialog[open]').length === 1, null, {
      timeout: 10_000,
   });

   const afterPrompt = await read();
   expect(afterPrompt['demo-confirm']).toMatchObject({
      isOpen: true,
      title: 'Rename report',
      nativeOpen: true,
   });
   // A prompt shows its field; an ask does not.
   expect(
      await page.locator('dialog[open] .slice_confirm_action_modal__field:not([hidden])').count()
   ).toBe(1);

   await answer();

   // --- the event-manager demo -------------------------------------------
   await page.locator('slice-button', { hasText: 'Emit a question' }).first().click({ force: true });
   await page.waitForFunction(() => document.querySelectorAll('dialog[open]').length === 1, null, {
      timeout: 10_000,
   });

   const afterEmit = await read();
   expect(afterEmit['demo-confirm-evt']).toMatchObject({
      connected: true,
      isOpen: true,
      title: 'Discard 3 unsent responses?',
      nativeOpen: true,
   });
   // One question, ONE dialog. The promise demo's modal is on the same page
   // and a different channel, so it must not have answered this emit.
   expect(afterEmit.openDialogs).toBe(1);
   expect(afterEmit['demo-confirm'].title).toBe('Rename report');

   await answer();

   // The prompt variant over the same channel.
   await page.locator('slice-button', { hasText: 'Emit a prompt' }).first().click({ force: true });
   await page.waitForFunction(() => document.querySelectorAll('dialog[open]').length === 1, null, {
      timeout: 10_000,
   });
   const afterEmitPrompt = await read();
   expect(afterEmitPrompt['demo-confirm-evt']).toMatchObject({
      isOpen: true,
      title: 'Your name',
      nativeOpen: true,
   });

   await answer();
   expect((await read()).openDialogs).toBe(0);

   expect(errors, `page errors:\n${errors.join('\n')}`).toEqual([]);
});