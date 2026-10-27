// ShortcutService — the app's keyboard shortcuts, in one place.
//
//   const keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'shortcuts' });
//   keys.add('mod+k', this, () => this.openSearch(), { label: 'Search', group: 'General' });
//   keys.add('g o', this, () => slice.router.navigate('/orders'), { label: 'Go to orders' });  // a sequence
//   keys.add('?', this, () => this.showHelp(), { label: 'Keyboard shortcuts' });
//
//   // A dialog takes the keyboard while it is open: the page's shortcuts wait.
//   keys.activate(modal);
//   keys.add('mod+enter', modal, save, { scope: modal, label: 'Save' });
//
// What it takes care of:
//   - one keydown listener for the whole app, not one per component;
//   - `mod` is ⌘ on Mac and Ctrl elsewhere, and shortcuts are shown that way;
//   - sequences ("g o"), and keys that need Shift on some keyboards ("?");
//   - typing in an input, a textarea or an editor does not fire single-key
//     shortcuts, nor the keys that edit text (mod+z, mod+backspace,
//     mod+arrows…); other combinations with Ctrl, ⌘ or Alt still do;
//   - a warning (outside production) when a shortcut takes the browser's own
//     keys (mod+f, mod+e, mod+s…) or keys the browser never lets a page have
//     (mod+t, mod+w, mod+n): pass { override: true } when taking them is meant;
//   - scopes: while a Modal or panel is active, only its shortcuts (and those
//     marked `global`) fire; when it closes or is destroyed, the page's are back;
//   - two shortcuts on the same keys in the same scope: a warning, and the
//     newest wins;
//   - each shortcut belongs to a component and is removed with it;
//   - list() for a "keyboard shortcuts" help, with labels, groups and keys
//     formatted for this platform.

const ALIASES = {
   esc: 'escape', return: 'enter', space: ' ', spacebar: ' ',
   up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright',
   del: 'delete', ins: 'insert', pgup: 'pageup', pgdn: 'pagedown', plus: '+', minus: '-',
   cmd: 'meta', command: 'meta', win: 'meta', super: 'meta',
   control: 'ctrl', opt: 'alt', option: 'alt',
};
const MODIFIERS = ['mod', 'ctrl', 'meta', 'alt', 'shift'];
const SEQUENCE_TIMEOUT = 1000;

const isMac = () => {
   const platform = /** @type {any} */ (navigator).userAgentData?.platform || navigator.platform || navigator.userAgent || '';
   return /mac|iphone|ipad|ipod/i.test(platform);
};

// 'Mod+Shift+K' → { mod: false, ctrl: false, meta: true, alt: false, shift: true, key: 'k' } (on Mac)
function parseStroke(text, mac) {
   const parts = String(text).trim().toLowerCase().split('+');
   // "mod++" and "shift++" end in an empty part: the key is "+".
   if (parts.length > 1 && parts[parts.length - 1] === '' && parts[parts.length - 2] === '') parts.splice(-2, 2, '+');
   const stroke = { ctrl: false, meta: false, alt: false, shift: false, key: '' };
   for (const raw of parts) {
      const part = ALIASES[raw] ?? raw;
      if (part === 'mod') stroke[mac ? 'meta' : 'ctrl'] = true;
      else if (MODIFIERS.includes(part)) stroke[part] = true;
      else stroke.key = part;
   }
   if (!stroke.key) throw new Error(`ShortcutService: "${text}" has no key.`);
   return stroke;
}

// 'mod+k' / 'g o' / ['mod+k', 'ctrl+p'] → sequences of strokes.
function parseCombos(combos, mac) {
   return (Array.isArray(combos) ? combos : [combos]).map((combo) => ({
      text: String(combo),
      strokes: String(combo).trim().split(/\s+/).map((stroke) => parseStroke(stroke, mac)),
   }));
}

// A printable key that is not a letter or a digit (? ! @ / …) changes with
// Shift on different keyboards: Shift is not part of it.
const shiftFree = (key) => key.length === 1 && !/[a-z0-9]/.test(key);

// The key of an event, as a stroke's key. With Alt (Option on Mac) a letter
// types another character ("˚" for k): the physical key decides.
function eventKey(event) {
   const key = String(event.key || '').toLowerCase();
   if (event.altKey && /^Key[A-Z]$/.test(event.code)) return event.code.slice(3).toLowerCase();
   if (event.altKey && /^Digit\d$/.test(event.code)) return event.code.slice(5);
   return ALIASES[key] ?? key;
}

// What was pressed: the key and the modifiers held.
function snapshot(event) {
   return { key: eventKey(event), ctrl: event.ctrlKey, meta: event.metaKey, alt: event.altKey, shift: event.shiftKey };
}

function strokeMatches(stroke, pressed) {
   if (stroke.key !== pressed.key) return false;
   if (stroke.ctrl !== pressed.ctrl || stroke.meta !== pressed.meta || stroke.alt !== pressed.alt) return false;
   return shiftFree(stroke.key) || stroke.shift === pressed.shift;
}

function isTyping(target) {
   const element = /** @type {HTMLElement} */ (target);
   if (!element || element.nodeType !== 1) return false;
   if (element.isContentEditable) return true;
   const tag = element.tagName;
   if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
   if (tag !== 'INPUT') return false;
   const type = /** @type {HTMLInputElement} */ (element).type;
   return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image'].includes(type);
}

// A stroke as text: 'ctrl+shift+k' (modifiers always in this order).
const strokeId = (stroke) => [stroke.ctrl && 'ctrl', stroke.alt && 'alt', stroke.shift && 'shift', stroke.meta && 'meta', stroke.key].filter(Boolean).join('+');

// Keys the browser handles before the page sees them: a shortcut on them
// never runs.
const UNCAPTURABLE = {
   other: ['ctrl+n', 'ctrl+shift+n', 'ctrl+t', 'ctrl+shift+t', 'ctrl+w', 'ctrl+shift+w', 'ctrl+tab', 'ctrl+shift+tab',
      'ctrl+pageup', 'ctrl+pagedown', 'ctrl+shift+q', 'alt+f4'],
   mac: ['meta+n', 'meta+shift+n', 'meta+t', 'meta+shift+t', 'meta+w', 'meta+shift+w', 'meta+q', 'meta+h', 'meta+m',
      'meta+tab', 'ctrl+tab', 'ctrl+shift+tab'],
};

// Keys the browser uses. A page can take them, but people lose what they do.
const numbered = (prefix, what) => Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [`${prefix}+${n}`, what]));
const EDITING = { a: 'select all', c: 'copy', x: 'cut', v: 'paste', z: 'undo' };
const BROWSER_KEYS = {
   other: {
      ...Object.fromEntries(Object.entries(EDITING).map(([k, what]) => [`ctrl+${k}`, what])),
      'ctrl+y': 'redo', 'ctrl+shift+z': 'redo', 'ctrl+shift+v': 'paste as plain text',
      'ctrl+f': 'find in the page', 'ctrl+g': 'find the next match', 'ctrl+shift+g': 'find the previous match', f3: 'find the next match',
      'ctrl+k': 'search from the address bar', 'ctrl+e': 'search from the address bar', 'ctrl+l': 'go to the address bar',
      'alt+d': 'go to the address bar', f6: 'move between the address bar and the page',
      'ctrl+d': 'bookmark the page', 'ctrl+shift+d': 'bookmark all tabs', 'ctrl+shift+b': 'show the bookmarks bar',
      'ctrl+shift+o': 'open the bookmarks', 'ctrl+b': 'open the bookmarks (Firefox)', 'ctrl+h': 'open the history',
      'ctrl+j': 'open the downloads', 'ctrl+i': 'show the page information (Firefox)',
      'ctrl+o': 'open a file', 'ctrl+p': 'print', 'ctrl+s': 'save the page', 'ctrl+u': 'view the source',
      'ctrl+r': 'reload', 'ctrl+shift+r': 'reload without the cache', f5: 'reload', 'ctrl+f5': 'reload without the cache',
      'ctrl++': 'zoom in', 'ctrl+=': 'zoom in', 'ctrl+-': 'zoom out', 'ctrl+0': 'reset the zoom',
      ...numbered('ctrl', 'switch tabs'),
      'ctrl+shift+i': 'open the developer tools', 'ctrl+shift+j': 'open the console', 'ctrl+shift+c': 'inspect an element',
      'ctrl+shift+k': 'open the console (Firefox)', f12: 'open the developer tools',
      'ctrl+shift+delete': 'clear the browsing data', 'ctrl+shift+a': 'search the tabs',
      'alt+arrowleft': 'go back', 'alt+arrowright': 'go forward', 'alt+home': 'open the home page',
      f1: 'open the help', f7: 'turn on caret browsing', f11: 'go full screen',
      tab: 'move the focus', 'shift+tab': 'move the focus back',
   },
   mac: {
      ...Object.fromEntries(Object.entries(EDITING).map(([k, what]) => [`meta+${k}`, what])),
      'shift+meta+z': 'redo', 'alt+shift+meta+v': 'paste as plain text',
      'meta+f': 'find in the page', 'meta+g': 'find the next match', 'shift+meta+g': 'find the previous match',
      'meta+e': 'find with the selection', 'meta+l': 'go to the address bar', 'meta+k': 'search from the toolbar (Firefox)',
      'meta+d': 'bookmark the page', 'shift+meta+b': 'show the bookmarks bar', 'alt+meta+b': 'open the bookmarks',
      'meta+y': 'open the history', 'alt+shift+meta+l': 'open the downloads', 'shift+meta+j': 'open the downloads',
      'meta+o': 'open a file', 'meta+p': 'print', 'meta+s': 'save the page', 'alt+meta+u': 'view the source',
      'meta+r': 'reload', 'shift+meta+r': 'reload without the cache',
      'meta++': 'zoom in', 'meta+=': 'zoom in', 'meta+-': 'zoom out', 'meta+0': 'reset the zoom',
      ...numbered('meta', 'switch tabs'),
      'alt+meta+i': 'open the developer tools', 'alt+meta+j': 'open the console', 'alt+meta+c': 'inspect an element',
      'meta+[': 'go back', 'meta+]': 'go forward', 'meta+,': 'open the settings',
      tab: 'move the focus', 'shift+tab': 'move the focus back',
   },
};

// Keys that edit text: inside a field they belong to the field.
const TEXT_KEYS = ['backspace', 'delete', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'home', 'end'];
const editsText = (stroke) => ((stroke.ctrl || stroke.meta || stroke.alt) && TEXT_KEYS.includes(stroke.key))
   || ((stroke.ctrl || stroke.meta) && !stroke.alt && ['a', 'c', 'x', 'v', 'z', 'y'].includes(stroke.key));

// Each warning once per page.
const warned = new Set();

const SYMBOLS_MAC = { meta: '⌘', ctrl: '⌃', alt: '⌥', shift: '⇧' };
const NAMES = {
   ' ': 'Space', escape: 'Esc', enter: 'Enter', arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→',
   backspace: 'Backspace', delete: 'Delete', tab: 'Tab', pageup: 'Page Up', pagedown: 'Page Down', home: 'Home', end: 'End',
};

export default class ShortcutService {
   /**
    * @param {{ sequenceTimeout?: number }} [props]
    */
   constructor(props = {}) {
      const options = props || {};
      this.sequenceTimeout = Number.isFinite(options.sequenceTimeout) ? options.sequenceTimeout : SEQUENCE_TIMEOUT;
      this.mac = isMac();
      /** @type {Set<any>} */
      this._shortcuts = new Set();
      /** @type {any[]} active scopes, the last one on top */
      this._scopes = [];
      this._paused = 0;
      // The strokes typed so far of a sequence ("g" of "g o"), and when.
      this._pending = [];
      this._pendingAt = 0;
      this._seq = 0;
      this._onKeyDown = (event) => this._handle(event);
   }

   init() {
      document.addEventListener('keydown', this._onKeyDown);
   }

   beforeDestroy() {
      document.removeEventListener('keydown', this._onKeyDown);
      this._shortcuts.clear();
      this._scopes = [];
   }

   // ── Shortcuts ───────────────────────────────────────────────────

   /**
    * Run `handler(event, shortcut)` when `combo` is pressed, while `component`
    * lives. Returns a function that removes it.
    *
    * combo: 'mod+k' · 'shift+/' · 'escape' · 'g o' (one key, then the other) ·
    *        an array of them ('mod+k', 'ctrl+p').
    * options:
    *   label, group     for list() and a help screen
    *   scope            a component: fires only while it is the active scope
    *   global           fires whatever scope is active
    *   within           an element: fires only when focus is inside it
    *   inInputs         true / false: fire while typing in a field (default:
    *                    combinations with Ctrl, ⌘ or Alt do, except the keys
    *                    that edit text: mod+z, mod+backspace, mod+arrows…)
    *   override         true: taking the browser's own keys is meant (no warning)
    *   preventDefault   default true: the browser's own action does not run
    *   repeat           default false: holding the keys fires once
    *   when()           fires only when it returns true
    * @param {string | string[]} combo
    * @param {any} component
    * @param {(event: KeyboardEvent, shortcut: any) => any} handler
    * @param {{ label?: string, group?: string, scope?: any, global?: boolean, within?: Element,
    *   inInputs?: boolean, override?: boolean, preventDefault?: boolean, repeat?: boolean, when?: () => boolean }} [options]
    */
   add(combo, component, handler, options = {}) {
      if (!component?.sliceId) throw new Error('add(combo, component, handler) needs a Slice component, to remove the shortcut when it is destroyed.');
      if (typeof handler !== 'function') throw new Error('add(combo, component, handler) needs a handler.');
      const shortcut = {
         id: ++this._seq,
         combos: parseCombos(combo, this.mac),
         component,
         handler,
         label: options.label || '',
         group: options.group || '',
         scope: options.scope || null,
         global: options.global === true,
         within: options.within || null,
         inInputs: typeof options.inInputs === 'boolean' ? options.inInputs : null,
         preventDefault: options.preventDefault !== false,
         repeat: options.repeat === true,
         when: typeof options.when === 'function' ? options.when : null,
         enabled: true,
      };
      this._warnConflicts(shortcut);
      if (!options.override) this._warnBrowserKeys(shortcut);
      this._shortcuts.add(shortcut);
      return () => { this._shortcuts.delete(shortcut); };
   }

   /** Remove every shortcut of `component` (they also go when it is destroyed). */
   removeAll(component) {
      for (const shortcut of [...this._shortcuts]) {
         if (shortcut.component === component) this._shortcuts.delete(shortcut);
      }
   }

   /**
    * The shortcuts that would fire now (or every one, `all: true`), for a help
    * screen: [{ keys: ['⌘K'], label, group, scope }], in the order they were added.
    */
   list({ all = false } = {}) {
      this._prune();
      return [...this._shortcuts]
         .filter((shortcut) => all || this._inScope(shortcut))
         .map((shortcut) => ({
            keys: shortcut.combos.map((combo) => this.format(combo.text)),
            label: shortcut.label,
            group: shortcut.group,
            scope: shortcut.scope,
         }));
   }

   /** 'mod+shift+k' → '⌘⇧K' on Mac, 'Ctrl+Shift+K' elsewhere; 'g o' → 'G O'. */
   format(combo) {
      return String(combo).trim().split(/\s+/).map((text) => {
         const stroke = parseStroke(text, this.mac);
         const key = NAMES[stroke.key] || (stroke.key.length === 1 ? stroke.key.toUpperCase() : stroke.key[0].toUpperCase() + stroke.key.slice(1));
         const mods = ['ctrl', 'alt', 'shift', 'meta'].filter((m) => stroke[m] && !(m === 'shift' && shiftFree(stroke.key)));
         if (this.mac) return mods.map((m) => SYMBOLS_MAC[m]).join('') + key;
         return [...mods.map((m) => ({ meta: 'Win', ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift' })[m]), key].join('+');
      }).join(' ');
   }

   // ── Scopes ──────────────────────────────────────────────────────

   /**
    * `component` takes the keyboard: from now on only its shortcuts (scope:
    * component) and the global ones fire, until deactivate() or until it is
    * destroyed. Scopes stack: a dialog over a panel over the page.
    */
   activate(component) {
      if (!component?.sliceId) throw new Error('activate(component) needs a Slice component.');
      this._scopes = this._scopes.filter((scope) => scope !== component);
      this._scopes.push(component);
      this._pending = [];
   }

   deactivate(component) {
      this._scopes = this._scopes.filter((scope) => scope !== component);
      this._pending = [];
   }

   /** The active scope (null: the page). */
   get activeScope() {
      this._prune();
      return this._scopes[this._scopes.length - 1] || null;
   }

   /** Stop every shortcut (recording a new one, a game). Calls nest: resume() each. */
   pause() { this._paused += 1; this._pending = []; }
   resume() { this._paused = Math.max(0, this._paused - 1); }
   get paused() { return this._paused > 0; }

   // ── Inside ──────────────────────────────────────────────────────

   _alive(component) {
      return slice.controller.activeComponents.get(component?.sliceId) === component;
   }

   // Forget the shortcuts and scopes of destroyed components.
   _prune() {
      for (const shortcut of [...this._shortcuts]) {
         if (!this._alive(shortcut.component)) this._shortcuts.delete(shortcut);
      }
      this._scopes = this._scopes.filter((scope) => this._alive(scope));
   }

   _inScope(shortcut) {
      if (shortcut.global) return true;
      const top = this._scopes[this._scopes.length - 1] || null;
      return shortcut.scope === top;
   }

   _warnConflicts(added) {
      const texts = new Set(added.combos.map((combo) => combo.strokes.map((s) => JSON.stringify(s)).join(' ')));
      for (const other of this._shortcuts) {
         if (other.scope !== added.scope || other.within !== added.within || !this._alive(other.component)) continue;
         const clash = other.combos.find((combo) => texts.has(combo.strokes.map((s) => JSON.stringify(s)).join(' ')));
         if (clash) {
            slice.logger.warn('ShortcutService', `"${clash.text}" is already ${other.label ? `"${other.label}"` : 'a shortcut'} here; "${added.label || added.combos[0].text}" now takes it.`);
         }
      }
   }

   // Outside production: a shortcut on keys the browser keeps, or uses.
   _warnBrowserKeys(shortcut) {
      if (slice.isProduction?.()) return;
      const platform = this.mac ? 'mac' : 'other';
      const name = shortcut.label ? `"${shortcut.label}"` : 'this shortcut';
      for (const combo of shortcut.combos) {
         const id = strokeId(combo.strokes[0]);
         const shown = this.format(combo.text.trim().split(/\s+/)[0]);
         if (warned.has(`${platform}:${id}`)) continue;
         if (UNCAPTURABLE[platform].includes(id)) {
            warned.add(`${platform}:${id}`);
            slice.logger.warn('ShortcutService', `${shown} cannot be a shortcut: the browser acts on it before the page sees it, so ${name} will never run. Choose other keys.`);
         } else if (BROWSER_KEYS[platform][id]) {
            warned.add(`${platform}:${id}`);
            slice.logger.warn('ShortcutService', `${shown} is the browser's (${BROWSER_KEYS[platform][id]}); ${name} takes it away from people on this page. Choose other keys, or pass { override: true } if taking it is meant (a command palette on ${this.format('mod+k')}).`);
         }
      }
   }

   _handle(event) {
      if (this._paused || event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
      const pressed = snapshot(event);
      if (['control', 'meta', 'alt', 'shift', 'os', 'altgraph', 'capslock'].includes(pressed.key)) return;
      this._prune();

      const now = performance.now();
      if (this._pending.length && now - this._pendingAt > this.sequenceTimeout) this._pending = [];
      const typing = isTyping(event.composedPath?.()[0] || event.target);
      const candidates = [...this._shortcuts].filter((shortcut) => shortcut.enabled && this._inScope(shortcut)
         && (!shortcut.within || shortcut.within.contains(/** @type {Node} */ (event.target)))
         && (!shortcut.when || shortcut.when()));

      // Try the strokes so far plus this one; then this one alone.
      for (const attempt of this._pending.length ? [[...this._pending, pressed], [pressed]] : [[pressed]]) {
         let started = false;
         // The newest shortcut wins a tie.
         for (const shortcut of candidates.slice().reverse()) {
            for (const combo of shortcut.combos) {
               if (combo.strokes.length < attempt.length) continue;
               if (!attempt.every((stroke, i) => strokeMatches(combo.strokes[i], stroke))) continue;
               if (!this._allowedWhileTyping(shortcut, combo, typing)) continue;
               if (combo.strokes.length > attempt.length) {
                  started = true;   // the start of a sequence: wait for the next key
                  continue;
               }
               if (event.repeat && !shortcut.repeat) {
                  if (shortcut.preventDefault) event.preventDefault();
                  this._pending = [];
                  return;
               }
               this._pending = [];
               if (shortcut.preventDefault) event.preventDefault();
               try {
                  shortcut.handler(event, shortcut);
               } catch (error) {
                  slice.logger.error('ShortcutService', `The shortcut "${combo.text}" failed`, error);
               }
               return;
            }
         }
         if (started) {
            this._pending = attempt;
            this._pendingAt = now;
            return;
         }
      }
      this._pending = [];
   }

   _allowedWhileTyping(shortcut, combo, typing) {
      if (!typing) return true;
      if (shortcut.inInputs !== null) return shortcut.inInputs;
      // While typing, only combinations with Ctrl, ⌘ or Alt (mod+k), never a
      // plain key or a sequence of plain keys, and never the keys that edit
      // the text (mod+z, mod+backspace, mod+arrows…): those are the field's.
      return combo.strokes.every((stroke) => (stroke.ctrl || stroke.meta || stroke.alt) && !editsText(stroke));
   }
}