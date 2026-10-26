export default class LoadingDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Saving a form","expected":"a profile Card with two fields and a Save button; Save covers only the card with a 'Saving…' overlay for about a second and a half, then a toast says it was saved; a quick second save shows nothing thanks to delayMs","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\nconst loading = await slice.build('Loading', { variant: 'spinner', label: 'Saving…', delayMs: 150, minVisibleMs: 400 });\n\nconst name = await slice.build('Input', { label: 'Full name', value: 'Ana Ruiz' });\nconst email = await slice.build('Input', { label: 'Email', value: 'ana@example.com', type: 'email' });\nconst fields = document.createElement('div');\nfields.style.cssText = 'display:grid;gap:14px';\nfields.append(name, email);\n\nlet fast = false;\nconst card = await slice.build('Card', {\n  title: 'Profile',\n  subtitle: 'Shown to your team',\n  content: fields,\n  actions: [{\n    value: 'Save',\n    onClick: async () => {\n      loading.start(card);\n      // A pretend request: slow the first time, fast after.\n      await new Promise((r) => setTimeout(r, fast ? 80 : 1500));\n      fast = true;\n      loading.stop();\n      toasts.show('Profile saved', { type: 'success' });\n    }\n  }]\n});\ncard.style.maxWidth = '420px';\nreturn card;"},{"label":"Uploading with a progress bar","expected":"a Files panel with three files and an Upload button; the upload shows a bar along the top of the panel that fills from 0 to 100% with a label counting the files, without blocking the list","kind":"script","content":"const files = ['Q3 report.pdf', 'Team photo.jpg', 'Budget.xlsx'];\nconst loading = await slice.build('Loading', { variant: 'bar', progress: 0 });\n\nconst list = document.createElement('ul');\nlist.style.cssText = 'margin:0;padding:0;list-style:none;display:grid;gap:8px';\nfor (const name of files) {\n  const li = document.createElement('li');\n  li.style.cssText = 'display:flex;justify-content:space-between;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--primary-color) 6%,transparent)';\n  li.innerHTML = `<span>${name}</span><span style=\"opacity:.6\">Waiting</span>`;\n  list.append(li);\n}\n\nconst panel = document.createElement('section');\npanel.style.cssText = 'display:grid;gap:12px;width:100%;max-width:420px;padding:16px;border:1px solid var(--slice-border-raised,#ddd);border-radius:14px';\npanel.innerHTML = '<h3 style=\"margin:0\">Files</h3>';\npanel.append(list);\n\nconst upload = await slice.build('Button', {\n  value: 'Upload',\n  icon: 'upload',\n  onClick: async () => {\n    upload.disabled = true;\n    loading.progress = 0;\n    loading.start(panel);\n    for (let i = 0; i < files.length; i++) {\n      loading.label = `Uploading ${i + 1} of ${files.length}…`;\n      for (let step = 1; step <= 10; step++) {\n        await new Promise((r) => setTimeout(r, 70));\n        loading.progress = (i + step / 10) / files.length;\n      }\n      list.children[i].lastElementChild.textContent = 'Done';\n    }\n    loading.label = '';\n    loading.stop();\n    upload.disabled = false;\n  }\n});\npanel.append(upload);\nreturn panel;"},{"label":"Refreshing one card at a time","expected":"three metric cards, each with a refresh button; refreshing one blurs only that card with dots while it loads, and the other cards stay usable","kind":"script","content":"const metrics = [\n  { title: 'Revenue', value: '$48,210', icon: 'dollar' },\n  { title: 'Orders', value: '1,284', icon: 'cart' },\n  { title: 'Visitors', value: '32,911', icon: 'users' }\n];\n\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;width:100%';\n\nfor (const metric of metrics) {\n  const loading = await slice.build('Loading', { variant: 'dots', backdrop: 'blur', size: 'sm', minVisibleMs: 600 });\n  const value = document.createElement('div');\n  value.style.cssText = 'font-size:1.6rem;font-weight:700';\n  value.textContent = metric.value;\n  const card = await slice.build('Card', {\n    title: metric.title,\n    headerIcon: metric.icon,\n    content: value,\n    actions: [{\n      value: 'Refresh', variant: 'ghost', icon: 'refresh', size: 'sm',\n      onClick: async ({ card: target }) => {\n        loading.start(target);\n        await new Promise((r) => setTimeout(r, 900));\n        value.textContent = metric.value.replace(/\\d(?=\\D*$)/, (d) => String((Number(d) + 1) % 10));\n        loading.stop();\n      }\n    }]\n  });\n  grid.append(card);\n}\nreturn grid;"},{"label":"The welcome screen","expected":"two buttons: one shows the built-in welcome screen (kicker, title, subtitle and the Slice logo spinning under the card) for two and a half seconds, then it fades out; the other shows the bar variant along the top of the page, as for a route change","kind":"script","content":"const welcome = await slice.build('Loading', {\n  welcome: { kicker: 'Welcome to', title: 'Conclave', subtitle: 'Getting your space ready', minVisibleMs: 0 }\n});\nconst route = await slice.build('Loading', { variant: 'bar' });\n\nconst showWelcome = await slice.build('Button', {\n  value: 'Preview the welcome screen',\n  onClick: async () => {\n    welcome.start(null, { welcome: true });\n    await new Promise((r) => setTimeout(r, 2500));\n    welcome.stop();\n  }\n});\n\nconst showRoute = await slice.build('Button', {\n  value: 'Preview a route change',\n  variant: 'outlined',\n  onClick: async () => {\n    route.start();\n    await new Promise((r) => setTimeout(r, 1500));\n    route.stop();\n  }\n});\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap';\nrow.append(showWelcome, showRoute);\nreturn row;"},{"label":"Every variant","expected":"four boxes, each covered by a running loader: the Slice logo, a ring, dots and a top bar with a label","kind":"script","content":"const grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;width:100%';\nfor (const variant of ['slice', 'spinner', 'dots', 'bar']) {\n  const box = document.createElement('div');\n  box.style.cssText = 'height:130px;border-radius:12px;border:1px solid var(--slice-border-raised,#ddd)';\n  grid.append(box);\n  const loading = await slice.build('Loading', { variant, label: variant, backdrop: variant === 'bar' ? 'none' : 'solid' });\n  loading.start(box);\n}\nreturn grid;"}];
  }

  async init() {
    this.markdownPath = "loading.md";
    this.markdownContent = "---\ntitle: Loading\nroute: /docs/feedback/loading\nnavLabel: Loading\nsection: Feedback\ngroup: Status\norder: 40\ndescription: Shows that the app is busy, over the whole page or one part of it. Four indicators (the Slice logo, a ring, dots, a top bar), backdrops, a label, a delay and a minimum time, and a welcome screen for the first load of the app, built in or your own.\ncomponent: LoadingDocumentation\ngenerate: true\ntags: [loading, spinner, progress, splash, welcome, feedback]\n---\n\n# Loading\n\n## Overview\n`Loading` shows that the app is working: over the **whole page** while a route loads, or over **one part** of it while a form saves, a card refreshes or a table fetches its next page.\n\nSlice also uses it for the app itself. With `\"loading\": { \"enabled\": true }` in `sliceConfig.json`, Slice builds one as `slice.loading`. It shows while the first page loads and on every route change. The rest of `sliceConfig.loading` decides how it looks, including a **welcome screen** for the first load of the app (see \"The app's loading screen\" below).\n\n### When to use it\n- **Work people have to wait for** before they can go on: saving a form, signing in, opening a page.\n- **One part of the page** that is out of date for a moment: a card refreshing, a list loading its next page. Cover only that part, so the rest of the page stays usable.\n- **The first load of the app**, as a branded welcome screen instead of a blank page.\n\n### When not to use it\n- **Work under a second.** Use `delayMs`, so fast work shows nothing at all. A flash of a spinner reads as a glitch.\n- **Content whose shape is known**, such as a list of cards, a profile or a table. Placeholders in that shape (a [Card](/docs/layout/card) with `loading: true`) feel faster than a spinner on top.\n- **Work that runs in the background**, such as autosave or sync. Say it quietly (a [Toast](/docs/feedback/toast), a status text) and do not block anything.\n- **A modal.** A `<dialog>` is in the browser's top layer, above any overlay. Show the busy state inside the [Modal](/docs/feedback/modal).\n\n## Core Behavior\n\n### Starting and stopping\n- `start(container?)` shows it: over `container`, the `container` prop, or the whole page. Over a container, the overlay covers only that box and blocks only it.\n- `stop()` fades it out and gives the container back its styles (see \"The way out\" below).\n- `active` does the same as a property: `true` starts, `false` stops.\n- While it shows, the container (or `<body>`) has `aria-busy=\"true\"`, and screen readers hear `label` (or \"Loading…\") once.\n\n### Timing\n- `delayMs`: work that ends before this does not show anything. 150–300 ms suits route changes and quick saves.\n- `minVisibleMs`: once shown, it stays at least this long, so it never blinks on and off.\n- A `start()` while a stop is waiting keeps it on screen, so back-to-back requests show one steady overlay.\n\n### The way out\n`stop()` does not cut to the page. The overlay **fades out where it is** — 220 ms, 320 ms for the welcome — so the content underneath comes in as a crossfade instead of appearing in one frame. That is what keeps a first load or a route change from reading as a jump. Only when the fade ends is the overlay removed and the container given back its styles.\n\n- The page is usable immediately: the fading overlay lets clicks through, and `active` turns `false` when the stop is applied, not when the fade ends.\n- A `start()` during the fade takes the same overlay back — no second entrance, no blink.\n- Nothing animates the page itself, so a page with its own entrance (a [Card](/docs/layout/card), a list) keeps it.\n- With **reduce motion** on, the fade stays (it only changes opacity); what goes away is the movement: the indicator does not lift, the welcome card does not step back.\n\n### Variants\n- `variant`:\n  - `'slice'` (default): the Slice.js logo, spinning;\n  - `'spinner'`: a ring;\n  - `'dots'`: three bouncing dots, softer, for small areas;\n  - `'bar'`: a thin line along the top. It has no backdrop and blocks nothing, so it suits route changes and uploads. `progress` (0–1) shows a known amount; without it, the line slides.\n- `label`: a short text under the indicator, such as \"Saving…\" or \"Signing you in…\".\n- `backdrop`: `'dim'` (default), `'blur'`, `'solid'` (hides what is underneath) or `'none'`.\n- `size`: `'sm'`, `'md'` (default) or `'lg'`.\n- With **reduce motion** on in the system, the indicators pulse slowly instead of spinning, entrances are off, and the fade out stays (it only changes opacity).\n\n## The app's loading screen\n`sliceConfig.json` configures the loader Slice builds for the app. Props passed to a `Loading` win over it, so the same keys work in both places.\n\n```json\n\"loading\": {\n  \"enabled\": true,\n  \"variant\": \"slice\",\n  \"delayMs\": 150,\n  \"minVisibleMs\": 300,\n  \"welcome\": {\n    \"kicker\": \"Welcome to\",\n    \"title\": \"Conclave\",\n    \"subtitle\": \"Getting your space ready\",\n    \"logo\": \"/images/logo.svg\",\n    \"minVisibleMs\": 1500\n  }\n}\n```\n\n`welcome` is shown **once**, on the first load of the page. It covers the page with the theme's background and shows the logo, the texts and the indicator. It stays at least `welcome.minVisibleMs` (1200 ms by default), and fades out when the first page is ready — the card steps back under the fade, so the app's first screen is already there as the brand goes. After that, route changes show the normal indicator.\n\n### Changing the welcome screen\nThe welcome screen is ordinary markup in `Loading.html`, styled in `Loading.css`. Your app has its own copy of the component, so you change the welcome screen the way you change any of your components:\n\n- **Edit `Loading.html`**: the logo, the texts, extra elements, an illustration. Elements marked `data-welcome=\"title\"` (or `kicker`, `subtitle`, `logo`) take their text from `sliceConfig` when it gives one, and are hidden when they end up empty. Text written in the markup itself is kept.\n- **Edit `Loading.css`**: colours, layout and animations. The selectors start with `slice-loading .slice-loading__…`, and the screen is on while the host has the class `is-welcome`, and fading out while it has `is-leaving`.\n- Turn it on with `\"welcome\": true` to show the markup exactly as you wrote it, or with an object to fill its texts from the config as well.\n\nThe theme is not loaded yet when the app starts, so the stylesheet gives every colour a fallback. Keep fallbacks in your own rules too (`var(--primary-color, #7c3aed)`), or the first frames show without colours.\n\n### A welcome component of your own\nInstead of editing `Loading`, `welcome.component` can name one of your components, with `welcome.props` as its props. It is built inside the overlay for the first load, in place of the card, and destroyed when the welcome ends.\n\n```json\n\"welcome\": { \"component\": \"AppSplash\", \"props\": { \"tagline\": \"Decide together\" }, \"minVisibleMs\": 1500 }\n```\n\n```js\n// src/Components/AppComponents/AppSplash/AppSplash.js\nexport default class AppSplash extends HTMLElement {\n  static props = { tagline: { type: 'string', default: '' } };\n  constructor(props) {\n    super();\n    slice.attachTemplate(this);   // your own markup and CSS, animations included\n    slice.controller.setComponentProps(this, props);\n  }\n}\ncustomElements.define('slice-app-splash', AppSplash);\n```\n\nThe indicator still shows under your component; set the welcome's look in your component's CSS.\n\n`start(null, { welcome: true })` shows the welcome again, for example after a sign-in. `{ welcome: false }` skips it.\n\n## Live Preview\n:::component name=\"Loading\"\n{\n  \"variant\": \"spinner\",\n  \"label\": \"Loading…\"\n}\n:::\n\n## Examples\n:::script label=\"Saving a form\" expected=\"a profile Card with two fields and a Save button; Save covers only the card with a 'Saving…' overlay for about a second and a half, then a toast says it was saved; a quick second save shows nothing thanks to delayMs\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst loading = await slice.build('Loading', { variant: 'spinner', label: 'Saving…', delayMs: 150, minVisibleMs: 400 });\n\nconst name = await slice.build('Input', { label: 'Full name', value: 'Ana Ruiz' });\nconst email = await slice.build('Input', { label: 'Email', value: 'ana@example.com', type: 'email' });\nconst fields = document.createElement('div');\nfields.style.cssText = 'display:grid;gap:14px';\nfields.append(name, email);\n\nlet fast = false;\nconst card = await slice.build('Card', {\n  title: 'Profile',\n  subtitle: 'Shown to your team',\n  content: fields,\n  actions: [{\n    value: 'Save',\n    onClick: async () => {\n      loading.start(card);\n      // A pretend request: slow the first time, fast after.\n      await new Promise((r) => setTimeout(r, fast ? 80 : 1500));\n      fast = true;\n      loading.stop();\n      toasts.show('Profile saved', { type: 'success' });\n    }\n  }]\n});\ncard.style.maxWidth = '420px';\nreturn card;\n:::\n\n:::script label=\"Uploading with a progress bar\" expected=\"a Files panel with three files and an Upload button; the upload shows a bar along the top of the panel that fills from 0 to 100% with a label counting the files, without blocking the list\"\nconst files = ['Q3 report.pdf', 'Team photo.jpg', 'Budget.xlsx'];\nconst loading = await slice.build('Loading', { variant: 'bar', progress: 0 });\n\nconst list = document.createElement('ul');\nlist.style.cssText = 'margin:0;padding:0;list-style:none;display:grid;gap:8px';\nfor (const name of files) {\n  const li = document.createElement('li');\n  li.style.cssText = 'display:flex;justify-content:space-between;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--primary-color) 6%,transparent)';\n  li.innerHTML = `<span>${name}</span><span style=\"opacity:.6\">Waiting</span>`;\n  list.append(li);\n}\n\nconst panel = document.createElement('section');\npanel.style.cssText = 'display:grid;gap:12px;width:100%;max-width:420px;padding:16px;border:1px solid var(--slice-border-raised,#ddd);border-radius:14px';\npanel.innerHTML = '<h3 style=\"margin:0\">Files</h3>';\npanel.append(list);\n\nconst upload = await slice.build('Button', {\n  value: 'Upload',\n  icon: 'upload',\n  onClick: async () => {\n    upload.disabled = true;\n    loading.progress = 0;\n    loading.start(panel);\n    for (let i = 0; i < files.length; i++) {\n      loading.label = `Uploading ${i + 1} of ${files.length}…`;\n      for (let step = 1; step <= 10; step++) {\n        await new Promise((r) => setTimeout(r, 70));\n        loading.progress = (i + step / 10) / files.length;\n      }\n      list.children[i].lastElementChild.textContent = 'Done';\n    }\n    loading.label = '';\n    loading.stop();\n    upload.disabled = false;\n  }\n});\npanel.append(upload);\nreturn panel;\n:::\n\n:::script label=\"Refreshing one card at a time\" expected=\"three metric cards, each with a refresh button; refreshing one blurs only that card with dots while it loads, and the other cards stay usable\"\nconst metrics = [\n  { title: 'Revenue', value: '$48,210', icon: 'dollar' },\n  { title: 'Orders', value: '1,284', icon: 'cart' },\n  { title: 'Visitors', value: '32,911', icon: 'users' }\n];\n\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;width:100%';\n\nfor (const metric of metrics) {\n  const loading = await slice.build('Loading', { variant: 'dots', backdrop: 'blur', size: 'sm', minVisibleMs: 600 });\n  const value = document.createElement('div');\n  value.style.cssText = 'font-size:1.6rem;font-weight:700';\n  value.textContent = metric.value;\n  const card = await slice.build('Card', {\n    title: metric.title,\n    headerIcon: metric.icon,\n    content: value,\n    actions: [{\n      value: 'Refresh', variant: 'ghost', icon: 'refresh', size: 'sm',\n      onClick: async ({ card: target }) => {\n        loading.start(target);\n        await new Promise((r) => setTimeout(r, 900));\n        value.textContent = metric.value.replace(/\\d(?=\\D*$)/, (d) => String((Number(d) + 1) % 10));\n        loading.stop();\n      }\n    }]\n  });\n  grid.append(card);\n}\nreturn grid;\n:::\n\n:::script label=\"The welcome screen\" expected=\"two buttons: one shows the built-in welcome screen (kicker, title, subtitle and the Slice logo spinning under the card) for two and a half seconds, then it fades out; the other shows the bar variant along the top of the page, as for a route change\"\nconst welcome = await slice.build('Loading', {\n  welcome: { kicker: 'Welcome to', title: 'Conclave', subtitle: 'Getting your space ready', minVisibleMs: 0 }\n});\nconst route = await slice.build('Loading', { variant: 'bar' });\n\nconst showWelcome = await slice.build('Button', {\n  value: 'Preview the welcome screen',\n  onClick: async () => {\n    welcome.start(null, { welcome: true });\n    await new Promise((r) => setTimeout(r, 2500));\n    welcome.stop();\n  }\n});\n\nconst showRoute = await slice.build('Button', {\n  value: 'Preview a route change',\n  variant: 'outlined',\n  onClick: async () => {\n    route.start();\n    await new Promise((r) => setTimeout(r, 1500));\n    route.stop();\n  }\n});\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap';\nrow.append(showWelcome, showRoute);\nreturn row;\n:::\n\n:::script label=\"Every variant\" expected=\"four boxes, each covered by a running loader: the Slice logo, a ring, dots and a top bar with a label\"\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;width:100%';\nfor (const variant of ['slice', 'spinner', 'dots', 'bar']) {\n  const box = document.createElement('div');\n  box.style.cssText = 'height:130px;border-radius:12px;border:1px solid var(--slice-border-raised,#ddd)';\n  grid.append(box);\n  const loading = await slice.build('Loading', { variant, label: variant, backdrop: variant === 'bar' ? 'none' : 'solid' });\n  loading.start(box);\n}\nreturn grid;\n:::\n\n## Best Practices\n:::tip\nSet `delayMs` for the app's loader (150–300 ms). Most route changes finish before it, and show nothing at all. Only slow ones show the indicator.\n:::\n\n:::tip\nCover the smallest part that is busy. A card refreshing should block that card, not the page, so people can keep working elsewhere.\n:::\n\n:::tip\nSay what is happening in `label` when it takes more than a moment: \"Saving…\", \"Uploading 2 of 3…\". A label tells people the app is still working, and what on.\n:::\n\n## Pitfalls\n:::warning\nAlways pair `start()` with `stop()`, also when the work fails: put the `stop()` in a `finally`. A loader that never stops blocks the page for good.\n:::\n\n:::warning\nKeep the welcome screen short. It is shown on every visit to the app, so `welcome.minVisibleMs` above 2 seconds makes the app feel slow, however nice it looks.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "\"loading\": {\n  \"enabled\": true,\n  \"variant\": \"slice\",\n  \"delayMs\": 150,\n  \"minVisibleMs\": 300,\n  \"welcome\": {\n    \"kicker\": \"Welcome to\",\n    \"title\": \"Conclave\",\n    \"subtitle\": \"Getting your space ready\",\n    \"logo\": \"/images/logo.svg\",\n    \"minVisibleMs\": 1500\n  }\n}",
               language: "json"
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
               value: "\"welcome\": { \"component\": \"AppSplash\", \"props\": { \"tagline\": \"Decide together\" }, \"minVisibleMs\": 1500 }",
               language: "json"
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
            const code = await slice.build('CodeVisualizer', {
               value: "// src/Components/AppComponents/AppSplash/AppSplash.js\nexport default class AppSplash extends HTMLElement {\n  static props = { tagline: { type: 'string', default: '' } };\n  constructor(props) {\n    super();\n    slice.attachTemplate(this);   // your own markup and CSS, animations included\n    slice.controller.setComponentProps(this, props);\n  }\n}\ncustomElements.define('slice-app-splash', AppSplash);",
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
            let props = {};
            if ("{\n  \"variant\": \"spinner\",\n  \"label\": \"Loading…\"\n}") {
               try {
                  props = JSON.parse("{\n  \"variant\": \"spinner\",\n  \"label\": \"Loading…\"\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Loading', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-10"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"backdrop\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"delayMs\",\"type\":\"number\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"minVisibleMs\",\"type\":\"number\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"progress\",\"type\":\"number\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"welcome\",\"type\":\"any\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"active\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"isActive\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"container\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"backdrop\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"delayMs\",\"type\":\"number\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"minVisibleMs\",\"type\":\"number\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"progress\",\"type\":\"number\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"welcome\",\"type\":\"any\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"active\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"isActive\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"container\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Card","path":"/docs/layout/card"},{"text":"Toast","path":"/docs/feedback/toast"},{"text":"Modal","path":"/docs/feedback/modal"},{"text":"Card","path":"/docs/layout/card"}];
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

customElements.define('slice-loadingdocumentation', LoadingDocumentation);
