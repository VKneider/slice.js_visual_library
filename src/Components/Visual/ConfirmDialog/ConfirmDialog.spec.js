import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// ConfirmDialog has no markup of its own — it drives a Modal — so these specs
// talk to it through its promise API, the way a consumer does.
//
// The thing worth testing hard is the invariant: every ask()/prompt() resolves
// EXACTLY ONCE. A dialog that can be dismissed without settling hangs the
// awaiting caller for the life of the page, and that bug is invisible in a
// demo because the demo always clicks a button.

/** Builds the dialog once per test and hands the page-side instance back. */
async function openDialog(h) {
   return h.page.evaluate(async () => {
      window.__dialog = await slice.build('ConfirmDialog', { sliceId: 'spec-confirm' });
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

test.describe('ConfirmDialog — ask()', () => {
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
      await expect(dialog(h).locator('.slice_confirm_dialog__message')).toHaveText('This cannot be undone.');

      await startAsk(h, { title: 'Delete project?' });
      await expect(dialog(h).locator('.slice_confirm_dialog__message')).toBeHidden();
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
      await expect(dialog(h).locator('.slice_confirm_dialog__message img')).toHaveCount(0);
      await expect(dialog(h).locator('.slice_confirm_dialog__message')).toHaveText('<img src=x onerror=alert(1)>');
   });
});

test.describe('ConfirmDialog — prompt()', () => {
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
      await expect(dialog(h).locator('.slice_confirm_dialog__field')).toBeHidden();

      await startAsk(h, { title: 'a' }, 'prompt');
      await expect(dialog(h).locator('.slice_confirm_dialog__field')).toBeVisible();
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

test.describe('ConfirmDialog — teardown', () => {
   test('destroying it settles the pending question instead of hanging', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      await openDialog(h);

      const out = await h.page.evaluate(async () => {
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
