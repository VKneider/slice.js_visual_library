export default class DataComponentsDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [];
  }

  async init() {
    this.markdownPath = "guide-data-components.md";
    this.markdownContent = "---\ntitle: Writing a component that loads data\nroute: /docs/guides/data-components\nnavLabel: Data components\nsection: Guides\ngroup: Components\norder: 2\ndescription: The standard every Slice component that shows server data follows — three sources with the same names, the states it must show, requests that never block the page and are cancelled when they are not needed, and how changes are saved and taken back. With a complete component to copy.\ncomponent: DataComponentsDocumentation\ngenerate: true\ntags: [guide, component, data, load, context, states, skeleton, abort, commit, rollback, standards]\n---\n\n# Writing a component that loads data\n\n## Overview\nDataList, Table and DescriptionList load, show and save data the same way, with the same names. This page is that standard, for anyone writing a component (in the library or in an app) that does the same: a profile card, a dashboard tile, an order summary.\n\nFollow it and your component behaves like the library's: it never keeps the page behind the loader, it always shows what is happening, and an app developer already knows its API. The rules are also in `COMPONENT_API_STANDARDS.md` §13, the checklist for library contributions.\n\n### When it applies\n- The component shows data it does not receive whole as a prop: from a server, or from a `slice.context`.\n- It changes that data (saves, deletes) and has to say whether that worked.\n\n### When it does not\n- The data is a prop the app already has. Take it as a prop (`item`, `items`) and redraw when it changes. Nothing to load.\n- Many components show the same data. Then the app keeps it in a context ([Data and the first load](/docs/guides/data-and-loading), pattern 2), and your component takes `context`.\n\n## The rules\n\n### 1. `init()` never awaits the network\nThe app's loader waits for every `init()` the page awaits (see [Data and the first load](/docs/guides/data-and-loading)). Build the structure, start the request **without** `await`, return.\n\n### 2. Three sources, the same names\n| Prop | Meaning |\n| --- | --- |\n| `item` / `items` (`rows` in Table) | data the app owns. Setting it again redraws. |\n| `context` + `contextPath` | a `slice.context` context, and where the data is in it. Watch it; write changes back to it. |\n| `load` | `async ({ …query, signal }) => data`. A list returns `{ items, total }` or an array. |\n\nPlus `reload()` (ask again), `update()` calling it (a cached route came back), and `onError(error, { type })`.\n\n### 3. Every state is shown\n| State | Shows |\n| --- | --- |\n| first load | a skeleton shaped like the content; the **first paint** is already it |\n| loading again | the old content, marked busy (`aria-busy`) |\n| empty | what would be here, and how to add it |\n| error | what failed, and **Try again** (`role=\"alert\"`) |\n| saving | the part being saved busy; the rest usable |\n\n### 4. One request at a time, cancelled when not needed\nA new request aborts the previous one (`AbortController`). `beforeDestroy()` aborts too. An answer that arrives for an aborted request is ignored, so a slow old answer never overwrites a new one.\n\n### 5. Changes: optimistic lists, commit-first fields, never mutate\n- Add, change and remove are `addItem`, `updateItem`, `removeItem` with `{ commit }`. They show at once and are taken back if `commit` throws. Never call one `update()`: that name is the framework's.\n- A single value edited in place is saved first (`commit`), written after.\n- Make new arrays and objects; never change the ones you were given. `shared/data/collection.js` and `writePath` in `shared/data/paths.js` do it for you inside the library.\n\n## A complete example\n`UserCard` shows one user. It follows every rule above: it takes `item`, `context` or `load`; it shows a skeleton, an error with Try again, and a busy state while it saves; it cancels what it does not need; and its one action (follow) is optimistic with rollback.\n\n```js\n// src/Components/AppComponents/UserCard/UserCard.js\nimport { readPath, writePath } from '../../shared/data/paths.js';\n\nexport default class UserCard extends HTMLElement {\n  static props = {\n    item: { type: 'object', default: null },\n    context: { type: 'string', default: '' },\n    contextPath: { type: 'string', default: '' },\n    load: { type: 'function', default: null },\n    commit: { type: 'function', default: null },   // ({ key, value, item }) => any\n    onError: { type: 'function', default: null },\n  };\n\n  constructor(props) {\n    super();\n    slice.attachTemplate(this);\n    this.classList.add('slice-user-card');\n    this.$body = this.querySelector('.slice-user-card__body');\n    this.$state = this.querySelector('.slice-user-card__state');\n    // Internal state: never `_<prop>` (Slice resets those on build).\n    this._loaded = null;\n    this._status = 'idle';          // idle | loading | error\n    this._abort = null;\n    slice.controller.setComponentProps(this, props);\n  }\n\n  async init() {\n    this._ready = true;\n    this.$avatar = await slice.build('Avatar', { size: 'lg' });   // building: awaited\n    this.$follow = await slice.build('Button', { value: 'Follow', size: 'sm', onClick: () => this.toggleFollow() });\n    this.$body.prepend(this.$avatar);\n    this.$body.append(this.$follow);\n    if (this._context) {\n      slice.context.watch(this._context, this, () => this._paint(), (s) => readPath(s, this._contextPath));\n    }\n    if (this._load) this._status = 'loading';   // first paint: the skeleton\n    this._paint();\n    if (this._load) this._fetch();               // the network: NOT awaited\n  }\n\n  update() { if (this._ready) this.reload(); }  // a cached route came back\n\n  beforeDestroy() {\n    this._ready = false;\n    this._abort?.abort();\n    slice.controller.destroyComponent(this.$avatar);   // built with slice.build after init\n    slice.controller.destroyComponent(this.$follow);\n  }\n\n  get item() { return this._current(); }\n  set item(value) { this._item = value; this._paint(); }\n  get load() { return this._load; }\n  set load(fn) { this._load = typeof fn === 'function' ? fn : null; if (this._ready && this._load) this._fetch(); }\n  get context() { return this._context; }\n  set context(name) { this._context = name || ''; }\n  get contextPath() { return this._contextPath; }\n  set contextPath(path) { this._contextPath = path || ''; }\n  get commit() { return this._commit; }\n  set commit(fn) { this._commit = typeof fn === 'function' ? fn : null; }\n  get onError() { return this._onError; }\n  set onError(fn) { this._onError = typeof fn === 'function' ? fn : null; }\n\n  reload() {\n    return this._load ? this._fetch() : Promise.resolve(this._paint());\n  }\n\n  // Where the user is: the context, what `load` returned, or the prop.\n  _current() {\n    if (this._context) return readPath(slice.context.getState(this._context), this._contextPath) ?? null;\n    return this._load ? this._loaded : this._item;\n  }\n\n  // Write a new user to wherever it lives.\n  _write(next) {\n    if (this._context) slice.context.setState(this._context, (s) => writePath(s, this._contextPath, next));\n    else if (this._load) this._loaded = next;\n    else this._item = next;\n    this._paint();\n  }\n\n  async _fetch() {\n    this._abort?.abort();                       // one request at a time\n    const abort = new AbortController();\n    this._abort = abort;\n    this._status = 'loading';\n    this._paint();\n    try {\n      const user = await this._load({ signal: abort.signal });\n      if (abort.signal.aborted || !this._ready) return;   // a newer request, or gone\n      this._loaded = user;\n      this._status = 'idle';\n    } catch (error) {\n      if (abort.signal.aborted || !this._ready) return;\n      this._status = 'error';\n      this._onError?.(error, { type: 'load' });\n    }\n    this._paint();\n  }\n\n  // Optimistic: shows at once, taken back if the server says no.\n  async toggleFollow() {\n    const before = this._current();\n    if (!before) return;\n    const next = { ...before, following: !before.following };   // a new object\n    this._write(next);\n    this.$follow.disabled = true;\n    try {\n      await this._commit?.({ key: 'following', value: next.following, item: next });\n    } catch (error) {\n      this._write(before);\n      this._onError?.(error, { type: 'save' });\n      // …and say so: an Alert, or the app's ToastProvider.\n    } finally {\n      this.$follow.disabled = false;\n    }\n  }\n\n  _paint() {\n    if (!this._ready) return;\n    const user = this._current();\n    const loading = this._status === 'loading' && !user;\n    this.classList.toggle('is-loading', loading);            // CSS draws the skeleton\n    this.setAttribute('aria-busy', String(this._status === 'loading'));\n    this.$state.hidden = this._status !== 'error';\n    this.$state.setAttribute('role', 'alert');\n    this.$state.textContent = this._status === 'error' ? 'This user could not be loaded.' : '';\n    if (this._status === 'error') {\n      const retry = document.createElement('button');\n      retry.type = 'button';\n      retry.textContent = 'Try again';\n      retry.addEventListener('click', () => this._fetch());\n      this.$state.append(' ', retry);\n    }\n    if (!user) return;\n    this.$avatar.name = user.name;\n    this.$avatar.src = user.photo || '';\n    this.$follow.value = user.following ? 'Following' : 'Follow';\n  }\n}\n\ncustomElements.define('slice-user-card', UserCard);\n```\n\n```html\n<!-- UserCard.html -->\n<div class=\"slice-user-card__body\"></div>\n<p class=\"slice-user-card__state\" hidden></p>\n```\n\nUsed three ways, with the same names as the library's components:\n\n```js\nawait slice.build('UserCard', { item: currentUser });\nawait slice.build('UserCard', { context: 'session', contextPath: 'user' });\nawait slice.build('UserCard', {\n  load: ({ signal }) => fetch(`/api/users/${id}`, { signal }).then((r) => r.json()),\n  commit: ({ key, value, item }) => api.patchUser(item.id, { [key]: value }),\n});\n```\n\n## How the library does it\nRead these when your component grows:\n\n- `Visual/DescriptionList/DescriptionList.js`: one record from `item`, `context` or `load`; skeleton, error with Try again; fields edited with `commit` first.\n- `Visual/DataList/DataList.js`: many records; queries (page, search, filters, sort) sent to `load`; optimistic `addItem`, `updateItem`, `removeItem` with Undo.\n- `Visual/Table/Table.js`: the same for rows, with cells edited in place.\n- `shared/README.md`: the helpers they share (`data/paths.js`, `data/collection.js`, `editing/inlineControl.js`).\n\n## Checklist\n:::tip\n- `init()` / `update()` do not await the network; the first paint is the skeleton.\n- `item(s)` / `context` + `contextPath` / `load`, `reload()`, `onError(error, { type })`.\n- States: skeleton, busy, empty, error with Try again, saving.\n- `AbortController`: a new request and `beforeDestroy()` abort the previous one; late answers are ignored.\n- Changes with `{ commit }`: lists optimistic with rollback, fields commit-first; nothing mutated.\n- Every component built with `slice.build` after `init()` is destroyed in `beforeDestroy()`.\n:::\n\n## Pitfalls\n:::warning\nA `_fetch()` that does not check `signal.aborted` after its `await` lets a slow, old answer overwrite a fast, new one: the user searches \"ana\", then \"anabel\", and sees the results for \"ana\".\n:::\n\n:::warning\nDo not name internal state after a prop (`this._items` for loaded data when `items` is a prop): Slice resets `_<prop>` when the component is built, and the data disappears. Use `_loaded`, `_status`.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const lines = ["| Prop | Meaning |","| --- | --- |","| `item` / `items` (`rows` in Table) | data the app owns. Setting it again redraws. |","| `context` + `contextPath` | a `slice.context` context, and where the data is in it. Watch it; write changes back to it. |","| `load` | `async ({ …query, signal }) => data`. A list returns `{ items, total }` or an array. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
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
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const lines = ["| State | Shows |","| --- | --- |","| first load | a skeleton shaped like the content; the **first paint** is already it |","| loading again | the old content, marked busy (`aria-busy`) |","| empty | what would be here, and how to add it |","| error | what failed, and **Try again** (`role=\"alert\"`) |","| saving | the part being saved busy; the rest usable |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
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
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "// src/Components/AppComponents/UserCard/UserCard.js\nimport { readPath, writePath } from '../../shared/data/paths.js';\n\nexport default class UserCard extends HTMLElement {\n  static props = {\n    item: { type: 'object', default: null },\n    context: { type: 'string', default: '' },\n    contextPath: { type: 'string', default: '' },\n    load: { type: 'function', default: null },\n    commit: { type: 'function', default: null },   // ({ key, value, item }) => any\n    onError: { type: 'function', default: null },\n  };\n\n  constructor(props) {\n    super();\n    slice.attachTemplate(this);\n    this.classList.add('slice-user-card');\n    this.$body = this.querySelector('.slice-user-card__body');\n    this.$state = this.querySelector('.slice-user-card__state');\n    // Internal state: never `_<prop>` (Slice resets those on build).\n    this._loaded = null;\n    this._status = 'idle';          // idle | loading | error\n    this._abort = null;\n    slice.controller.setComponentProps(this, props);\n  }\n\n  async init() {\n    this._ready = true;\n    this.$avatar = await slice.build('Avatar', { size: 'lg' });   // building: awaited\n    this.$follow = await slice.build('Button', { value: 'Follow', size: 'sm', onClick: () => this.toggleFollow() });\n    this.$body.prepend(this.$avatar);\n    this.$body.append(this.$follow);\n    if (this._context) {\n      slice.context.watch(this._context, this, () => this._paint(), (s) => readPath(s, this._contextPath));\n    }\n    if (this._load) this._status = 'loading';   // first paint: the skeleton\n    this._paint();\n    if (this._load) this._fetch();               // the network: NOT awaited\n  }\n\n  update() { if (this._ready) this.reload(); }  // a cached route came back\n\n  beforeDestroy() {\n    this._ready = false;\n    this._abort?.abort();\n    slice.controller.destroyComponent(this.$avatar);   // built with slice.build after init\n    slice.controller.destroyComponent(this.$follow);\n  }\n\n  get item() { return this._current(); }\n  set item(value) { this._item = value; this._paint(); }\n  get load() { return this._load; }\n  set load(fn) { this._load = typeof fn === 'function' ? fn : null; if (this._ready && this._load) this._fetch(); }\n  get context() { return this._context; }\n  set context(name) { this._context = name || ''; }\n  get contextPath() { return this._contextPath; }\n  set contextPath(path) { this._contextPath = path || ''; }\n  get commit() { return this._commit; }\n  set commit(fn) { this._commit = typeof fn === 'function' ? fn : null; }\n  get onError() { return this._onError; }\n  set onError(fn) { this._onError = typeof fn === 'function' ? fn : null; }\n\n  reload() {\n    return this._load ? this._fetch() : Promise.resolve(this._paint());\n  }\n\n  // Where the user is: the context, what `load` returned, or the prop.\n  _current() {\n    if (this._context) return readPath(slice.context.getState(this._context), this._contextPath) ?? null;\n    return this._load ? this._loaded : this._item;\n  }\n\n  // Write a new user to wherever it lives.\n  _write(next) {\n    if (this._context) slice.context.setState(this._context, (s) => writePath(s, this._contextPath, next));\n    else if (this._load) this._loaded = next;\n    else this._item = next;\n    this._paint();\n  }\n\n  async _fetch() {\n    this._abort?.abort();                       // one request at a time\n    const abort = new AbortController();\n    this._abort = abort;\n    this._status = 'loading';\n    this._paint();\n    try {\n      const user = await this._load({ signal: abort.signal });\n      if (abort.signal.aborted || !this._ready) return;   // a newer request, or gone\n      this._loaded = user;\n      this._status = 'idle';\n    } catch (error) {\n      if (abort.signal.aborted || !this._ready) return;\n      this._status = 'error';\n      this._onError?.(error, { type: 'load' });\n    }\n    this._paint();\n  }\n\n  // Optimistic: shows at once, taken back if the server says no.\n  async toggleFollow() {\n    const before = this._current();\n    if (!before) return;\n    const next = { ...before, following: !before.following };   // a new object\n    this._write(next);\n    this.$follow.disabled = true;\n    try {\n      await this._commit?.({ key: 'following', value: next.following, item: next });\n    } catch (error) {\n      this._write(before);\n      this._onError?.(error, { type: 'save' });\n      // …and say so: an Alert, or the app's ToastProvider.\n    } finally {\n      this.$follow.disabled = false;\n    }\n  }\n\n  _paint() {\n    if (!this._ready) return;\n    const user = this._current();\n    const loading = this._status === 'loading' && !user;\n    this.classList.toggle('is-loading', loading);            // CSS draws the skeleton\n    this.setAttribute('aria-busy', String(this._status === 'loading'));\n    this.$state.hidden = this._status !== 'error';\n    this.$state.setAttribute('role', 'alert');\n    this.$state.textContent = this._status === 'error' ? 'This user could not be loaded.' : '';\n    if (this._status === 'error') {\n      const retry = document.createElement('button');\n      retry.type = 'button';\n      retry.textContent = 'Try again';\n      retry.addEventListener('click', () => this._fetch());\n      this.$state.append(' ', retry);\n    }\n    if (!user) return;\n    this.$avatar.name = user.name;\n    this.$avatar.src = user.photo || '';\n    this.$follow.value = user.following ? 'Following' : 'Follow';\n  }\n}\n\ncustomElements.define('slice-user-card', UserCard);",
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
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "<!-- UserCard.html -->\n<div class=\"slice-user-card__body\"></div>\n<p class=\"slice-user-card__state\" hidden></p>",
               language: "html"
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
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "await slice.build('UserCard', { item: currentUser });\nawait slice.build('UserCard', { context: 'session', contextPath: 'user' });\nawait slice.build('UserCard', {\n  load: ({ signal }) => fetch(`/api/users/${id}`, { signal }).then((r) => r.json()),\n  commit: ({ key, value, item }) => api.patchUser(item.id, { [key]: value }),\n});",
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
         const links = [{"text":"Data and the first load","path":"/docs/guides/data-and-loading"},{"text":"Data and the first load","path":"/docs/guides/data-and-loading"}];
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
      label: '❐'
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
      // parse as this.scriptScenarios — so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all — the divs
      // were never filled, nothing in the repo reads .script-block — the real demos were
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

customElements.define('slice-datacomponentsdocumentation', DataComponentsDocumentation);
