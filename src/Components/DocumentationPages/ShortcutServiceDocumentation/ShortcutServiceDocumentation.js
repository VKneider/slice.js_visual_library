export default class ShortcutServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Keyboard inbox","expected":"a search field, a list of five messages with the first one highlighted, and a hint line; J and K move the highlight, E archives the highlighted message, G then A shows the archived ones and G then I the inbox again, Ctrl+K (⌘K on Mac) puts the cursor in the search field, and ? opens a dialog listing the shortcuts with their keys; typing letters in the search field does not move the highlight","kind":"script","content":"const keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'docsShortcuts' });\n\nlet messages = [\n  { id: 1, from: 'Ana López', subject: 'Quarterly numbers', archived: false },\n  { id: 2, from: 'Luis Galué', subject: 'Server maintenance on Friday', archived: false },\n  { id: 3, from: 'María Ruiz', subject: 'New client in Valencia', archived: false },\n  { id: 4, from: 'Sofía Rey', subject: 'Design review notes', archived: false },\n  { id: 5, from: 'Pedro Díaz', subject: 'Invoice #1045', archived: false }\n];\nlet view = 'inbox';\nlet current = 0;\n\n// The example's area: focusable, and the `within` of its shortcuts.\nconst box = document.createElement('div');\nbox.tabIndex = 0;\nbox.setAttribute('aria-label', 'Keyboard inbox');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:560px;padding:8px;border-radius:10px;outline-offset:2px';\nconst area = { within: box };\n\nconst search = await slice.build('Input', { label: 'Search mail', size: 'sm', clearable: true, onChange: () => { current = 0; paint(); } });\nconst list = document.createElement('div');\nlist.setAttribute('role', 'listbox');\nlist.style.cssText = 'display:grid;gap:4px';\nconst hint = document.createElement('small');\nhint.style.cssText = 'opacity:.75';\n\nconst visible = () => {\n  const q = search.value.trim().toLowerCase();\n  return messages.filter((m) => m.archived === (view === 'archive'))\n    .filter((m) => !q || `${m.from} ${m.subject}`.toLowerCase().includes(q));\n};\nconst paint = () => {\n  const items = visible();\n  current = Math.max(0, Math.min(current, items.length - 1));\n  list.replaceChildren(...items.map((m, i) => {\n    const row = document.createElement('div');\n    row.setAttribute('role', 'option');\n    row.setAttribute('aria-selected', String(i === current));\n    row.style.cssText = `padding:8px 12px;border-radius:8px;border:1px solid var(--primary-color-shade);${i === current ? 'background:color-mix(in srgb, var(--primary-color) 14%, transparent);border-color:var(--primary-color)' : ''}`;\n    row.innerHTML = '<strong></strong> — <span></span>';\n    row.querySelector('strong').textContent = m.from;\n    row.querySelector('span').textContent = m.subject;\n    return row;\n  }));\n  if (!items.length) list.textContent = view === 'archive' ? 'Nothing archived yet.' : 'No messages.';\n  hint.textContent = `${view === 'archive' ? 'Archive' : 'Inbox'} · press ? for the shortcuts`;\n};\n\n// The shortcuts belong to the search field (they go when this example does)\n// and work only with focus inside the example.\nkeys.add('j', search, () => { current += 1; paint(); }, { ...area, label: 'Next message', group: 'Inbox', repeat: true });\nkeys.add('k', search, () => { current -= 1; paint(); }, { ...area, label: 'Previous message', group: 'Inbox', repeat: true });\nkeys.add('e', search, () => {\n  const message = visible()[current];\n  if (message) { message.archived = view !== 'archive'; paint(); }\n}, { ...area, label: 'Archive (or move back)', group: 'Inbox', when: () => visible().length > 0 });\nkeys.add('g a', search, () => { view = 'archive'; current = 0; paint(); }, { ...area, label: 'Go to the archive', group: 'Navigation' });\nkeys.add('g i', search, () => { view = 'inbox'; current = 0; paint(); }, { ...area, label: 'Go to the inbox', group: 'Navigation' });\nkeys.add('mod+k', search, () => search.focus(), { ...area, label: 'Search', group: 'General', global: true });\nkeys.add('shift+?', search, async () => {\n  // The dialog takes the keyboard while it is open.\n  const rows = document.createElement('div');\n  rows.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:6px 16px;align-items:center';\n  for (const shortcut of keys.list().filter((s) => s.label)) {\n    const k = document.createElement('kbd');\n    k.textContent = shortcut.keys.join(' / ');\n    const label = document.createElement('span');\n    label.textContent = `${shortcut.label}${shortcut.group ? ` · ${shortcut.group}` : ''}`;\n    rows.append(k, label);\n  }\n  const dialog = await slice.build('Modal', { title: 'Keyboard shortcuts', size: 'sm', content: rows });\n  document.body.append(dialog);\n  keys.activate(dialog);\n  await dialog.show();\n  keys.deactivate(dialog);\n  slice.controller.destroyComponent(dialog);\n}, { ...area, label: 'Keyboard shortcuts', group: 'General' });\n\npaint();\nbox.append(search, list, hint);\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "shortcut-service.md";
    this.markdownContent = "---\ntitle: ShortcutService\nroute: /docs/services/shortcut-service\nnavLabel: ShortcutService\nsection: Services\ngroup: Interaction\norder: 62\ndescription: The app's keyboard shortcuts in one place. mod+k that is ⌘ on Mac and Ctrl elsewhere, sequences like \"g o\", no single-key shortcuts while typing, scopes so an open dialog takes the keyboard, a warning when two shortcuts collide, cleanup with the component, and list() for a help screen.\ncomponent: ShortcutServiceDocumentation\ngenerate: true\ntags: [service, keyboard, shortcuts, hotkeys, keybindings, accessibility, command palette, scope]\n---\n\n# ShortcutService\n\n## Overview\n`ShortcutService` keeps the app's keyboard shortcuts in one place. A component says which keys do what; the service listens once for the whole app and decides which shortcut, if any, a key press belongs to.\n\n```js\nconst keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'shortcuts' });\n\nkeys.add('mod+k', this, () => this.openSearch(), { label: 'Search', group: 'General' });\nkeys.add('g o', this, () => slice.router.navigate('/orders'), { label: 'Go to orders', group: 'Navigation' });\nkeys.add('shift+?', this, () => this.showShortcuts(), { label: 'Keyboard shortcuts', group: 'General' });\n```\n\nWhat it takes care of, so components do not each listen to `keydown`:\n\n- **`mod`** is ⌘ on Mac and Ctrl elsewhere, and `format()` / `list()` show the keys that way (`⌘K`, `Ctrl+K`).\n- **Sequences**: `g o` is G, then O within a second.\n- **Typing is safe**: in an input, a textarea or an editable element, single keys and sequences do nothing; combinations with Ctrl, ⌘ or Alt (`mod+s`) still work.\n- **Scopes**: while a dialog or panel is active, only its shortcuts (and the ones marked `global`) fire. When it is deactivated or destroyed, the page's shortcuts are back.\n- **Collisions**: the same keys twice in the same place log a warning, and the newest wins.\n- **Cleanup**: a shortcut belongs to a component and goes with it.\n- **Keyboards**: `?` works whether your layout needs Shift for it or not, and Alt/Option combinations match the physical key.\n\n### When to use it\n- An app people use every day: an inbox, a dashboard, an editor, an admin panel.\n- A command palette or search on `mod+k`, navigation with sequences (`g i`, `g o`).\n- A help screen that lists the shortcuts that work right now.\n\n### When not to use it\n- Keys inside a widget that are part of how it works (arrows in a list, Enter in a field, Escape in a menu). The library's components already handle their own; that is the widget's keyboard model, not a shortcut.\n- Replacing a visible control: every shortcut should also be reachable with the mouse or by tab.\n\n## Build it\n```js\nconst keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'shortcuts' });\n```\n\n| Prop | Type | Default | Description |\n| --- | --- | --- | --- |\n| `sequenceTimeout` | `number` | `1000` | Ms between the keys of a sequence (`g` then `o`). |\n\n## Writing keys\n| You write | It means |\n| --- | --- |\n| `mod+k` | ⌘K on Mac, Ctrl+K elsewhere |\n| `ctrl+k`, `meta+k`, `alt+k`, `shift+k` | that exact modifier (`cmd`, `option`, `control` also work) |\n| `mod+shift+p` | several modifiers |\n| `escape`, `enter`, `space`, `arrowup`, `delete`, `f2` | named keys (`esc`, `up`, `del`… also work) |\n| `shift+?`, `/`, `[` | punctuation: Shift is not required to match, because keyboards differ |\n| `g o` | a sequence: G, then O |\n| `['mod+k', 'ctrl+p']` | any of them |\n\n## Methods\n| Method | Returns | Description |\n| --- | --- | --- |\n| `add(combo, component, handler, options?)` | `() => void` | Calls `handler(event, shortcut)` when the keys are pressed, while `component` lives. Returns a function that removes it. |\n| `removeAll(component)` | — | Removes the component's shortcuts now (they also go when it is destroyed). |\n| `activate(component)` | — | The component takes the keyboard: only its shortcuts (`scope: component`) and the `global` ones fire. Scopes stack. |\n| `deactivate(component)` | — | Gives the keyboard back. A destroyed scope is dropped by itself. |\n| `activeScope` | component \\| `null` | The scope on top (`null`: the page). |\n| `list({ all }?)` | `[{ keys, label, group, scope }]` | The shortcuts that would fire now (`all: true`: every one), with keys formatted for this platform. |\n| `format(combo)` | `string` | `'mod+shift+k'` → `⌘⇧K` / `Ctrl+Shift+K`. |\n| `pause()` / `resume()` | — | Stops every shortcut (while recording a new one, during a game). Calls nest. |\n\n### Options of add\n| Option | Default | Description |\n| --- | --- | --- |\n| `label`, `group` | `''` | What `list()` shows. |\n| `scope` | `null` | A component: fires only while it is the active scope. Without it, the shortcut belongs to the page. |\n| `global` | `false` | Fires whatever scope is active (search, help). |\n| `within` | `null` | An element: fires only when focus is inside it (an editor's own shortcuts). |\n| `inInputs` | combinations only | `true`: also while typing in a field. `false`: never while typing, not even `mod+s`. |\n| `preventDefault` | `true` | The browser's own action for those keys does not run. |\n| `repeat` | `false` | Holding the keys down fires once; `true` fires on every repeat (arrows). |\n| `when()` | — | Fires only when it returns `true` (something is selected, a tab is open). |\n\n## Examples\n\n### An inbox you can drive with the keyboard\nClick the example (or Tab to it), then try **J** and **K** to move, **E** to archive, **G** then **A** to see the archive, **G** then **I** to go back, **Ctrl+K** (**⌘K** on Mac) to search, and **?** for the list. While the list is open only its own shortcuts work, and typing in the search box does not trigger anything. The shortcuts are limited to the example with `within`, so the rest of this page keeps its keys.\n\n:::script label=\"Keyboard inbox\" expected=\"a search field, a list of five messages with the first one highlighted, and a hint line; J and K move the highlight, E archives the highlighted message, G then A shows the archived ones and G then I the inbox again, Ctrl+K (⌘K on Mac) puts the cursor in the search field, and ? opens a dialog listing the shortcuts with their keys; typing letters in the search field does not move the highlight\"\nconst keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'docsShortcuts' });\n\nlet messages = [\n  { id: 1, from: 'Ana López', subject: 'Quarterly numbers', archived: false },\n  { id: 2, from: 'Luis Galué', subject: 'Server maintenance on Friday', archived: false },\n  { id: 3, from: 'María Ruiz', subject: 'New client in Valencia', archived: false },\n  { id: 4, from: 'Sofía Rey', subject: 'Design review notes', archived: false },\n  { id: 5, from: 'Pedro Díaz', subject: 'Invoice #1045', archived: false }\n];\nlet view = 'inbox';\nlet current = 0;\n\n// The example's area: focusable, and the `within` of its shortcuts.\nconst box = document.createElement('div');\nbox.tabIndex = 0;\nbox.setAttribute('aria-label', 'Keyboard inbox');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:560px;padding:8px;border-radius:10px;outline-offset:2px';\nconst area = { within: box };\n\nconst search = await slice.build('Input', { label: 'Search mail', size: 'sm', clearable: true, onChange: () => { current = 0; paint(); } });\nconst list = document.createElement('div');\nlist.setAttribute('role', 'listbox');\nlist.style.cssText = 'display:grid;gap:4px';\nconst hint = document.createElement('small');\nhint.style.cssText = 'opacity:.75';\n\nconst visible = () => {\n  const q = search.value.trim().toLowerCase();\n  return messages.filter((m) => m.archived === (view === 'archive'))\n    .filter((m) => !q || `${m.from} ${m.subject}`.toLowerCase().includes(q));\n};\nconst paint = () => {\n  const items = visible();\n  current = Math.max(0, Math.min(current, items.length - 1));\n  list.replaceChildren(...items.map((m, i) => {\n    const row = document.createElement('div');\n    row.setAttribute('role', 'option');\n    row.setAttribute('aria-selected', String(i === current));\n    row.style.cssText = `padding:8px 12px;border-radius:8px;border:1px solid var(--primary-color-shade);${i === current ? 'background:color-mix(in srgb, var(--primary-color) 14%, transparent);border-color:var(--primary-color)' : ''}`;\n    row.innerHTML = '<strong></strong> — <span></span>';\n    row.querySelector('strong').textContent = m.from;\n    row.querySelector('span').textContent = m.subject;\n    return row;\n  }));\n  if (!items.length) list.textContent = view === 'archive' ? 'Nothing archived yet.' : 'No messages.';\n  hint.textContent = `${view === 'archive' ? 'Archive' : 'Inbox'} · press ? for the shortcuts`;\n};\n\n// The shortcuts belong to the search field (they go when this example does)\n// and work only with focus inside the example.\nkeys.add('j', search, () => { current += 1; paint(); }, { ...area, label: 'Next message', group: 'Inbox', repeat: true });\nkeys.add('k', search, () => { current -= 1; paint(); }, { ...area, label: 'Previous message', group: 'Inbox', repeat: true });\nkeys.add('e', search, () => {\n  const message = visible()[current];\n  if (message) { message.archived = view !== 'archive'; paint(); }\n}, { ...area, label: 'Archive (or move back)', group: 'Inbox', when: () => visible().length > 0 });\nkeys.add('g a', search, () => { view = 'archive'; current = 0; paint(); }, { ...area, label: 'Go to the archive', group: 'Navigation' });\nkeys.add('g i', search, () => { view = 'inbox'; current = 0; paint(); }, { ...area, label: 'Go to the inbox', group: 'Navigation' });\nkeys.add('mod+k', search, () => search.focus(), { ...area, label: 'Search', group: 'General', global: true });\nkeys.add('shift+?', search, async () => {\n  // The dialog takes the keyboard while it is open.\n  const rows = document.createElement('div');\n  rows.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:6px 16px;align-items:center';\n  for (const shortcut of keys.list().filter((s) => s.label)) {\n    const k = document.createElement('kbd');\n    k.textContent = shortcut.keys.join(' / ');\n    const label = document.createElement('span');\n    label.textContent = `${shortcut.label}${shortcut.group ? ` · ${shortcut.group}` : ''}`;\n    rows.append(k, label);\n  }\n  const dialog = await slice.build('Modal', { title: 'Keyboard shortcuts', size: 'sm', content: rows });\n  document.body.append(dialog);\n  keys.activate(dialog);\n  await dialog.show();\n  keys.deactivate(dialog);\n  slice.controller.destroyComponent(dialog);\n}, { ...area, label: 'Keyboard shortcuts', group: 'General' });\n\npaint();\nbox.append(search, list, hint);\nreturn box;\n:::\n\n### A dialog that takes the keyboard\nActivate the dialog as its scope when it opens: the page's `j`, `k`, `e` stop working, the dialog's `mod+enter` works, and a `global` shortcut (search) still does. Deactivate it when it closes; if it is destroyed instead, the page gets the keyboard back anyway.\n\n```js\nconst editor = await slice.build('Modal', { title: 'New message', content: form });\ndocument.body.append(editor);\n\nkeys.add('mod+enter', editor, () => send(), { scope: editor, label: 'Send', inInputs: true });\nkeys.activate(editor);\nawait editor.show();\nkeys.deactivate(editor);\n```\n\n### Shortcuts that only exist while something is selected\n```js\nkeys.add('delete', this, () => this.removeSelected(), {\n  label: 'Delete selected',\n  when: () => this.$table.selected.length > 0,\n});\n```\n\n### An editor's own shortcuts\n`within` limits them to focus inside the element, and `inInputs: true` lets them fire while typing there.\n\n```js\nkeys.add('mod+b', this, () => this.toggleBold(), { within: this.$editor, inInputs: true, label: 'Bold', group: 'Editor' });\n```\n\n## Best practices\n:::tip\n- One service for the app (`singleton: true`), and every shortcut added by the component it belongs to: it goes away with it.\n- Give each shortcut a `label`, and offer `?` with `list()`: shortcuts nobody can discover are not used.\n- Prefer `mod+…` for actions that also make sense while typing (save, search), and single keys or sequences for moving around.\n:::\n\n## Pitfalls\n:::warning\nDo not take keys the browser or the screen reader relies on (Tab, Ctrl+L, Ctrl+W, Ctrl+T, F6, Alt+arrows for history). `preventDefault` would take them away from people who depend on them.\n:::\n\n:::warning\nA single-letter shortcut fires anywhere on the page that is not a text field. In pages with many custom widgets, give it a `scope` or a `within`, or use a sequence.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'shortcuts' });\n\nkeys.add('mod+k', this, () => this.openSearch(), { label: 'Search', group: 'General' });\nkeys.add('g o', this, () => slice.router.navigate('/orders'), { label: 'Go to orders', group: 'Navigation' });\nkeys.add('shift+?', this, () => this.showShortcuts(), { label: 'Keyboard shortcuts', group: 'General' });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'shortcuts' });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const lines = ["| Prop | Type | Default | Description |","| --- | --- | --- | --- |","| `sequenceTimeout` | `number` | `1000` | Ms between the keys of a sequence (`g` then `o`). |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const lines = ["| You write | It means |","| --- | --- |","| `mod+k` | ⌘K on Mac, Ctrl+K elsewhere |","| `ctrl+k`, `meta+k`, `alt+k`, `shift+k` | that exact modifier (`cmd`, `option`, `control` also work) |","| `mod+shift+p` | several modifiers |","| `escape`, `enter`, `space`, `arrowup`, `delete`, `f2` | named keys (`esc`, `up`, `del`… also work) |","| `shift+?`, `/`, `[` | punctuation: Shift is not required to match, because keyboards differ |","| `g o` | a sequence: G, then O |","| `['mod+k', 'ctrl+p']` | any of them |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Method | Returns | Description |","| --- | --- | --- |","| `add(combo, component, handler, options?)` | `() => void` | Calls `handler(event, shortcut)` when the keys are pressed, while `component` lives. Returns a function that removes it. |","| `removeAll(component)` | — | Removes the component's shortcuts now (they also go when it is destroyed). |","| `activate(component)` | — | The component takes the keyboard: only its shortcuts (`scope: component`) and the `global` ones fire. Scopes stack. |","| `deactivate(component)` | — | Gives the keyboard back. A destroyed scope is dropped by itself. |","| `activeScope` | component \\| `null` | The scope on top (`null`: the page). |","| `list({ all }?)` | `[{ keys, label, group, scope }]` | The shortcuts that would fire now (`all: true`: every one), with keys formatted for this platform. |","| `format(combo)` | `string` | `'mod+shift+k'` → `⌘⇧K` / `Ctrl+Shift+K`. |","| `pause()` / `resume()` | — | Stops every shortcut (while recording a new one, during a game). Calls nest. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const lines = ["| Option | Default | Description |","| --- | --- | --- |","| `label`, `group` | `''` | What `list()` shows. |","| `scope` | `null` | A component: fires only while it is the active scope. Without it, the shortcut belongs to the page. |","| `global` | `false` | Fires whatever scope is active (search, help). |","| `within` | `null` | An element: fires only when focus is inside it (an editor's own shortcuts). |","| `inInputs` | combinations only | `true`: also while typing in a field. `false`: never while typing, not even `mod+s`. |","| `preventDefault` | `true` | The browser's own action for those keys does not run. |","| `repeat` | `false` | Holding the keys down fires once; `true` fires on every repeat (arrows). |","| `when()` | — | Fires only when it returns `true` (something is selected, a tab is open). |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const editor = await slice.build('Modal', { title: 'New message', content: form });\ndocument.body.append(editor);\n\nkeys.add('mod+enter', editor, () => send(), { scope: editor, label: 'Send', inInputs: true });\nkeys.activate(editor);\nawait editor.show();\nkeys.deactivate(editor);",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-9"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "keys.add('delete', this, () => this.removeSelected(), {\n  label: 'Delete selected',\n  when: () => this.$table.selected.length > 0,\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-10"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "keys.add('mod+b', this, () => this.toggleBold(), { within: this.$editor, inInputs: true, label: 'Bold', group: 'Editor' });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

   beforeDestroy() {
     for (const link of this._inlineLinks) {
       slice.controller.destroyComponent(link);
     }
     this._inlineLinks = [];
   }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: 'Copy as markdown'
    });

    container.appendChild(copyMenu);
  }

  async renderScriptScenarios() {
    if (!Array.isArray(this.scriptScenarios) || this.scriptScenarios.length === 0) return;
    const host = this.querySelector('.documentation-content');
    if (!host) return;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

      // Render where the author put the :::script blocks.
      //
      // The markdown parser already emits one <div class="script-block"> at the
      // position of each block, in document order, and those divs come from the same
      // parse as this.scriptScenarios â€” so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all â€” the divs
      // were never filled, nothing in the repo reads .script-block â€” the real demos were
      // exiled below the props table, and 38 of 53 pages showed the heading twice.
      const blocks = [...this.querySelectorAll('.script-block')];
      const inPlace = blocks.length === this.scriptScenarios.length;

      const section = document.createElement('section');
      if (!inPlace) {
         // Fallback, kept so a future parser change that desyncs the two cannot
         // silently drop every demo. An author-placed heading already exists in the
         // in-place case, so only invent one when we are building the section.
         section.classList.add('doc-script-scenarios');

         const title = document.createElement('h2');
         title.textContent = 'Prop Scenarios';
         section.appendChild(title);

         const subtitle = document.createElement('p');
         subtitle.classList.add('doc-script-subtitle');
         subtitle.textContent = 'Interactive demos validating component behavior.';
         section.appendChild(subtitle);
      }
      for (const [index, scenario] of this.scriptScenarios.entries()) {
      const demobox = await slice.build('DemoBox', {
        label: scenario.label,
        expected: scenario.expected || ''
      });

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });

      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        demobox.clear();
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed var(--warning-color)';
          fallback.style.borderRadius = '8px';
          fallback.style.background = 'color-mix(in srgb, var(--primary-background-color) 85%, var(--warning-color))';
          fallback.style.color = 'var(--font-primary-color)';
          fallback.textContent = String(name || '')
            ? 'Component "' + String(name) + '" is not registered in this build yet.'
            : 'Requested component is not registered in this build yet.';
          return fallback;
        };

        const safeSlice = Object.create(slice);
        safeSlice.build = async (name, props) => {
          const built = await slice.build(name, props);
          if (built instanceof Node) {
            return built;
          }
          if (Array.isArray(built)) {
            const fragment = document.createDocumentFragment();
            let hasNode = false;
            built.forEach((item) => {
              if (item instanceof Node) {
                fragment.appendChild(item);
                hasNode = true;
              }
            });
            if (hasNode) {
              return fragment;
            }
          }
          return built ?? createBuildFallbackNode(name);
        };

        const mount = (node) => {
          if (node instanceof Node) {
            demobox.appendDemo(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

          if (result instanceof Node) {
            demobox.appendDemo(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                demobox.appendDemo(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };
      (inPlace ? blocks[index] : section).appendChild(demobox);
      demobox.appendCode(code);
      (inPlace ? blocks[index] : section).appendChild(errorMessage);

      await executeScenario();
    }
      if (!inPlace) host.appendChild(section);
  }
}

customElements.define('slice-shortcutservicedocumentation', ShortcutServiceDocumentation);
