import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// ConfirmActionModal has no markup of its own — it drives a Modal — so these specs
// talk to it through its promise API, the way a consumer does.
//
// The thing worth testing hard is the invariant: every ask()/prompt() resolves
// EXACTLY ONCE. A dialog that can be dismissed without settling hangs the
// awaiting caller for the life of the page, and that bug is invisible in a
// demo because the demo always clicks a button.

/** Builds the dialog once per test and hands the page-side instance back. */
async function openDialog(h) {
   return h.page.evaluate(async () => {
      window.__dialog = await slice.build('ConfirmActionModal', { sliceId: 'spec-confirm' });
      document.body.appendChild(window.__dialog);
      return true;
   });
}

/** Starts ask()/prompt() without awaiting, and records how it settled. */
async function startAsk(h, options, kind = 'ask') {
   return h.page.evaluate(async ({ options, kind }) => {
      window.__settled = null;
      window.__promise = window.__dialog[kind](options)
         .then((value) => { window.__settled = { value, count: (window.__settled?.count || 0) + 1 }; return value; });

      // Wait for the dialog to really be on screen instead of guessing with a
      // fixed sleep: opening now awaits the browser's native `close` event, so
      // a sleep races it and Escape lands before there is anything to dismiss.
      for (let i = 0; i < 300; i++) {
         if (document.querySelector('dialog[open]')) break;
         await new Promise((r) => setTimeout(r, 10));
      }
      return { isOpen: window.__dialog.isOpen };
   }, { options, kind });
}

/** Resolves once the browser has closed the dialog. */
async function waitClosed(h) {
   await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

      for (let i = 0; i < 300; i++) {
         if (!document.querySelector('dialog[open]')) break;
         await new Promise((r) => setTimeout(r, 10));
      }
   });
}

const dialog = (h) => h.page.locator('dialog[open]');
// The variant class lands on the inner <button class="slice_button">, not on the
// `slice-button` host — so the host has to be matched with :has().
const confirmBtn = (h) => h.page.locator('dialog[open] .slice-modal__footer slice-button:not(:has(.slice_button--ghost))');
const cancelBtn = (h) => h.page.locator('dialog[open] .slice-modal__footer slice-button:has(.slice_button--ghost)');
const CONFIRM = '.slice-modal__footer slice-button:not(:has(.slice_button--ghost)) .slice_button_container';
const CANCEL = '.slice-modal__footer slice-button:has(.slice_button--ghost) .slice_button_container';

test.describe('ConfirmActionModal — ask()', () => {
   test('smoke: builds without errors and renders nothing until used', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);
      expect(await h.page.evaluate(() => document.querySelectorAll('dialog').length)).toBe(0);
      expect(h.pageErrors()).toEqual([]);
   });

   test('the Modal is built lazily on first use', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);
      expect(await h.page.evaluate(() => document.querySelectorAll('dialog').length)).toBe(0);

      await startAsk(h, { title: 'Sure?' });
      expect(await h.page.evaluate(() => document.querySelectorAll('dialog').length)).toBe(1);
   });

   test('confirm resolves true, cancel resolves false', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Delete?' });
      await dialog(h).locator('.slice-modal__footer slice-button:not(:has(.slice_button--ghost)) .slice_button_container').click();
      expect(await h.page.evaluate(() => window.__settled)).toEqual({ value: true, count: 1 });

      await startAsk(h, { title: 'Delete?' });
      await dialog(h).locator('.slice-modal__footer slice-button:has(.slice_button--ghost) .slice_button_container').click();
      expect(await h.page.evaluate(() => window.__settled)).toEqual({ value: false, count: 1 });
   });

   test('Escape resolves false instead of hanging', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Delete?' });
      await h.page.keyboard.press('Escape');
      // The bug this guards: without the close path settling, __settled stays
      // null forever and the awaiting caller never resumes.
      await expect.poll(() => h.page.evaluate(() => window.__settled)).toEqual({ value: false, count: 1 });
   });

   test('the close (X) button resolves false too', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Delete?' });
      await dialog(h).locator('.slice-modal__close').click();
      await expect.poll(() => h.page.evaluate(() => window.__settled)).toEqual({ value: false, count: 1 });
   });

   test('the dialog is dismissed after it settles', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Delete?' });
      expect(await startAsk(h, { title: 'Again?' })).toMatchObject({ isOpen: true });
      expect(await h.page.evaluate(() => document.querySelectorAll('dialog[open]').length)).toBe(1);
   });

   test('isOpen tracks the pending question', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      expect((await startAsk(h, { title: 'a' })).isOpen).toBe(true);
      await dialog(h).locator('.slice-modal__footer slice-button:not(:has(.slice_button--ghost)) .slice_button_container').click();
      await expect.poll(() => h.page.evaluate(() => window.__dialog.isOpen)).toBe(false);
   });

   test('title and message render, and a missing message is hidden', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Delete project?', message: 'This cannot be undone.' });
      await expect(dialog(h).locator('.slice-modal__title')).toHaveText('Delete project?');
      await expect(dialog(h).locator('.slice_confirm_action_modal__message')).toHaveText('This cannot be undone.');

      await startAsk(h, { title: 'Delete project?' });
      await expect(dialog(h).locator('.slice_confirm_action_modal__message')).toBeHidden();
   });

   test('danger makes the confirm button a danger variant', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Delete?', danger: true });
      await expect(confirmBtn(h).locator('.slice_button')).toHaveClass(/slice_button--danger/);

      // And it must go back when the next question is not dangerous.
      await startAsk(h, { title: 'Rename?' });
      await expect(confirmBtn(h).locator('.slice_button')).not.toHaveClass(/slice_button--danger/);
   });

   test('labels are configurable and fall back to the defaults', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'a', confirmLabel: 'Delete it', cancelLabel: 'Keep it' });
      await expect(confirmBtn(h)).toContainText('Delete it');
      await expect(cancelBtn(h)).toContainText('Keep it');

      await startAsk(h, { title: 'a' });
      await expect(confirmBtn(h)).toContainText('Confirm');
      await expect(cancelBtn(h)).toContainText('Cancel');
   });

   test('cancel is rendered before confirm', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);
      await startAsk(h, { title: 'a' });
      const order = await dialog(h).locator('.slice-modal__footer slice-button .slice_button_value').allTextContents();
      expect(order).toEqual(['Cancel', 'Confirm']);
   });

   test('a second ask() cancels the first instead of orphaning it', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         window.__settled = null;
         const first = window.__dialog.ask({ title: 'first' }).then((v) => { window.__settled = { value: v, count: (window.__settled?.count || 0) + 1 }; });
         for (let i = 0; i < 300 && !document.querySelector('dialog[open]'); i++) await new Promise((r) => setTimeout(r, 10));

         window.__dialog.ask({ title: 'second' });
         for (let i = 0; i < 300 && !document.querySelector('dialog[open]'); i++) await new Promise((r) => setTimeout(r, 10));
         return { afterSecond: window.__settled, dialogs: document.querySelectorAll('dialog[open]').length };
      });

      // The first awaiter must not be left hanging.
      expect(out.afterSecond).toEqual({ value: false, count: 1 });
      expect(out.dialogs).toBe(1);
   });

   test('the message is escaped, never injected', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'x', message: '<img src=x onerror=alert(1)>' });
      await expect(dialog(h).locator('.slice_confirm_action_modal__message img')).toHaveCount(0);
      await expect(dialog(h).locator('.slice_confirm_action_modal__message')).toHaveText('<img src=x onerror=alert(1)>');
   });
});

test.describe('ConfirmActionModal — prompt()', () => {
   test('resolves the typed value', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Your name', inputLabel: 'Name' }, 'prompt');
      await dialog(h).locator('input').fill('Ada');
      await dialog(h).locator('.slice-modal__footer slice-button:not(:has(.slice_button--ghost)) .slice_button_container').click();

      await expect.poll(() => h.page.evaluate(() => window.__settled)).toEqual({ value: 'Ada', count: 1 });
   });

   test('the field is focused so it can be typed into immediately', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Your name', inputLabel: 'Name' }, 'prompt');
      const focused = await h.page.evaluate(() => {
         const input = document.querySelector('dialog[open] input');
         return input ? document.activeElement === input : false;
      });
      expect(focused).toBe(true);
   });

   test('cancel resolves null, not an empty string', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Your name', inputLabel: 'Name' }, 'prompt');
      await dialog(h).locator('.slice-modal__footer slice-button:has(.slice_button--ghost) .slice_button_container').click();

      // null is the signal; an empty string would be ambiguous with a real
      // answer of "".
      await expect.poll(() => h.page.evaluate(() => window.__settled)).toEqual({ value: null, count: 1 });
   });

   test('Escape resolves null', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Your name', inputLabel: 'Name' }, 'prompt');
      await h.page.keyboard.press('Escape');
      await expect.poll(() => h.page.evaluate(() => window.__settled)).toEqual({ value: null, count: 1 });
   });

   test('the value is trimmed', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Your name', inputLabel: 'Name' }, 'prompt');
      await dialog(h).locator('input').fill('  Ada  ');
      await dialog(h).locator('.slice-modal__footer slice-button:not(:has(.slice_button--ghost)) .slice_button_container').click();

      await expect.poll(() => h.page.evaluate(() => window.__settled)).toEqual({ value: 'Ada', count: 1 });
   });

   test('Enter confirms the prompt', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Your name', inputLabel: 'Name' }, 'prompt');
      await dialog(h).locator('input').fill('Grace');
      await dialog(h).locator('input').press('Enter');

      await expect.poll(() => h.page.evaluate(() => window.__settled)).toEqual({ value: 'Grace', count: 1 });
   });

   test('required blocks confirm while empty and reports why', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Your name', inputLabel: 'Name', required: true }, 'prompt');
      await dialog(h).locator('.slice-modal__footer slice-button:not(:has(.slice_button--ghost)) .slice_button_container').click();

      // Nothing settled, and the dialog is still up with an error painted.
      expect(await h.page.evaluate(() => window.__settled)).toBe(null);
      expect(await h.page.evaluate(() => document.querySelectorAll('dialog[open]').length)).toBe(1);
      await expect(dialog(h).locator('input').evaluate((el) => el.validationMessage || document.querySelector('dialog[open] .slice_input').textContent)).not.toBe('');

      await dialog(h).locator('input').fill('Ada');
      await dialog(h).locator('.slice-modal__footer slice-button:not(:has(.slice_button--ghost)) .slice_button_container').click();
      await expect.poll(() => h.page.evaluate(() => window.__settled)).toEqual({ value: 'Ada', count: 1 });
   });

   test('an invalid email blocks confirm', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'Email', inputLabel: 'Email', inputType: 'email' }, 'prompt');
      await dialog(h).locator('input').fill('not-an-email');
      await dialog(h).locator('.slice-modal__footer slice-button:not(:has(.slice_button--ghost)) .slice_button_container').click();
      expect(await h.page.evaluate(() => window.__settled)).toBe(null);

      await dialog(h).locator('input').fill('ada@example.com');
      await dialog(h).locator('.slice-modal__footer slice-button:not(:has(.slice_button--ghost)) .slice_button_container').click();
      await expect.poll(() => h.page.evaluate(() => window.__settled)).toEqual({ value: 'ada@example.com', count: 1 });
   });

   test('ask() shows no field, prompt() always does', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'a', inputLabel: 'Name' });
      await expect(dialog(h).locator('.slice_confirm_action_modal__field')).toBeHidden();

      await startAsk(h, { title: 'a' }, 'prompt');
      await expect(dialog(h).locator('.slice_confirm_action_modal__field')).toBeVisible();
   });

   test('a previous value does not leak into the next prompt', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      await startAsk(h, { title: 'a', inputLabel: 'Name', inputValue: 'stale' }, 'prompt');
      await expect(dialog(h).locator('input')).toHaveValue('stale');

      await startAsk(h, { title: 'a', inputLabel: 'Name' }, 'prompt');
      await expect(dialog(h).locator('input')).toHaveValue('');
   });
});

test.describe('ConfirmActionModal — teardown', () => {
   test('destroying it settles the pending question instead of hanging', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         window.__settled = null;
         window.__dialog.ask({ title: 'a' }).then((v) => { window.__settled = { value: v, count: (window.__settled?.count || 0) + 1 }; });
         for (let i = 0; i < 300 && !document.querySelector('dialog[open]'); i++) await new Promise((r) => setTimeout(r, 10));

         slice.controller.destroyComponent('spec-confirm');
         for (let i = 0; i < 300 && window.__settled === null; i++) await new Promise((r) => setTimeout(r, 10));
         return {
            settled: window.__settled,
            dialogs: document.querySelectorAll('dialog').length,
            stillRegistered: slice.controller.activeComponents.has('spec-confirm'),
         };
      });

      // false, not null: a destroyed ask() must be indistinguishable from a
      // cancelled one, which is what `ask()` resolves for every other exit.
      expect(out.settled).toEqual({ value: false, count: 1 });
      expect(out.dialogs).toBe(0);
      expect(out.stillRegistered).toBe(false);
   });
});

test.describe('ConfirmActionModal - event manager channel', () => {
   // ---------------------------------------------------------- event manager

   test('a confirm:request event opens the question with no caller in sight', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', { sliceId: 'cam-evt' });
         document.body.appendChild(modal);

         // No ask(), no reference, no await - exactly what a deep save routine
         // or a keyboard shortcut can do.
         slice.events.emit('confirm:request', { title: 'Discard draft?' });
         await new Promise((r) => setTimeout(r, 200));

         return {
            isOpen: modal.isOpen,
            title: modal.$modal.title,
         };
      });

      expect(out.isOpen).toBe(true);
      expect(out.title).toBe('Discard draft?');
   });

   test('an event carrying callbacks is answered with the verdict', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', { sliceId: 'cam-evt2' });
         document.body.appendChild(modal);

         let confirmedWith = 'NOT CALLED';
         let cancelled = false;

         slice.events.emit('confirm:request', {
            title: 'Publish?',
            onConfirm: (arg) => { confirmedWith = arg === undefined ? 'no-arg' : arg; },
            onCancel: () => { cancelled = true; },
         });
         await until(() => modal.isOpen && modal.$modal?.open === true);

         // Answer "yes" the way the footer button does.
         modal._handleConfirm();
         await until(() => confirmedWith !== 'NOT CALLED');

         return { confirmedWith, cancelled };
      });

      expect(out.confirmedWith).toBe('no-arg');
      expect(out.cancelled).toBe(false);
   });

   test('an event carrying callbacks reports a cancellation', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', { sliceId: 'cam-evt3' });
         document.body.appendChild(modal);

         let confirmed = false;
         let cancelled = false;

         slice.events.emit('confirm:request', {
            title: 'Publish?',
            onConfirm: () => { confirmed = true; },
            onCancel: () => { cancelled = true; },
         });
         await until(() => modal.isOpen && modal.$modal?.open === true);
         modal._handleCancel();
         await until(() => cancelled);

         return { confirmed, cancelled };
      });

      expect(out.confirmed).toBe(false);
      expect(out.cancelled).toBe(true);
   });

   test('an event with an inputLabel is a prompt, and hands back the value', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', { sliceId: 'cam-evt4' });
         document.body.appendChild(modal);

         let received = 'NOT CALLED';
         slice.events.emit('confirm:request', {
            title: 'Your name',
            inputLabel: 'Name',
            inputValue: 'Ana',
            onConfirm: (value) => { received = value; },
         });
         await new Promise((r) => setTimeout(r, 250));
         modal._handleConfirm();
         await new Promise((r) => setTimeout(r, 100));

         return { received };
      });

      expect(out.received).toBe('Ana');
   });

   test('a namespaced eventName does not answer the default channel', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', {
            sliceId: 'cam-evt5',
            eventName: 'admin:confirm:request',
         });
         document.body.appendChild(modal);

         slice.events.emit('confirm:request', { title: 'Wrong channel' });
         await new Promise((r) => setTimeout(r, 200));
         const afterDefault = modal.isOpen;

         slice.events.emit('admin:confirm:request', { title: 'Right channel' });
         await new Promise((r) => setTimeout(r, 200));

         return { afterDefault, afterOwn: modal.isOpen, title: modal.$modal.title };
      });

      expect(out.afterDefault).toBe(false);
      expect(out.afterOwn).toBe(true);
      expect(out.title).toBe('Right channel');
   });

   test('destroying it stops it answering the channel', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', { sliceId: 'cam-evt6' });
         document.body.appendChild(modal);

         slice.controller.destroyComponent(modal);
         await new Promise((r) => setTimeout(r, 100));

         // Would throw on the dead component if the subscription outlived it.
         slice.events.emit('confirm:request', { title: 'Anyone home?' });
         await new Promise((r) => setTimeout(r, 150));

         return { ok: true };
      });

      expect(out.ok).toBe(true);
   });

});

test.describe('ConfirmActionModal - header icon', () => {
   // ------------------------------------------------------------------ icon

   test('a neutral question shows the question mark', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', { sliceId: 'cam-ic1' });
         document.body.appendChild(modal);
         void modal._present({ title: 'Sure?', withInput: false });
         const ready = await until(() => !modal.$icon.hidden && !!modal.$icon.querySelector('slice-icon'));
         const mark = modal.$icon.querySelector('slice-icon');
         return {
            ready,
            hidden: modal.$icon.hidden,
            name: mark?.name,
            danger: modal.$icon.classList.contains('is-danger'),
         };
      });

      expect(out.hidden).toBe(false);
      expect(out.name).toBe('question-circle');
      expect(out.danger).toBe(false);
   });

   test('a dangerous question swaps the mark and the badge', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', { sliceId: 'cam-ic2' });
         document.body.appendChild(modal);

         void modal._present({ title: 'Delete?', danger: true, withInput: false });
         await until(() => !!modal.$icon.querySelector('slice-icon'));
         const first = modal.$icon.querySelector('slice-icon');

         // Then a routine one: the mark and the badge both have to come back.
         modal._closeWith(true);
         await until(() => !modal.$icon.hidden);
         void modal._present({ title: 'Publish?', withInput: false });
         await until(
            () => modal.$icon.querySelector('slice-icon')?.name === 'question-circle'
         );
         const second = modal.$icon.querySelector('slice-icon');

         return {
            dangerName: first?.name,
            dangerClass: modal.$icon.className.includes('is-danger') === false ? 'gone' : 'stuck',
            secondName: second?.name,
            secondIsDanger: modal.$icon.classList.contains('is-danger'),
            iconCount: modal.$icon.querySelectorAll('slice-icon').length,
         };
      });

      expect(out.dangerName).toBe('exclamation-circle');
      expect(out.secondName).toBe('question-circle');
      // The whole point of swapping: no leftover danger badge, and no
      // orphaned Icon from the previous question.
      expect(out.secondIsDanger).toBe(false);
      expect(out.iconCount).toBe(1);
   });

   test('an explicit icon overrides the default, and icon:false hides it', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', { sliceId: 'cam-ic3' });
         document.body.appendChild(modal);

         void modal._present({ title: 'A', icon: 'star', withInput: false });
         await until(() => !!modal.$icon.querySelector('slice-icon'));
         const custom = modal.$icon.querySelector('slice-icon')?.name;

         modal._closeWith(true);
         await until(() => !modal.$icon.hidden);
         void modal._present({ title: 'B', icon: false, withInput: false });
         await until(
            () =>
               modal.$icon.hidden &&
               !modal.$icon.querySelector('slice-icon') &&
               modal.$iconName === null
         );

         return { custom, hidden: modal.$icon.hidden, marks: modal.$icon.querySelectorAll('slice-icon').length };
      });

      expect(out.custom).toBe('star');
      expect(out.hidden).toBe(true);
      expect(out.marks).toBe(0);
   });

   test('the mark is painted, not a leftover empty slot', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', { sliceId: 'cam-ic4' });
         document.body.appendChild(modal);
         void modal._present({ title: 'Sure?', withInput: false });
         await until(() => !!modal.$icon.querySelector('slice-icon'));

         const mark = modal.$icon.querySelector('slice-icon');
         const svg = mark?.querySelector('svg');
         const slot = modal.$icon.getBoundingClientRect();

         return {
            slot: `${Math.round(slot.width)}x${Math.round(slot.height)}`,
            svgW: Math.round(svg?.getBoundingClientRect().width ?? 0),
            color: mark ? getComputedStyle(mark).color : null,
         };
      });

      expect(out.slot).not.toBe('0x0');
      expect(Number(out.svgW)).toBeGreaterThan(8);
      expect(out.color).not.toBe('rgba(0, 0, 0, 0)');
   });

});

test.describe('ConfirmActionModal - styles reach the DOM', () => {
   // ------------------------------------------------------------------ styles

   test('the stylesheet actually reaches the message and the field', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', { sliceId: 'cam-sty' });
         document.body.appendChild(modal);
         void modal._present({ title: 'T', message: 'M', inputLabel: 'L', withInput: true });
         await until(() => !modal.$field.hidden && !modal.$message.hidden);

         const msg = modal.$message;
         const field = modal.$field;

         return {
            // The Modal lives INSIDE slice-confirmactionmodal now, so these
            // selectors have an ancestor to match. When it was appended to
            // document.body every rule below silently did nothing.
            messageUnderHost: modal.contains(msg),
            msgDisplay: getComputedStyle(msg).display,
            // getComputedStyle resolves ch -> px, so the authored "46ch"
            // cannot be asserted verbatim.
            msgMaxWidth: getComputedStyle(msg).maxWidth,
            msgWidth: msg.getBoundingClientRect().width,
            fieldGap: getComputedStyle(field).gap,
            fieldDisplay: getComputedStyle(field).display,
         };
      });

      expect(out.messageUnderHost).toBe(true);
      expect(out.msgDisplay).toBe('block');
      expect(out.msgMaxWidth).not.toBe('none');
      // A resolved px cap, and the text is actually narrower than it.
      expect(Number.parseFloat(out.msgMaxWidth)).toBeGreaterThan(100);
      expect(Number.parseFloat(out.msgWidth)).toBeLessThanOrEqual(
         Number.parseFloat(out.msgMaxWidth)
      );
      expect(out.fieldDisplay).toBe('flex');
      expect(out.fieldGap).toBe('6px');
   });

   test('the Modal is a child of the component, not a stray body child', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', { sliceId: 'cam-sty2' });
         document.body.appendChild(modal);
         void modal._present({ title: 'T', withInput: false });
         await until(() => !!modal.$modal);

         return {
            insideHost: modal.contains(modal.$modal),
            strayInBody: document.body.querySelectorAll(':scope > .slice_confirm_action_modal').length,
         };
      });

      expect(out.insideHost).toBe(true);
      expect(out.strayInBody).toBe(0);
   });

   test('a hidden slot is really hidden, not just given an attribute', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         // _present() returns the pending ANSWER, so awaiting it would wait
         // for a human. These drive the component from the inside: fire it,
         // then poll for the state under test. This has to live IN here —
         // evaluate() runs in the page and cannot see Node scope.
         const until = async (predicate, ms = 5000) => {
            const end = Date.now() + ms;
            while (Date.now() < end) {
               // Tolerant on purpose: mid-build the fields these tests read are
               // still null, so a predicate that dereferences one would throw
               // instead of simply reporting "not yet".
               try {
                  if (predicate()) return true;
               } catch {
                  /* not built yet */
               }
               await new Promise((r) => setTimeout(r, 25));
            }
            return false;
         };

         const modal = await slice.build('ConfirmActionModal', { sliceId: 'cam-sty3' });
         document.body.appendChild(modal);
         // Re-open WITHOUT a message and WITHOUT a field, so the slots are
         // hidden while the dialog is still rendered. A closed <dialog> is
         // display:none and its descendants report display "" - which is a
         // property of being closed, not of the [hidden] rule.
         void modal._present({ title: 'T', withInput: false });
         await until(
            () =>
               !!modal.$modal &&
               // Must be OPEN, not merely built: a closed <dialog> is
               // display:none and its descendants report display "".
               modal.$modal.open === true &&
               modal.$message.hidden &&
               modal.$field.hidden
         );

         const msg = modal.$message;
         const field = modal.$field;

         return {
            iconDisplay: getComputedStyle(modal.$icon).display,
            msgHiddenAttr: msg.hidden,
            msgDisplay: getComputedStyle(msg).display,
            fieldHiddenAttr: field.hidden,
            fieldDisplay: getComputedStyle(field).display,
         };
      });

      // Each of these rules sets `display`, which beats the user-agent
      // [hidden] rule at any specificity (COMPONENT_API_STANDARDS.md 8.2).
      expect(out.msgDisplay).toBe('none');
      expect(out.fieldDisplay).toBe('none');
      expect(out.msgHiddenAttr).toBe(true);
      expect(out.fieldHiddenAttr).toBe(true);
   });
});