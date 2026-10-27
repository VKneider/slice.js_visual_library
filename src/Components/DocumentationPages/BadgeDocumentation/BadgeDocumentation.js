export default class BadgeDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Orders: one status per row","expected":"a list of orders, each with the customer, the total and a status badge on the right: Paid in green, Pending in amber, Shipped in blue with a truck icon, Refunded in grey and Overdue in red filled","kind":"script","content":"const STATUS = {\n  paid: { label: 'Paid', tone: 'success', icon: 'check' },\n  pending: { label: 'Pending', tone: 'warning', icon: 'clock' },\n  shipped: { label: 'Shipped', tone: 'info', icon: 'truck' },\n  refunded: { label: 'Refunded', tone: 'neutral' },\n  overdue: { label: 'Overdue', tone: 'danger', variant: 'filled' }\n};\nconst orders = [\n  { id: 1042, customer: 'Ana López', total: '$129.00', status: 'paid' },\n  { id: 1041, customer: 'Lucas Molina', total: '$54.50', status: 'pending' },\n  { id: 1040, customer: 'María Ruiz', total: '$310.00', status: 'shipped' },\n  { id: 1039, customer: 'Andrés Bello', total: '$18.90', status: 'refunded' },\n  { id: 1038, customer: 'Sofía Rey', total: '$740.00', status: 'overdue' }\n];\n\nconst list = await slice.build('DataList', {\n  items: orders,\n  title: (o) => `#${o.id} · ${o.customer}`,\n  description: 'total',\n  badge: (o) => STATUS[o.status],\n  searchable: true\n});\nlist.style.width = '100%';\nreturn list;"},{"label":"Counts on navigation","expected":"a row of three ghost buttons: Inbox with a red 12, Reviews with a soft 3, Archive with nothing because its count is 0; clicking Inbox clears its count","kind":"script","content":"const bar = document.createElement('nav');\nbar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';\n\nconst tabs = [\n  { label: 'Inbox', count: 12, tone: 'danger', variant: 'filled' },\n  { label: 'Reviews', count: 3, tone: 'accent' },\n  { label: 'Archive', count: 0 }\n];\nfor (const tab of tabs) {\n  const counter = await slice.build('Badge', { value: tab.count, tone: tab.tone || 'neutral', variant: tab.variant || 'soft', size: 'sm' });\n  const button = await slice.build('Button', {\n    value: tab.label,\n    variant: 'ghost',\n    onClick: () => { counter.value = 0; }\n  });\n  button.querySelector('button')?.append(' ', counter);\n  bar.append(button);\n}\nreturn bar;"},{"label":"Live status","expected":"a service status panel: API with a pulsing green Operational, Database with an amber Degraded, Webhooks with a red Down; a Live badge in the header; a Simulate button that cycles the API status","kind":"script","content":"const panel = document.createElement('section');\npanel.style.cssText = 'display:grid;gap:10px;width:100%;max-width:420px;padding:16px;border-radius:12px;border:1px solid var(--primary-color-shade, #ddd)';\nconst head = document.createElement('header');\nhead.style.cssText = 'display:flex;justify-content:space-between;align-items:center';\nhead.innerHTML = '<strong>System status</strong>';\nhead.append(await slice.build('Badge', { label: 'Live', tone: 'danger', variant: 'filled', indicator: true, pulse: true, size: 'sm' }));\npanel.append(head);\n\nconst STATES = [\n  { label: 'Operational', tone: 'success', pulse: true },\n  { label: 'Degraded', tone: 'warning', pulse: false },\n  { label: 'Down', tone: 'danger', pulse: false }\n];\nconst services = [['API', 0], ['Database', 1], ['Webhooks', 2]];\nconst badges = [];\nfor (const [name, state] of services) {\n  const row = document.createElement('div');\n  row.style.cssText = 'display:flex;justify-content:space-between;align-items:center';\n  row.textContent = name;\n  const badge = await slice.build('Badge', { ...STATES[state], indicator: true });\n  badges.push(badge);\n  row.append(badge);\n  panel.append(row);\n}\n\nlet api = 0;\nconst simulate = await slice.build('Button', {\n  value: 'Simulate API change',\n  variant: 'outlined',\n  onClick: () => {\n    api = (api + 1) % STATES.length;\n    Object.assign(badges[0], STATES[api]);\n  }\n});\npanel.append(simulate);\nreturn panel;"},{"label":"Tones, variants and sizes","expected":"a grid: six tones in rows, each in soft, filled and outlined; then the three sizes; then a dot, a rounded version tag and two custom colours","kind":"script","content":"const grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:auto repeat(3, auto);gap:10px 16px;align-items:center;justify-items:start';\ngrid.innerHTML = '<span></span><small>soft</small><small>filled</small><small>outlined</small>';\nfor (const tone of ['neutral', 'accent', 'success', 'warning', 'danger', 'info']) {\n  const name = document.createElement('small');\n  name.textContent = tone;\n  grid.append(name);\n  for (const variant of ['soft', 'filled', 'outlined']) {\n    grid.append(await slice.build('Badge', { label: tone[0].toUpperCase() + tone.slice(1), tone, variant }));\n  }\n}\n\nconst more = document.createElement('div');\nmore.style.cssText = 'display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:16px';\nfor (const size of ['sm', 'md', 'lg']) more.append(await slice.build('Badge', { label: size, tone: 'accent', size }));\nmore.append(\n  await slice.build('Badge', { dot: true, tone: 'danger', label: 'Unread' }),\n  await slice.build('Badge', { label: 'v3.4.1', shape: 'rounded' }),\n  await slice.build('Badge', { label: 'Design', color: '#db2777' }),\n  await slice.build('Badge', { label: 'Platform', color: '#0d9488', icon: 'tag' })\n);\n\nconst box = document.createElement('div');\nbox.append(grid, more);\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "badge.md";
    this.markdownContent = "---\ntitle: Badge\nroute: /docs/display/badge\nnavLabel: Badge\nsection: Display\ngroup: Basic\norder: 25\ndescription: A status, a count or a mark next to what it describes. Tone for the meaning, variant for the loudness; icon, live indicator, dot, sizes and colours of your own.\ncomponent: BadgeDocumentation\ngenerate: true\ntags: [badge, pill, status, count, dot, tag, label]\n---\n\n# Badge\n\n## Overview\n`Badge` says, in one or two words, what state something is in: an order that is **Paid**, a server that is **Down**, **12** unread messages, a feature that is **New**. It sits next to the thing it describes: a row, a tab, a title, a button, an avatar.\n\nTwo separate choices, as everywhere else in the library:\n\n- **`tone`** is what it **means**: `neutral`, `accent`, `success`, `warning`, `danger`, `info`. Each one follows its theme colour, so it means the same in any theme.\n- **`variant`** is how **loud** it is, with [Button](/docs/input/button)'s names: `soft` (a tint, the default), `filled` (the colour itself, for what must be seen) or `outlined` (just a line, for many badges side by side).\n\n### When to use it\n- **Statuses** of records in lists and tables: Paid / Pending / Overdue, Active / Away, Draft / Published.\n- **Counts** that ask for attention: unread messages, pending reviews, items in a cart.\n- **Live states**: \"● Live\", \"● Online\", \"● Deploying\", with `indicator` and `pulse`.\n- **Short marks**: New, Beta, Pro, a version number (`shape: 'rounded'`).\n\n### When not to use it\n- **Something the user can click or remove.** A badge is not a button. Use a [Button](/docs/input/button), or a chip/tag input when tags are edited.\n- **A message with a sentence in it.** Use a [Toast](/docs/feedback/toast) or an inline alert; a badge is one or two words.\n- **A person.** Use [Avatar](/docs/display/avatar), which already has `status` and its own `badge`.\n- **Many colours with no meaning.** Seven coloured pills in one row is noise. Keep `neutral` for the ordinary state and save colour for what needs noticing.\n\n## Core Behavior\n- **`label`**: the text. **`value`**: a number, which wins over `label` and is capped by **`max`** (99 by default, so 120 shows \"99+\").\n- A count of `0` hides the badge, so a \"0 unread\" bubble never shows. **`showZero: true`** keeps it.\n- With nothing to show (no label, no value, no icon), the badge hides itself.\n- **`icon`**: an [Icon](/docs/display/icon) name before the text. It is built and destroyed with the badge.\n- **`indicator`**: a small dot before the text, for a state that is live. **`pulse`** makes it breathe; with reduced motion it stays still.\n- **`dot`**: only a dot, no text. `label` becomes what screen readers hear (\"New\" if there is none).\n- **`color`**: a colour of your own (a category, a team, a project) instead of a tone. The text is mixed toward the page's text colour so it stays readable.\n- Every prop can change after building: `badge.value = 13`, `badge.tone = 'success'`.\n\n## Looks\n- `size`: `'sm'` (20px), `'md'` (24px, default), `'lg'` (30px).\n- `shape`: `'pill'` (default) for states and counts, `'rounded'` for labels that are not states (versions, categories, keys).\n- In a line of text, the badge sits on the text's optical centre at any font size.\n\n:::note\nBefore tones, `variant` took the meaning (`variant: 'success'`). That still works: the badge takes it as the tone and logs one note. Change it to `tone: 'success'` when you can.\n:::\n\n## Live Preview\n:::component name=\"Badge\"\n{\n  \"label\": \"Paid\",\n  \"tone\": \"success\",\n  \"icon\": \"check\"\n}\n:::\n\n## Examples\n:::script label=\"Orders: one status per row\" expected=\"a list of orders, each with the customer, the total and a status badge on the right: Paid in green, Pending in amber, Shipped in blue with a truck icon, Refunded in grey and Overdue in red filled\"\nconst STATUS = {\n  paid: { label: 'Paid', tone: 'success', icon: 'check' },\n  pending: { label: 'Pending', tone: 'warning', icon: 'clock' },\n  shipped: { label: 'Shipped', tone: 'info', icon: 'truck' },\n  refunded: { label: 'Refunded', tone: 'neutral' },\n  overdue: { label: 'Overdue', tone: 'danger', variant: 'filled' }\n};\nconst orders = [\n  { id: 1042, customer: 'Ana López', total: '$129.00', status: 'paid' },\n  { id: 1041, customer: 'Lucas Molina', total: '$54.50', status: 'pending' },\n  { id: 1040, customer: 'María Ruiz', total: '$310.00', status: 'shipped' },\n  { id: 1039, customer: 'Andrés Bello', total: '$18.90', status: 'refunded' },\n  { id: 1038, customer: 'Sofía Rey', total: '$740.00', status: 'overdue' }\n];\n\nconst list = await slice.build('DataList', {\n  items: orders,\n  title: (o) => `#${o.id} · ${o.customer}`,\n  description: 'total',\n  badge: (o) => STATUS[o.status],\n  searchable: true\n});\nlist.style.width = '100%';\nreturn list;\n:::\n\n:::script label=\"Counts on navigation\" expected=\"a row of three ghost buttons: Inbox with a red 12, Reviews with a soft 3, Archive with nothing because its count is 0; clicking Inbox clears its count\"\nconst bar = document.createElement('nav');\nbar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';\n\nconst tabs = [\n  { label: 'Inbox', count: 12, tone: 'danger', variant: 'filled' },\n  { label: 'Reviews', count: 3, tone: 'accent' },\n  { label: 'Archive', count: 0 }\n];\nfor (const tab of tabs) {\n  const counter = await slice.build('Badge', { value: tab.count, tone: tab.tone || 'neutral', variant: tab.variant || 'soft', size: 'sm' });\n  const button = await slice.build('Button', {\n    value: tab.label,\n    variant: 'ghost',\n    onClick: () => { counter.value = 0; }\n  });\n  button.querySelector('button')?.append(' ', counter);\n  bar.append(button);\n}\nreturn bar;\n:::\n\n:::script label=\"Live status\" expected=\"a service status panel: API with a pulsing green Operational, Database with an amber Degraded, Webhooks with a red Down; a Live badge in the header; a Simulate button that cycles the API status\"\nconst panel = document.createElement('section');\npanel.style.cssText = 'display:grid;gap:10px;width:100%;max-width:420px;padding:16px;border-radius:12px;border:1px solid var(--primary-color-shade, #ddd)';\nconst head = document.createElement('header');\nhead.style.cssText = 'display:flex;justify-content:space-between;align-items:center';\nhead.innerHTML = '<strong>System status</strong>';\nhead.append(await slice.build('Badge', { label: 'Live', tone: 'danger', variant: 'filled', indicator: true, pulse: true, size: 'sm' }));\npanel.append(head);\n\nconst STATES = [\n  { label: 'Operational', tone: 'success', pulse: true },\n  { label: 'Degraded', tone: 'warning', pulse: false },\n  { label: 'Down', tone: 'danger', pulse: false }\n];\nconst services = [['API', 0], ['Database', 1], ['Webhooks', 2]];\nconst badges = [];\nfor (const [name, state] of services) {\n  const row = document.createElement('div');\n  row.style.cssText = 'display:flex;justify-content:space-between;align-items:center';\n  row.textContent = name;\n  const badge = await slice.build('Badge', { ...STATES[state], indicator: true });\n  badges.push(badge);\n  row.append(badge);\n  panel.append(row);\n}\n\nlet api = 0;\nconst simulate = await slice.build('Button', {\n  value: 'Simulate API change',\n  variant: 'outlined',\n  onClick: () => {\n    api = (api + 1) % STATES.length;\n    Object.assign(badges[0], STATES[api]);\n  }\n});\npanel.append(simulate);\nreturn panel;\n:::\n\n:::script label=\"Tones, variants and sizes\" expected=\"a grid: six tones in rows, each in soft, filled and outlined; then the three sizes; then a dot, a rounded version tag and two custom colours\"\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:auto repeat(3, auto);gap:10px 16px;align-items:center;justify-items:start';\ngrid.innerHTML = '<span></span><small>soft</small><small>filled</small><small>outlined</small>';\nfor (const tone of ['neutral', 'accent', 'success', 'warning', 'danger', 'info']) {\n  const name = document.createElement('small');\n  name.textContent = tone;\n  grid.append(name);\n  for (const variant of ['soft', 'filled', 'outlined']) {\n    grid.append(await slice.build('Badge', { label: tone[0].toUpperCase() + tone.slice(1), tone, variant }));\n  }\n}\n\nconst more = document.createElement('div');\nmore.style.cssText = 'display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:16px';\nfor (const size of ['sm', 'md', 'lg']) more.append(await slice.build('Badge', { label: size, tone: 'accent', size }));\nmore.append(\n  await slice.build('Badge', { dot: true, tone: 'danger', label: 'Unread' }),\n  await slice.build('Badge', { label: 'v3.4.1', shape: 'rounded' }),\n  await slice.build('Badge', { label: 'Design', color: '#db2777' }),\n  await slice.build('Badge', { label: 'Platform', color: '#0d9488', icon: 'tag' })\n);\n\nconst box = document.createElement('div');\nbox.append(grid, more);\nreturn box;\n:::\n\n## Theming\nEach tone uses its theme colour (`--primary-color` for `accent`, `--success-color`, `--warning-color`, `--danger-color`, `--info-color`, `--medium-color` for `neutral`) and a **readable shade** of it for the text: the version of the colour that clears 4.5:1 against its own tint, and that `filled` uses as its fill.\n\nThe shade has to move in opposite directions per theme. Light darkens the colour toward black; dark **lightens it toward white**, because a dark theme's status colours are already light. Declare the shades on `:root`:\n\n```css\n:root {\n  /* light theme: toward black */\n  --primary-color-readable: color-mix(in srgb, var(--primary-color) 88%, #000);\n  --success-color-readable: color-mix(in srgb, var(--success-color) 72%, #000);\n  --warning-color-readable: color-mix(in srgb, var(--warning-color) 66%, #000);\n  --danger-color-readable: color-mix(in srgb, var(--danger-color) 84%, #000);\n  --info-color-readable: color-mix(in srgb, var(--info-color) 64%, #000);\n}\n\n:root[data-theme='DARK'] {\n  /* dark theme: toward white */\n  --primary-color-readable: color-mix(in srgb, var(--primary-color) 92%, #fff);\n  --success-color-readable: color-mix(in srgb, var(--success-color) 92%, #fff);\n  --warning-color-readable: color-mix(in srgb, var(--warning-color) 92%, #fff);\n  --danger-color-readable: color-mix(in srgb, var(--danger-color) 92%, #fff);\n  --info-color-readable: color-mix(in srgb, var(--info-color) 80%, #fff);\n}\n```\n\n:::tip\nThe `-readable` tokens are **optional for a light theme**: `Badge.css` carries the light values as fallbacks, so a fresh app's theme already passes. They are **needed for a dark theme**, where the fallbacks would be too dark. The specs measure every tone in every variant, in both themes, against 4.5:1.\n:::\n\n:::warning\n`--primary-color-shade` is a different token: a border and surface tone of the brand. `--primary-color-readable` is the text tone. The `-readable` suffix keeps the two apart.\n:::\n\nTo restyle one badge or all of them, the per-badge variables are `--slice-badge-color`, `--slice-badge-ink` (text and fill), `--slice-badge-tint` (how strong the soft background is), `--slice-badge-height`, `--slice-badge-font`, `--slice-badge-pad` and `--slice-badge-dot`.\n\n## Best Practices\n:::tip\nMap your statuses to badges in one place (`const STATUS = { paid: { label, tone, icon } }`) and pass `STATUS[row.status]`. Every screen then shows the same state the same way.\n:::\n\n:::tip\nUse `filled` only for what must be seen before anything else (Overdue, Down, a count of unread messages). If everything is filled, nothing stands out.\n:::\n\n:::tip\nOn top of a button or an avatar, position the badge in your own layout (`position: absolute`). `Badge` styles itself, not its place next to a sibling. [Avatar](/docs/display/avatar) already does it with its `badge` prop.\n:::\n\n## Pitfalls\n:::warning\nColour alone is not enough. Keep a `label` or a `value`: red and green look different to most people, but only the word tells a colour-blind user which is which. A `dot` needs a `label` too, for screen readers.\n:::\n\n:::warning\nDo not show a live `pulse` the app cannot keep up to date. A green \"● Online\" that stays on after the server went down is worse than no badge.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"label\": \"Paid\",\n  \"tone\": \"success\",\n  \"icon\": \"check\"\n}") {
               try {
                  props = JSON.parse("{\n  \"label\": \"Paid\",\n  \"tone\": \"success\",\n  \"icon\": \"check\"\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Badge', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: ":root {\n  /* light theme: toward black */\n  --primary-color-readable: color-mix(in srgb, var(--primary-color) 88%, #000);\n  --success-color-readable: color-mix(in srgb, var(--success-color) 72%, #000);\n  --warning-color-readable: color-mix(in srgb, var(--warning-color) 66%, #000);\n  --danger-color-readable: color-mix(in srgb, var(--danger-color) 84%, #000);\n  --info-color-readable: color-mix(in srgb, var(--info-color) 64%, #000);\n}\n\n:root[data-theme='DARK'] {\n  /* dark theme: toward white */\n  --primary-color-readable: color-mix(in srgb, var(--primary-color) 92%, #fff);\n  --success-color-readable: color-mix(in srgb, var(--success-color) 92%, #fff);\n  --warning-color-readable: color-mix(in srgb, var(--warning-color) 92%, #fff);\n  --danger-color-readable: color-mix(in srgb, var(--danger-color) 92%, #fff);\n  --info-color-readable: color-mix(in srgb, var(--info-color) 80%, #fff);\n}",
               language: "css"
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
         const links = [{"text":"Button","path":"/docs/input/button"},{"text":"Button","path":"/docs/input/button"},{"text":"Toast","path":"/docs/feedback/toast"},{"text":"Avatar","path":"/docs/display/avatar"},{"text":"Icon","path":"/docs/display/icon"},{"text":"Avatar","path":"/docs/display/avatar"}];
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

customElements.define('slice-badgedocumentation', BadgeDocumentation);
