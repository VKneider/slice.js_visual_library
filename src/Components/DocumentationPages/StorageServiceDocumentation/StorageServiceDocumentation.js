export default class StorageServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Remembered preferences","expected":"two switches, 'Compact list' and 'Show archived', and a line describing the current preferences; changing a switch updates the line at once; reloading the page or opening it in another tab keeps the choices, and a change in the other tab shows here too","kind":"script","content":"const prefs = await slice.build('StorageService', { singleton: true, sliceId: 'docsPrefs', namespace: 'slice-docs' });\n\nconst compact = await slice.build('Switch', {\n  label: 'Compact list',\n  checked: prefs.get('compact', false),\n  onChange: (checked) => prefs.set('compact', checked)\n});\nconst archived = await slice.build('Switch', {\n  label: 'Show archived',\n  checked: prefs.get('archived', false),\n  onChange: (checked) => prefs.set('archived', checked)\n});\n\nconst summary = await slice.build('Badge', { label: '', tone: 'accent' });\nconst paint = () => {\n  const parts = [prefs.get('compact', false) ? 'compact' : 'comfortable', prefs.get('archived', false) ? 'with archived' : 'without archived'];\n  summary.label = `List: ${parts.join(', ')}`;\n};\n// The switches follow other tabs too; the badge repaints on any change.\nprefs.watch('compact', compact, (value) => { compact.checked = value; paint(); }, false);\nprefs.watch('archived', archived, (value) => { archived.checked = value; paint(); }, false);\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;justify-items:start';\nbox.append(compact, archived, summary);\nreturn box;"},{"label":"Draft with expiry","expected":"a text area and a line under it; typing shows 'Draft kept until <time>'; reloading the page within ten minutes brings the text back; 'Discard' empties it and the line says there is no draft","kind":"script","content":"const drafts = await slice.build('StorageService', { singleton: true, sliceId: 'docsDrafts', namespace: 'slice-docs-drafts' });\nconst TEN_MINUTES = 10 * 60_000;\n\nconst status = document.createElement('small');\nstatus.style.cssText = 'opacity:.75';\nconst say = () => {\n  status.textContent = drafts.has('message')\n    ? `Draft kept until ${new Date(Date.now() + TEN_MINUTES).toLocaleTimeString()}`\n    : 'No draft kept.';\n};\n\nconst message = await slice.build('Textarea', {\n  label: 'Message',\n  rows: 4,\n  value: drafts.get('message', ''),\n  onChange: (text) => {\n    if (text.trim()) drafts.set('message', text, { ttl: TEN_MINUTES });\n    else drafts.remove('message');\n    say();\n  }\n});\nconst discard = await slice.build('Button', {\n  value: 'Discard', variant: 'ghost', size: 'sm',\n  onClick: () => { drafts.remove('message'); message.value = ''; say(); }\n});\nsay();\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:8px;width:100%;max-width:480px';\nbox.append(message, status, discard);\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "storage-service.md";
    this.markdownContent = "---\ntitle: StorageService\nroute: /docs/services/storage-service\nnavLabel: StorageService\nsection: Services\ngroup: Storage\norder: 10\ndescription: Small values the browser keeps for the app — preferences, the last filters, a draft. JSON in and out, a namespace per app, expiry per value, watch() that also hears other tabs, a full storage that does not throw, and a memory fallback when the browser refuses storage.\ncomponent: StorageServiceDocumentation\ngenerate: true\ntags: [service, storage, localStorage, sessionStorage, preferences, persist, ttl, expiry, watch, tabs]\n---\n\n# StorageService\n\n## Overview\n`StorageService` keeps small values in the browser for the app: the theme, a collapsed sidebar, the last filters, a draft. It is `localStorage` (or `sessionStorage`) with what every app ends up writing around it:\n\n- values go in and come out **as they were** (objects, arrays, numbers), not as strings;\n- a **namespace**, so two apps on the same origin never share keys, and `clear()` removes only yours;\n- an **expiry** per value (`ttl`);\n- a **full storage** returns `false` with a warning instead of throwing in the middle of a click;\n- **`watch()`**: a component hears a value change, in this tab **and in other tabs**, until it is destroyed;\n- when the browser **refuses storage** (some private modes, blocked site data), values live in memory for the session, with one warning, instead of failing on every call.\n\n```js\nconst prefs = await slice.build('StorageService', { singleton: true, sliceId: 'prefs', namespace: 'my-app' });\n\nprefs.set('density', 'compact');\nprefs.get('density', 'comfortable');          // 'compact'; 'comfortable' when there is none\nprefs.set('draft', text, { ttl: 24 * 3600_000 }); // forgotten after a day\nprefs.watch('density', this, (density) => this.classList.toggle('is-compact', density === 'compact'));\n```\n\n### When to use it\n- Preferences and small UI memory: theme, density, the open tab, a dismissed banner, the last search.\n- A draft that should survive a reload, with an expiry.\n- A value several tabs must agree on (sign-out in one tab, the others follow).\n\n### When not to use it\n- **Many records, files, or anything to search**: [IndexedDbManager](/docs/services/indexed-db-manager). Storage holds a few megabytes of text, and every read is synchronous.\n- **State the app's components share while it runs**: `slice.context` (with `persist: true` when it must survive a reload).\n- **Server data**: [QueryService](/docs/services/query-service).\n- **Secrets** (tokens with long lives, personal data): any script on the page can read storage.\n\n## Build it\n```js\nconst prefs = await slice.build('StorageService', {\n  singleton: true,\n  sliceId: 'prefs',\n  namespace: 'my-app',   // keys are stored as \"my-app:<key>\"\n  area: 'local',         // 'local' (default) or 'session' (until the tab closes)\n});\n```\n\n| Prop | Type | Default | Description |\n| --- | --- | --- | --- |\n| `namespace` | `string` | `''` | Prefix of every key (`my-app:theme`). Without it, keys are stored as they are and `clear()` empties the whole storage of the origin. |\n| `area` | `'local' \\| 'session'` | `'local'` | `localStorage` survives closing the browser; `sessionStorage` lives as long as the tab. |\n\nBuild one per namespace and area, as a singleton, and give components the service.\n\n## Methods\n| Method | Returns | Description |\n| --- | --- | --- |\n| `get(key, fallback = null)` | value | The value, or `fallback` when there is none or it expired. |\n| `set(key, value, { ttl }?)` | `boolean` | Keeps the value (JSON). `ttl` in ms: forgotten after that. `undefined` removes it. `false` when the storage is full or the value is not JSON. |\n| `change(key, updater, fallback?, { ttl }?)` | `boolean` | `set(key, updater(current))`: `change('visits', (n) => n + 1, 0)`. |\n| `remove(key)` | `true` | Removes it. |\n| `has(key)` | `boolean` | There is a value, not expired. |\n| `keys()` | `string[]` | The keys of this namespace (without the prefix). |\n| `clear()` | `true` | Removes every value of this namespace. |\n| `purge()` | — | Removes the expired values now (also done when the service starts). |\n| `watch(key, component, callback, fallback?)` | `() => void` | Calls `callback(value)` now and on every change of `key` — from this service, another one in the page, or another tab — until `component` is destroyed. Returns a function to stop sooner. |\n\nA value written as plain text by other code (`localStorage.setItem('x', 'hello')`) is read back as that text.\n\n## Examples\n\n### Preferences that follow you between tabs\nThe switches keep their state in storage, and the panel below watches it. Open this page in a second tab and change a switch there: this one follows.\n\n:::script label=\"Remembered preferences\" expected=\"two switches, 'Compact list' and 'Show archived', and a line describing the current preferences; changing a switch updates the line at once; reloading the page or opening it in another tab keeps the choices, and a change in the other tab shows here too\"\nconst prefs = await slice.build('StorageService', { singleton: true, sliceId: 'docsPrefs', namespace: 'slice-docs' });\n\nconst compact = await slice.build('Switch', {\n  label: 'Compact list',\n  checked: prefs.get('compact', false),\n  onChange: (checked) => prefs.set('compact', checked)\n});\nconst archived = await slice.build('Switch', {\n  label: 'Show archived',\n  checked: prefs.get('archived', false),\n  onChange: (checked) => prefs.set('archived', checked)\n});\n\nconst summary = await slice.build('Badge', { label: '', tone: 'accent' });\nconst paint = () => {\n  const parts = [prefs.get('compact', false) ? 'compact' : 'comfortable', prefs.get('archived', false) ? 'with archived' : 'without archived'];\n  summary.label = `List: ${parts.join(', ')}`;\n};\n// The switches follow other tabs too; the badge repaints on any change.\nprefs.watch('compact', compact, (value) => { compact.checked = value; paint(); }, false);\nprefs.watch('archived', archived, (value) => { archived.checked = value; paint(); }, false);\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;justify-items:start';\nbox.append(compact, archived, summary);\nreturn box;\n:::\n\n### A draft that survives a reload, for a while\nEvery change is kept with a `ttl`: reload within ten minutes and the text is back; after that it is gone.\n\n:::script label=\"Draft with expiry\" expected=\"a text area and a line under it; typing shows 'Draft kept until <time>'; reloading the page within ten minutes brings the text back; 'Discard' empties it and the line says there is no draft\"\nconst drafts = await slice.build('StorageService', { singleton: true, sliceId: 'docsDrafts', namespace: 'slice-docs-drafts' });\nconst TEN_MINUTES = 10 * 60_000;\n\nconst status = document.createElement('small');\nstatus.style.cssText = 'opacity:.75';\nconst say = () => {\n  status.textContent = drafts.has('message')\n    ? `Draft kept until ${new Date(Date.now() + TEN_MINUTES).toLocaleTimeString()}`\n    : 'No draft kept.';\n};\n\nconst message = await slice.build('Textarea', {\n  label: 'Message',\n  rows: 4,\n  value: drafts.get('message', ''),\n  onChange: (text) => {\n    if (text.trim()) drafts.set('message', text, { ttl: TEN_MINUTES });\n    else drafts.remove('message');\n    say();\n  }\n});\nconst discard = await slice.build('Button', {\n  value: 'Discard', variant: 'ghost', size: 'sm',\n  onClick: () => { drafts.remove('message'); message.value = ''; say(); }\n});\nsay();\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:8px;width:100%;max-width:480px';\nbox.append(message, status, discard);\nreturn box;\n:::\n\n### Signing out in every tab\nA value all tabs watch. When one tab signs out, the others hear it and follow.\n\n```js\n// In the App component.\nconst session = await slice.build('StorageService', { singleton: true, sliceId: 'session', namespace: 'my-app' });\n\nsession.watch('signedIn', this, (signedIn) => {\n  if (!signedIn && slice.router.activeRoute?.path !== '/login') slice.router.navigate('/login');\n}, true);\n\n// The sign-out button, in any tab.\nsession.set('signedIn', false);\n```\n\n### Remembering a list's filters\n```js\nconst ui = await slice.build('StorageService', { singleton: true, sliceId: 'ui', namespace: 'my-app' });\n\nconst orders = await slice.build('DataList', {\n  filterValues: ui.get('orders.filters', {}),\n  onQueryChange: (query) => ui.set('orders.filters', query.filters),\n  // …\n});\n```\n\n## From LocalStorageManager\n`LocalStorageManager` is deprecated and keeps working as it was, with one warning.\n\n| LocalStorageManager | StorageService |\n| --- | --- |\n| `getItem(key)` | `get(key, fallback)` |\n| `setItem(key, value)` | `set(key, value, { ttl })` |\n| `removeItem(key)` | `remove(key)` |\n| `clear()` (the whole origin) | `clear()` (only its namespace) |\n\nWithout a `namespace`, StorageService reads and writes the same keys as LocalStorageManager, so a move does not lose what users had.\n\n## Best practices\n:::tip\n- Always give a `namespace`: other code on the origin (an analytics script, another app on the same domain) uses storage too.\n- Keep values small and few. Storage is synchronous: a large value read on every route change is felt.\n- Read with a `fallback`: the first visit, another device, or a cleared browser has nothing.\n:::\n\n## Pitfalls\n:::warning\nStorage is not private: any script on the page can read it. Do not keep long-lived tokens or personal data there.\n:::\n\n:::warning\n`watch()` reports changes made **through StorageService** in this page, and any change in other tabs. A `localStorage.setItem` written directly in this same tab is not seen until something reads the key again.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const prefs = await slice.build('StorageService', { singleton: true, sliceId: 'prefs', namespace: 'my-app' });\n\nprefs.set('density', 'compact');\nprefs.get('density', 'comfortable');          // 'compact'; 'comfortable' when there is none\nprefs.set('draft', text, { ttl: 24 * 3600_000 }); // forgotten after a day\nprefs.watch('density', this, (density) => this.classList.toggle('is-compact', density === 'compact'));",
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
               value: "const prefs = await slice.build('StorageService', {\n  singleton: true,\n  sliceId: 'prefs',\n  namespace: 'my-app',   // keys are stored as \"my-app:<key>\"\n  area: 'local',         // 'local' (default) or 'session' (until the tab closes)\n});",
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
            const lines = ["| Prop | Type | Default | Description |","| --- | --- | --- | --- |","| `namespace` | `string` | `''` | Prefix of every key (`my-app:theme`). Without it, keys are stored as they are and `clear()` empties the whole storage of the origin. |","| `area` | `'local' \\| 'session'` | `'local'` | `localStorage` survives closing the browser; `sessionStorage` lives as long as the tab. |"];
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
            const lines = ["| Method | Returns | Description |","| --- | --- | --- |","| `get(key, fallback = null)` | value | The value, or `fallback` when there is none or it expired. |","| `set(key, value, { ttl }?)` | `boolean` | Keeps the value (JSON). `ttl` in ms: forgotten after that. `undefined` removes it. `false` when the storage is full or the value is not JSON. |","| `change(key, updater, fallback?, { ttl }?)` | `boolean` | `set(key, updater(current))`: `change('visits', (n) => n + 1, 0)`. |","| `remove(key)` | `true` | Removes it. |","| `has(key)` | `boolean` | There is a value, not expired. |","| `keys()` | `string[]` | The keys of this namespace (without the prefix). |","| `clear()` | `true` | Removes every value of this namespace. |","| `purge()` | — | Removes the expired values now (also done when the service starts). |","| `watch(key, component, callback, fallback?)` | `() => void` | Calls `callback(value)` now and on every change of `key` — from this service, another one in the page, or another tab — until `component` is destroyed. Returns a function to stop sooner. |"];
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
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "// In the App component.\nconst session = await slice.build('StorageService', { singleton: true, sliceId: 'session', namespace: 'my-app' });\n\nsession.watch('signedIn', this, (signedIn) => {\n  if (!signedIn && slice.router.activeRoute?.path !== '/login') slice.router.navigate('/login');\n}, true);\n\n// The sign-out button, in any tab.\nsession.set('signedIn', false);",
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
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const ui = await slice.build('StorageService', { singleton: true, sliceId: 'ui', namespace: 'my-app' });\n\nconst orders = await slice.build('DataList', {\n  filterValues: ui.get('orders.filters', {}),\n  onQueryChange: (query) => ui.set('orders.filters', query.filters),\n  // …\n});",
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
            const lines = ["| LocalStorageManager | StorageService |","| --- | --- |","| `getItem(key)` | `get(key, fallback)` |","| `setItem(key, value)` | `set(key, value, { ttl })` |","| `removeItem(key)` | `remove(key)` |","| `clear()` (the whole origin) | `clear()` (only its namespace) |"];
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
         const links = [{"text":"IndexedDbManager","path":"/docs/services/indexed-db-manager"},{"text":"QueryService","path":"/docs/services/query-service"}];
         for (const [index, linkProps] of links.entries()) {
            const placeholder = this.querySelector('[data-inline-link="' + index + '"]');
            if (!placeholder) continue;
            const link = await slice.build('Link', linkProps);
            placeholder.replaceWith(link);
            this._inlineLinks.push(link);
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

customElements.define('slice-storageservicedocumentation', StorageServiceDocumentation);
