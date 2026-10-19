import { test, expect } from '@playwright/test';

// Validates the leak FIX in real components: rebuilding a component's slice.build'd
// children (Card actions) must DESTROY the old instances, not orphan them. Scoped to
// the card's own button sliceIds so concurrent app mounting at '/' can't pollute the
// signal. Without destroyByContainer, the old buttons would survive in activeComponents.

test.describe('leak cleanup: rebuilding children destroys the old instances', () => {
   // No retries, deliberately.
   //
   // This file used to carry `retries: 2` with the note "the leak assertions
   // are deterministic" — which is exactly right, and is why the flake survived
   // so long as "known flaky under parallel load". It was never the assertions:
   // the readiness gate below waited on `slice.controller`, which exists from
   // the Slice CONSTRUCTOR, while `slice.logger` is only assigned later in the
   // async init (after it awaits the Logger module over the network). The test
   // could therefore build a Card while `slice.logger` was still undefined, and
   // the first thing that logged threw "Cannot read properties of undefined
   // (reading 'logError')" — a failure that looks nothing like a leak.
   //
   // Under parallel load that fetch simply takes longer, which is why it only
   // showed up sometimes. The fix is the gate, not a retry: if this file goes
   // flaky again, something in startup regressed and should be loud.

   test.beforeEach(async ({ page }) => {
      await page.goto('/');
      // `slice.router` is the LAST thing init() assigns — the same readiness
      // signal the shared harness uses — so it also implies `slice.logger` and
      // the theme/styles managers are in place.
      await page.waitForFunction(() => !!window.slice?.router, null, { timeout: 30_000 });
      await page.waitForFunction(
         () => !!window.slice?.logger && typeof window.slice.logger.logError === 'function',
         null,
         { timeout: 30_000 }
      );
   });

   test('Card.setupActions destroys the previous action buttons on rebuild', async ({ page }) => {
      const survivors = await page.evaluate(async () => {
         // Poll until the card has at least `n` built buttons (setupActions is async).
         const waitButtons = async (card, n) => {
            for (let i = 0; i < 240; i++) {
               const ids = [...card.querySelectorAll('slice-button')].map((b) => b.sliceId).filter(Boolean);
               if (ids.length >= n) return ids;
               await new Promise((res) => setTimeout(res, 25));
            }
            return [...card.querySelectorAll('slice-button')].map((b) => b.sliceId).filter(Boolean);
         };

         const card = await window.slice.build('Card', {
            title: 'Leak probe',
            actions: [{ text: 'A' }, { text: 'B' }],
         });
         document.body.appendChild(card);
         const oldButtonIds = await waitButtons(card, 2);

         window.slice.setComponentProps(card, { actions: [{ text: 'C' }, { text: 'D' }, { text: 'E' }] });
         await waitButtons(card, 3); // let the rebuild settle

         // The old buttons must no longer be registered (destroyByContainer ran).
         const stillRegistered = oldButtonIds.filter((id) => window.slice.controller.activeComponents.has(id));

         window.slice.controller.destroyComponent(card);
         return { oldCount: oldButtonIds.length, stillRegistered };
      });

      expect(survivors.oldCount).toBeGreaterThan(0);   // we actually had buttons to leak
      expect(survivors.stillRegistered).toEqual([]);   // none leaked
   });

   test('destroying the Card cascades to its action buttons', async ({ page }) => {
      const result = await page.evaluate(async () => {
         const waitButtons = async (card, n) => {
            for (let i = 0; i < 240; i++) {
               const ids = [...card.querySelectorAll('slice-button')].map((b) => b.sliceId).filter(Boolean);
               if (ids.length >= n) return ids;
               await new Promise((res) => setTimeout(res, 25));
            }
            return [...card.querySelectorAll('slice-button')].map((b) => b.sliceId).filter(Boolean);
         };

         const card = await window.slice.build('Card', { title: 'X', actions: [{ text: 'A' }, { text: 'B' }] });
         document.body.appendChild(card);
         const buttonIds = await waitButtons(card, 2);
         window.slice.controller.destroyComponent(card);
         const survivors = buttonIds.filter((id) => window.slice.controller.activeComponents.has(id));
         return { count: buttonIds.length, survivors };
      });
      expect(result.count).toBeGreaterThan(0);
      expect(result.survivors).toEqual([]);
   });
});
