export default class InfiniteScrollServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"A feed","expected":"a scrolling box of posts; reaching the end shows 'Loading…' and adds the next 10 posts; after 4 pages it says 'You are all caught up'; a search box starts the feed over","kind":"script","content":"const scroller = await slice.build('InfiniteScrollService', { singleton: true });\n\n// A pretend API: 37 posts, 10 per page, a little slow.\nconst all = Array.from({ length: 37 }, (_, i) => ({ id: i + 1, author: ['Ana', 'Luis', 'María', 'José'][i % 4], text: `Post number ${i + 1}` }));\nconst api = async ({ page, query, signal }) => {\n  await new Promise((r) => setTimeout(r, 450));\n  if (signal?.aborted) throw new DOMException('aborted', 'AbortError');\n  const rows = all.filter((p) => !query || p.text.includes(query) || p.author.toLowerCase().includes(query.toLowerCase()));\n  return { items: rows.slice((page - 1) * 10, page * 10), done: page * 10 >= rows.length };\n};\n\nconst box = document.createElement('div');\nbox.style.cssText = 'height:320px;overflow:auto;border:1px solid var(--slice-border-raised,#ddd);border-radius:12px;padding:8px';\nconst list = document.createElement('div');\nlist.style.cssText = 'display:grid;gap:8px';\nconst status = document.createElement('p');\nstatus.style.cssText = 'margin:10px;text-align:center;opacity:.7';\nconst sentinel = document.createElement('div');\nbox.append(list, status, sentinel);\n\nlet query = '';\nconst feed = scroller.attach(sentinel, {\n  root: box,\n  pageSize: 10,\n  load: ({ page, signal }) => api({ page, query, signal }),\n  onItems: async (items, { first }) => {\n    if (first) list.replaceChildren();\n    for (const post of items) {\n      const row = document.createElement('div');\n      row.style.cssText = 'display:flex;gap:10px;align-items:center;padding:10px;border-radius:10px;background:color-mix(in srgb,var(--primary-color) 5%,transparent)';\n      row.append(await slice.build('Avatar', { name: post.author, size: 'sm' }), `${post.author}: ${post.text}`);\n      list.append(row);\n    }\n  },\n  onStateChange: (state) => {\n    status.textContent = { loading: 'Loading…', done: 'You are all caught up', error: 'Could not load more.', idle: '' }[state];\n  }\n});\n\nconst search = await slice.build('Input', {\n  label: 'Search posts', debounce: 250,\n  onChange: (value) => { query = value.trim(); feed.reset(); }\n});\n\nconst wrap = document.createElement('div');\nwrap.style.cssText = 'display:grid;gap:12px;width:100%;max-width:480px';\nwrap.append(search, box);\nreturn wrap;"},{"label":"Load more after three pages","expected":"a list that loads by scrolling for three pages, then shows a 'Load more' button; the button loads one page at a time until the end","kind":"script","content":"const scroller = await slice.build('InfiniteScrollService', { singleton: true });\nconst total = 80;\n\nconst box = document.createElement('div');\nbox.style.cssText = 'height:260px;overflow:auto;border:1px solid var(--slice-border-raised,#ddd);border-radius:12px';\nconst list = document.createElement('ol');\nlist.style.cssText = 'margin:0;padding:8px 8px 8px 40px';\nconst footer = document.createElement('div');\nfooter.style.cssText = 'display:flex;justify-content:center;padding:10px';\nconst sentinel = document.createElement('div');\nbox.append(list, footer, sentinel);\n\nconst more = await slice.build('Button', { value: 'Load more', variant: 'outlined', onClick: () => feed.loadMore() });\nmore.hidden = true;\nfooter.append(more);\n\nconst feed = scroller.attach(sentinel, {\n  root: box,\n  pageSize: 15,\n  autoLimit: 3,\n  load: async ({ page }) => {\n    await new Promise((r) => setTimeout(r, 300));\n    const from = (page - 1) * 15;\n    return Array.from({ length: Math.max(0, Math.min(15, total - from)) }, (_, i) => `Order #${1000 + from + i}`);\n  },\n  onItems: (items) => list.append(...items.map((text) => Object.assign(document.createElement('li'), { textContent: text }))),\n  onStateChange: (state) => {\n    // After the automatic pages, the button takes over.\n    more.hidden = state === 'done' || feed.page <= 3;\n    more.disabled = state === 'loading';\n  }\n});\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "infinite-scroll-service.md";
    this.markdownContent = "---\ntitle: InfiniteScrollService\nroute: /docs/services/infinite-scroll\nnavLabel: InfiniteScrollService\nsection: Services\ngroup: Interaction\norder: 61\ndescription: Headless infinite scrolling. Watches the end of a list and loads the next page, one request at a time, with abort on reset, fill-the-screen, errors with retry, and page or cursor APIs.\ncomponent: InfiniteScrollServiceDocumentation\ngenerate: true\ntags: [infinite, scroll, pagination, feed, load more, service]\n---\n\n# InfiniteScrollService\n\n## Overview\n`InfiniteScrollService` loads the next page of a list when its end comes into view, the way a social feed does. It is **headless**: it draws nothing and knows nothing about your items. You decide what the list looks like; it decides **when** to ask for more, and makes sure the answers arrive in order.\n\nYou put an element at the end of your list (the *sentinel*), attach it, and give the service a `load` function:\n\n```js\nconst scroller = await slice.build('InfiniteScrollService', { singleton: true });\n\nconst feed = scroller.attach(sentinel, {\n  root: listBox,                       // the box that scrolls (null: the page)\n  load: async ({ page, signal }) => {\n    const res = await fetch(`/api/posts?page=${page}`, { signal });\n    return res.json();                 // { items: [...], done: false }\n  },\n  onItems: (items, { first }) => {\n    if (first) list.replaceChildren(); // page 1: start the list over\n    list.append(...items.map(renderPost));\n  },\n  onStateChange: (state) => {          // 'idle' | 'loading' | 'error' | 'done'\n    spinner.hidden = state !== 'loading';\n  }\n});\n```\n\nIf you know React, it does the work of an `useEffect` with an `IntersectionObserver`, an `AbortController` and a \"loading\" flag, written once and tested.\n\n### When to use it\n- **Feeds and timelines** people scroll through without looking for something in particular: posts, activity, photos.\n- **Long lists from a server** where a pager would interrupt reading.\n- **Inside your own components.** DataList uses it for `pagination: 'infinite'`, and any list of yours can too.\n\n### When not to use it\n- **Results people come back to** (\"it was on page 3\") or compare: use [Pagination](/docs/data/pagination).\n- **Pages with a footer people need** (contact, terms): it is never reached. Use `autoLimit` so a \"Load more\" button takes over after a few pages, or use Pagination.\n- **A list that fits in memory and on screen**: render it whole.\n\n## Core Behavior\n\n### Loading\n- `load({ page, cursor, pageSize, signal, feed })` returns the next page: an array of items, or `{ items, done, hasMore, cursor }`. It can be async.\n- `onItems(items, { page, cursor, first })` receives each page. `first` is true for the first page after an `attach` or a `reset`, which is when your list should start over.\n- The page number starts at `startPage` (1) and goes up by one. With a cursor API, return `cursor` and it is sent back with the next request.\n\n### What it takes care of\n- **One request at a time.** Scrolling up and down at the end never asks for the same page twice.\n- **Filling the screen.** When a page is not enough to fill the box, it asks for the next one, until the box can scroll or there is nothing more.\n- **The end.** It stops in `'done'` when the answer says `done: true` or `hasMore: false`, when `cursor` comes back `null`, when a page is empty, or when a page has fewer items than `pageSize`.\n- **Errors.** A failed `load` stops it in `'error'` (`feed.error` holds it, and `onError` gets it) until `feed.retry()`.\n- **Changing the query.** `feed.reset()` aborts the request in flight through its `signal`, drops a late answer to the old query, and loads page 1 again. Call it when the search or a filter changes.\n\n### Controlling it\n- `feed.loadMore()` loads the next page now, for a \"Load more\" button.\n- `autoLimit`: after this many pages loaded by scrolling, only `loadMore()` loads. Use it to keep a footer reachable.\n- `auto: false`: never load on scroll, only through `loadMore()`.\n- `feed.pause()` and `feed.resume()`; `feed.configure({ ... })` changes options later.\n- `feed.state`, `feed.page`, `feed.cursor`, `feed.loading`, `feed.done` and `feed.error` say where it is.\n- `rootMargin` (`'600px'` by default) is how early it loads, before the end is actually visible.\n\n### Cleaning up\n`scroller.detach(sentinel)` (or `feed.destroy()`) stops watching and aborts the request in flight. Call it in your component's `beforeDestroy()`.\n\n## Examples\n:::script label=\"A feed\" expected=\"a scrolling box of posts; reaching the end shows 'Loading…' and adds the next 10 posts; after 4 pages it says 'You are all caught up'; a search box starts the feed over\"\nconst scroller = await slice.build('InfiniteScrollService', { singleton: true });\n\n// A pretend API: 37 posts, 10 per page, a little slow.\nconst all = Array.from({ length: 37 }, (_, i) => ({ id: i + 1, author: ['Ana', 'Luis', 'María', 'José'][i % 4], text: `Post number ${i + 1}` }));\nconst api = async ({ page, query, signal }) => {\n  await new Promise((r) => setTimeout(r, 450));\n  if (signal?.aborted) throw new DOMException('aborted', 'AbortError');\n  const rows = all.filter((p) => !query || p.text.includes(query) || p.author.toLowerCase().includes(query.toLowerCase()));\n  return { items: rows.slice((page - 1) * 10, page * 10), done: page * 10 >= rows.length };\n};\n\nconst box = document.createElement('div');\nbox.style.cssText = 'height:320px;overflow:auto;border:1px solid var(--slice-border-raised,#ddd);border-radius:12px;padding:8px';\nconst list = document.createElement('div');\nlist.style.cssText = 'display:grid;gap:8px';\nconst status = document.createElement('p');\nstatus.style.cssText = 'margin:10px;text-align:center;opacity:.7';\nconst sentinel = document.createElement('div');\nbox.append(list, status, sentinel);\n\nlet query = '';\nconst feed = scroller.attach(sentinel, {\n  root: box,\n  pageSize: 10,\n  load: ({ page, signal }) => api({ page, query, signal }),\n  onItems: async (items, { first }) => {\n    if (first) list.replaceChildren();\n    for (const post of items) {\n      const row = document.createElement('div');\n      row.style.cssText = 'display:flex;gap:10px;align-items:center;padding:10px;border-radius:10px;background:color-mix(in srgb,var(--primary-color) 5%,transparent)';\n      row.append(await slice.build('Avatar', { name: post.author, size: 'sm' }), `${post.author}: ${post.text}`);\n      list.append(row);\n    }\n  },\n  onStateChange: (state) => {\n    status.textContent = { loading: 'Loading…', done: 'You are all caught up', error: 'Could not load more.', idle: '' }[state];\n  }\n});\n\nconst search = await slice.build('Input', {\n  label: 'Search posts', debounce: 250,\n  onChange: (value) => { query = value.trim(); feed.reset(); }\n});\n\nconst wrap = document.createElement('div');\nwrap.style.cssText = 'display:grid;gap:12px;width:100%;max-width:480px';\nwrap.append(search, box);\nreturn wrap;\n:::\n\n:::script label=\"Load more after three pages\" expected=\"a list that loads by scrolling for three pages, then shows a 'Load more' button; the button loads one page at a time until the end\"\nconst scroller = await slice.build('InfiniteScrollService', { singleton: true });\nconst total = 80;\n\nconst box = document.createElement('div');\nbox.style.cssText = 'height:260px;overflow:auto;border:1px solid var(--slice-border-raised,#ddd);border-radius:12px';\nconst list = document.createElement('ol');\nlist.style.cssText = 'margin:0;padding:8px 8px 8px 40px';\nconst footer = document.createElement('div');\nfooter.style.cssText = 'display:flex;justify-content:center;padding:10px';\nconst sentinel = document.createElement('div');\nbox.append(list, footer, sentinel);\n\nconst more = await slice.build('Button', { value: 'Load more', variant: 'outlined', onClick: () => feed.loadMore() });\nmore.hidden = true;\nfooter.append(more);\n\nconst feed = scroller.attach(sentinel, {\n  root: box,\n  pageSize: 15,\n  autoLimit: 3,\n  load: async ({ page }) => {\n    await new Promise((r) => setTimeout(r, 300));\n    const from = (page - 1) * 15;\n    return Array.from({ length: Math.max(0, Math.min(15, total - from)) }, (_, i) => `Order #${1000 + from + i}`);\n  },\n  onItems: (items) => list.append(...items.map((text) => Object.assign(document.createElement('li'), { textContent: text }))),\n  onStateChange: (state) => {\n    // After the automatic pages, the button takes over.\n    more.hidden = state === 'done' || feed.page <= 3;\n    more.disabled = state === 'loading';\n  }\n});\nreturn box;\n:::\n\n## Best Practices\n:::tip\nCall `feed.reset()` whenever the query changes (search, filters, sort). It cancels the old request, so results of two queries never mix.\n:::\n\n:::tip\nPass the `signal` to `fetch`. A reset then cancels the network request itself, not only its answer.\n:::\n\n## Pitfalls\n:::warning\nDetach the sentinel when your component is destroyed (`beforeDestroy`), or the service keeps watching an element that is gone.\n:::\n\n:::warning\nInfinite scrolling hides the footer. If the page has one, set `autoLimit` so a \"Load more\" button appears after a few pages.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const scroller = await slice.build('InfiniteScrollService', { singleton: true });\n\nconst feed = scroller.attach(sentinel, {\n  root: listBox,                       // the box that scrolls (null: the page)\n  load: async ({ page, signal }) => {\n    const res = await fetch(`/api/posts?page=${page}`, { signal });\n    return res.json();                 // { items: [...], done: false }\n  },\n  onItems: (items, { first }) => {\n    if (first) list.replaceChildren(); // page 1: start the list over\n    list.append(...items.map(renderPost));\n  },\n  onStateChange: (state) => {          // 'idle' | 'loading' | 'error' | 'done'\n    spinner.hidden = state !== 'loading';\n  }\n});",
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
         const links = [{"text":"Pagination","path":"/docs/data/pagination"}];
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
      label: 'â'
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

customElements.define('slice-infinitescrollservicedocumentation', InfiniteScrollServiceDocumentation);
