import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Runs `code` in the page with `keys` (a ShortcutService), `host` (a component
// that owns the shortcuts), `press(key, options, target)` (a keydown; returns
// whether the default was prevented) and `wait(ms)`. Chromium on Linux: `mod`
// is Ctrl.
const run = (page, code, props = {}) => page.evaluate(async ([src, p]) => {
   const keys = await slice.build('ShortcutService', p);
   const host = await slice.build('Badge', { label: 'host' });
   document.body.append(host);
   const press = (key, { code, ctrl = false, meta = false, alt = false, shift = false, repeat = false } = {}, target = document.body) => {
      const event = new KeyboardEvent('keydown', {
         key, code: code || '', ctrlKey: ctrl, metaKey: meta, altKey: alt, shiftKey: shift, repeat, bubbles: true, cancelable: true,
      });
      target.dispatchEvent(event);
      return event.defaultPrevented;
   };
   const wait = (ms) => new Promise((r) => setTimeout(r, ms));
   try {
      return await (0, eval)(`(async (keys, host, press, wait) => { ${src} })`)(keys, host, press, wait);
   } finally {
      slice.controller.destroyComponent(host);
      slice.controller.destroyComponent(keys);
   }
}, [code, props]);

test.describe('ShortcutService', () => {
   test('mod+k fires and keeps the browser from acting; the plain key does not; keys are formatted for the platform', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const fired = [];
         keys.add('mod+k', host, () => fired.push('search'), { label: 'Search' });
         keys.add(['mod+p', 'ctrl+shift+p'], host, () => fired.push('palette'));
         const prevented = press('k', { ctrl: true });
         press('k');
         press('k', { ctrl: true, shift: true });     // Shift is part of a letter's combination
         press('P', { ctrl: true, shift: true });
         return { fired, prevented, formats: [keys.format('mod+shift+k'), keys.format('g o'), keys.format('escape'), keys.format('shift+?'), keys.format('alt+arrowup')] };
      `);
      expect(out.fired).toEqual(['search', 'palette']);
      expect(out.prevented).toBe(true);
      expect(out.formats).toEqual(['Ctrl+Shift+K', 'G O', 'Esc', '?', 'Alt+↑']);
   });

   test('real key presses reach it (Playwright keyboard)', async ({ mountHtml }) => {
      const h = await mountHtml('<output id="log"></output><input id="field">');
      await h.page.evaluate(async () => {
         const keys = await slice.build('ShortcutService', {});
         const host = await slice.build('Badge', { label: 'host' });
         document.body.append(host);
         const log = document.getElementById('log');
         keys.add('mod+k', host, () => { log.textContent += 'k;'; });
         keys.add('g o', host, () => { log.textContent += 'go;'; });
         keys.add('shift+?', host, () => { log.textContent += 'help;'; });
         keys.add('mod+s', host, () => { log.textContent += 'save;'; });
      });
      await h.page.keyboard.press('Control+k');
      await h.page.keyboard.press('g');
      await h.page.keyboard.press('o');
      await h.page.keyboard.press('Shift+Slash');
      await h.page.focus('#field');
      await h.page.keyboard.type('go?');                // typing: none of the plain-key shortcuts
      await h.page.keyboard.press('Control+s');         // a combination still works in a field
      await expect(h.page.locator('#log')).toHaveText('k;go;help;save;');
      await expect(h.page.locator('#field')).toHaveValue('go?');
   });

   test('typing in a field, a textarea or an editor: single keys and sequences wait; combinations and inInputs fire', async ({ mountHtml }) => {
      const h = await mountHtml('<input id="i"><textarea id="t"></textarea><div id="e" contenteditable="true"></div><input id="c" type="checkbox">');
      const out = await run(h.page, `
         const fired = [];
         keys.add('k', host, () => fired.push('k'));
         keys.add('g o', host, () => fired.push('go'));
         keys.add('mod+s', host, () => fired.push('save'));
         keys.add('escape', host, () => fired.push('esc'), { inInputs: true });
         for (const id of ['i', 't', 'e']) {
            const el = document.getElementById(id);
            press('k', {}, el); press('g', {}, el); press('o', {}, el);
            press('s', { ctrl: true }, el);
            press('Escape', {}, el);
         }
         press('k', {}, document.getElementById('c'));   // a checkbox is not typing
         return fired;
      `);
      expect(out).toEqual(['save', 'esc', 'save', 'esc', 'save', 'esc', 'k']);
   });

   test('sequences: the second key within the time; too late or another key starts over', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const fired = [];
         keys.add('g o', host, () => fired.push('orders'));
         keys.add('g i', host, () => fired.push('inbox'));
         keys.add('o', host, () => fired.push('o alone'));
         press('g'); press('o');
         press('g'); press('i');
         press('g'); await wait(250); press('o');        // too late: "o" alone
         press('g'); press('x'); press('i');              // broken by x
         press('g'); press('g'); press('i');              // a second g starts again
         return fired;
      `, { sequenceTimeout: 200 });
      expect(out).toEqual(['orders', 'inbox', 'o alone', 'inbox']);
   });

   test('scopes: an active one takes the keyboard (plus global shortcuts); deactivating or destroying it gives it back', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const fired = [];
         const dialog = await slice.build('Badge', { label: 'dialog' });
         keys.add('n', host, () => fired.push('page n'));
         keys.add('mod+k', host, () => fired.push('search'), { global: true });
         keys.add('mod+enter', dialog, () => fired.push('dialog save'), { scope: dialog });
         press('Enter', { ctrl: true });                 // not active yet
         keys.activate(dialog);
         const top = keys.activeScope === dialog;
         press('n'); press('Enter', { ctrl: true }); press('k', { ctrl: true });
         const listed = keys.list().map((s) => s.keys[0]);
         keys.deactivate(dialog);
         press('n');
         keys.activate(dialog);
         slice.controller.destroyComponent(dialog);       // closing it without deactivate()
         press('n');
         return { fired, top, listed, after: keys.activeScope };
      `);
      expect(out.fired).toEqual(['dialog save', 'search', 'page n', 'page n']);
      expect(out.top).toBe(true);
      expect(out.listed).toEqual(['Ctrl+K', 'Ctrl+Enter']);
      expect(out.after).toBeNull();
   });

   test('a shortcut goes with its component, or with the function add() returned; list() describes what fires now', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const fired = [];
         const panel = await slice.build('Badge', { label: 'panel' });
         keys.add('p', panel, () => fired.push('panel'), { label: 'Panel', group: 'View' });
         const remove = keys.add('r', host, () => fired.push('r'), { label: 'Reload', group: 'General' });
         const before = keys.list();
         press('p'); press('r');
         slice.controller.destroyComponent(panel);
         remove();
         press('p'); press('r');
         return { fired, before, after: keys.list() };
      `);
      expect(out.fired).toEqual(['panel', 'r']);
      expect(out.before).toEqual([
         { keys: ['P'], label: 'Panel', group: 'View', scope: null },
         { keys: ['R'], label: 'Reload', group: 'General', scope: null },
      ]);
      expect(out.after).toEqual([]);
   });

   test('the same keys twice in a scope: a warning, and the newest wins', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const warnings = [];
         const listener = slice.logger.onLog((log) => { if (String(log.message).includes('already')) warnings.push(log.message); });
         const fired = [];
         keys.add('mod+k', host, () => fired.push('old'), { label: 'Search' });
         keys.add('ctrl+k', host, () => fired.push('new'), { label: 'Command palette' });
         const zone = document.createElement('div');
         document.body.append(zone);
         keys.add('mod+k', host, () => fired.push('in the zone'), { within: zone });   // another place: no clash
         press('k', { ctrl: true });                    // outside the zone
         zone.remove();
         slice.logger.offLog?.(listener);
         return { fired, warnings };
      `);
      expect(out.fired).toEqual(['new']);
      expect(out.warnings).toHaveLength(1);
      expect(out.warnings[0]).toContain('"Search"');
   });

   test('held keys fire once unless repeat; pause()/resume(); when(); within; preventDefault: false; a failing handler is logged', async ({ mountHtml }) => {
      const h = await mountHtml('<div id="editor"><span id="inside"></span></div><div id="outside"></div>');
      const out = await run(h.page, `
         const fired = [];
         const errors = [];
         const listener = slice.logger.onLog((log) => { if (String(log.message).includes('failed')) errors.push(log.message); });
         let allowed = false;
         keys.add('j', host, () => fired.push('j'));
         keys.add('arrowdown', host, () => fired.push('down'), { repeat: true });
         keys.add('w', host, () => fired.push('w'), { when: () => allowed });
         keys.add('b', host, () => fired.push('bold'), { within: document.getElementById('editor') });
         keys.add('x', host, () => { throw new Error('boom'); });
         keys.add('l', host, () => fired.push('l'), { preventDefault: false });
         press('j'); press('j', { repeat: true });
         press('ArrowDown'); press('ArrowDown', { repeat: true });
         press('w'); allowed = true; press('w');
         press('b', {}, document.getElementById('outside')); press('b', {}, document.getElementById('inside'));
         keys.pause(); keys.pause(); press('j'); keys.resume(); press('j'); keys.resume(); press('j');
         const thrown = press('x');
         const lPrevented = press('l');
         slice.logger.offLog?.(listener);
         return { fired, errors: errors.length, thrown, lPrevented };
      `);
      expect(out.fired).toEqual(['j', 'down', 'down', 'w', 'bold', 'j', 'l']);
      expect(out.errors).toBe(1);
      expect(out.thrown).toBe(true);
      expect(out.lPrevented).toBe(false);
   });
   test("keys the browser keeps or uses warn once (unless override); keys that edit text stay the field's while typing", async ({ mountHtml }) => {
      const h = await mountHtml('<input id="field">');
      const out = await run(h.page, `
         const warnings = [];
         const listener = slice.logger.onLog((log) => { if (String(log.message).includes('browser')) warnings.push(log.message); });
         const fired = [];
         keys.add('mod+t', host, () => fired.push('t'), { label: 'New tab' });              // never reaches the page
         keys.add('mod+e', host, () => fired.push('e'), { label: 'Rename' });               // the browser's search
         keys.add('mod+e', host, () => fired.push('e2'), { label: 'Edit', within: document.body });   // same keys: warned once
         keys.add('mod+k', host, () => fired.push('k'), { label: 'Palette', override: true });   // meant: no warning
         keys.add('mod+enter', host, () => fired.push('enter'), { label: 'Send' });          // free: no warning
         keys.add('g i', host, () => fired.push('gi'), { label: 'Go to inbox' });           // plain keys: no warning
         keys.add('mod+z', host, () => fired.push('undo'), { label: 'Undo' });
         keys.add('mod+backspace', host, () => fired.push('delete'), { label: 'Delete' });
         const field = document.getElementById('field');
         press('z', { ctrl: true }, field); press('Backspace', { ctrl: true }, field);   // the field's
         press('k', { ctrl: true }, field); press('Enter', { ctrl: true }, field);       // still shortcuts
         press('z', { ctrl: true }); press('Backspace', { ctrl: true });                 // outside a field
         slice.logger.offLog?.(listener);
         return { fired, warnings };
      `);
      expect(out.fired).toEqual(['k', 'enter', 'undo', 'delete']);
      // mod+backspace has no browser meaning outside a field: no warning; in a field it is the field's.
      expect(out.warnings).toHaveLength(3);
      expect(out.warnings[0]).toContain('Ctrl+T cannot be a shortcut');
      expect(out.warnings[1]).toContain("Ctrl+E is the browser's (search from the address bar)");
      expect(out.warnings[1]).toContain('override: true');
      expect(out.warnings[2]).toContain("Ctrl+Z is the browser's (undo)");
   });
});