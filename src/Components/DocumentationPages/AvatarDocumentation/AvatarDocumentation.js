export default class AvatarDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Comments","expected":"a comment thread: each comment has the author's avatar (a picture, initials when the picture is missing or broken), their name, the time and the text","kind":"script","content":"const PHOTO = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 40 40\"><rect width=\"40\" height=\"40\" fill=\"#0ea5e9\"/><circle cx=\"20\" cy=\"16\" r=\"7\" fill=\"#e0f2fe\"/><rect x=\"8\" y=\"26\" width=\"24\" height=\"14\" rx=\"7\" fill=\"#e0f2fe\"/></svg>');\nconst comments = [\n  { name: 'Ana López', photo: PHOTO, time: '9:12', text: 'I moved the release to Thursday so QA has a full day.' },\n  { name: 'Lucas Molina', photo: '/missing/lucas.png', time: '9:20', text: 'Works for me. The migration is ready.' },\n  { name: 'María Ruiz', photo: '', time: '9:31', text: 'I will write the release notes tonight.' }\n];\n\nconst thread = document.createElement('div');\nthread.style.cssText = 'display:grid;gap:14px;width:100%;max-width:520px';\nfor (const comment of comments) {\n  const row = document.createElement('div');\n  row.style.cssText = 'display:flex;gap:12px;align-items:flex-start';\n  const avatar = await slice.build('Avatar', { src: comment.photo, name: comment.name });\n  const body = document.createElement('div');\n  body.innerHTML = `<div><strong>${comment.name}</strong> <span style=\"opacity:.6;font-size:.85rem\">${comment.time}</span></div>\n    <p style=\"margin:4px 0 0\">${comment.text}</p>`;\n  row.append(avatar, body);\n  thread.append(row);\n}\nreturn thread;"},{"label":"Account button in a top bar","expected":"a top bar with the app name on the left and, on the right, the signed-in user's avatar with a green online dot and a badge of 3; clicking it opens a menu","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\nconst menu = await slice.build('DropDown', {\n  label: '',\n  caret: false,\n  variant: 'ghost',\n  ariaLabel: 'Account',\n  items: [\n    { type: 'label', label: 'Ana López' },\n    { label: 'Profile', icon: 'user', onClick: () => toasts.show('Profile') },\n    { label: 'Notifications', icon: 'bell', onClick: () => toasts.show('3 new notifications') },\n    'separator',\n    { label: 'Sign out', icon: 'arrow-right-to-bracket', danger: true, onClick: () => toasts.show('Signed out') }\n  ]\n});\nconst avatar = await slice.build('Avatar', { name: 'Ana López', status: 'online', badge: 3, size: 'sm' });\navatar.style.pointerEvents = 'none';\nmenu.querySelector('button')?.prepend(avatar);\n\nconst bar = document.createElement('header');\nbar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;width:100%;padding:8px 14px;border-radius:12px;background:color-mix(in srgb,var(--primary-color) 7%,transparent)';\nbar.innerHTML = '<strong>Northwind</strong>';\nbar.append(menu);\nreturn bar;"},{"label":"Sizes, shapes and statuses","expected":"five sizes from xs to xl; a row of rounded team avatars; the four statuses; the icon fallback","kind":"script","content":"const row = (label) => {\n  const r = document.createElement('div');\n  r.style.cssText = 'display:flex;align-items:center;gap:12px;flex-wrap:wrap';\n  r.innerHTML = `<span style=\"width:70px;font-size:.8rem;opacity:.7\">${label}</span>`;\n  return r;\n};\nconst sizes = row('Sizes');\nfor (const size of ['xs', 'sm', 'md', 'lg', 'xl']) sizes.append(await slice.build('Avatar', { name: 'Ana López', size }));\nconst teams = row('Teams');\nfor (const name of ['Design', 'Platform', 'Sales']) teams.append(await slice.build('Avatar', { name, shape: 'rounded' }));\nconst statuses = row('Status');\nfor (const status of ['online', 'away', 'busy', 'offline']) statuses.append(await slice.build('Avatar', { name: 'Lucas Molina', status }));\nconst fallback = row('No name');\nfallback.append(await slice.build('Avatar', {}), await slice.build('Avatar', { icon: 'users', shape: 'rounded' }));\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:14px';\nbox.append(sizes, teams, statuses, fallback);\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "avatar.md";
    this.markdownContent = "---\ntitle: Avatar\nroute: /docs/display/avatar\nnavLabel: Avatar\nsection: Display\ngroup: Basic\norder: 24\ndescription: A person, a team or a project as a small picture. Falls back to initials on a colour of their own, then to an icon; status dot, badge, sizes, shapes, and clickable.\ncomponent: AvatarDocumentation\ngenerate: true\ntags: [avatar, user, profile, photo, initials, status]\n---\n\n# Avatar\n\n## Overview\n`Avatar` shows who something belongs to: the person next to a comment, the owner of a task, the account in the top bar. It never shows a broken picture:\n\n1. the picture (`src`);\n2. if there is none, or it fails to load, the **initials** of `name` (\"Ana María López\" → \"AL\") on a colour that comes from the name, so the same person always has the same colour;\n3. without a name either, an icon (`icon`, `'user'` by default).\n\n### When to use it\n- **People in lists and feeds**: comments, messages, members, assignees.\n- **The signed-in account** in a Navbar or a SideMenu.\n- **Things with a face of their own**: teams, projects, companies (`shape: 'rounded'`).\n\n### When not to use it\n- **A large profile picture or a product photo.** Use an `<img>` or a [Card](/docs/layout/card) with `image`; an avatar is small and cropped.\n- **Several people in a row.** Use [AvatarGroup](/docs/display/avatar-group), which overlaps them and sums up the rest.\n\n## Core Behavior\n- `src`, `name` and `alt`. Screen readers hear `alt`, or the name, or \"Unknown user\", plus the status: \"Ana López, Online\".\n- While the picture loads, the initials are already there, so the place is never empty.\n- `status`: `'online'`, `'away'`, `'busy'` or `'offline'`. It shows as a dot on the corner.\n- `badge`: a number (3) or a word, or [Badge](/docs/display/badge) props (`{ value: 12, tone: 'accent' }`), on the top corner.\n- `onClick({ avatar, event })` makes it a button, and `path` (through `slice.router`) or `href` makes it a link. Either way it can be reached with Tab and used with Enter.\n- `color` replaces the colour that comes from the name.\n- `initials` and `showing` (`'image'`, `'initials'` or `'icon'`) say what it shows.\n\n## Looks\n- `size`: `'xs'` (24px), `'sm'` (32), `'md'` (40, default), `'lg'` (56), `'xl'` (80), or a number of pixels.\n- `shape`: `'circle'` (default) or `'rounded'`, for teams and projects.\n- `texts` translates the status names and \"Unknown user\".\n\n## Live Preview\n:::component name=\"Avatar\"\n{\n  \"name\": \"Ana López\",\n  \"status\": \"online\",\n  \"size\": \"lg\"\n}\n:::\n\n## Examples\n:::script label=\"Comments\" expected=\"a comment thread: each comment has the author's avatar (a picture, initials when the picture is missing or broken), their name, the time and the text\"\nconst PHOTO = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 40 40\"><rect width=\"40\" height=\"40\" fill=\"#0ea5e9\"/><circle cx=\"20\" cy=\"16\" r=\"7\" fill=\"#e0f2fe\"/><rect x=\"8\" y=\"26\" width=\"24\" height=\"14\" rx=\"7\" fill=\"#e0f2fe\"/></svg>');\nconst comments = [\n  { name: 'Ana López', photo: PHOTO, time: '9:12', text: 'I moved the release to Thursday so QA has a full day.' },\n  { name: 'Lucas Molina', photo: '/missing/lucas.png', time: '9:20', text: 'Works for me. The migration is ready.' },\n  { name: 'María Ruiz', photo: '', time: '9:31', text: 'I will write the release notes tonight.' }\n];\n\nconst thread = document.createElement('div');\nthread.style.cssText = 'display:grid;gap:14px;width:100%;max-width:520px';\nfor (const comment of comments) {\n  const row = document.createElement('div');\n  row.style.cssText = 'display:flex;gap:12px;align-items:flex-start';\n  const avatar = await slice.build('Avatar', { src: comment.photo, name: comment.name });\n  const body = document.createElement('div');\n  body.innerHTML = `<div><strong>${comment.name}</strong> <span style=\"opacity:.6;font-size:.85rem\">${comment.time}</span></div>\n    <p style=\"margin:4px 0 0\">${comment.text}</p>`;\n  row.append(avatar, body);\n  thread.append(row);\n}\nreturn thread;\n:::\n\n:::script label=\"Account button in a top bar\" expected=\"a top bar with the app name on the left and, on the right, the signed-in user's avatar with a green online dot and a badge of 3; clicking it opens a menu\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst menu = await slice.build('DropDown', {\n  label: '',\n  caret: false,\n  variant: 'ghost',\n  ariaLabel: 'Account',\n  items: [\n    { type: 'label', label: 'Ana López' },\n    { label: 'Profile', icon: 'user', onClick: () => toasts.show('Profile') },\n    { label: 'Notifications', icon: 'bell', onClick: () => toasts.show('3 new notifications') },\n    'separator',\n    { label: 'Sign out', icon: 'arrow-right-to-bracket', danger: true, onClick: () => toasts.show('Signed out') }\n  ]\n});\nconst avatar = await slice.build('Avatar', { name: 'Ana López', status: 'online', badge: 3, size: 'sm' });\navatar.style.pointerEvents = 'none';\nmenu.querySelector('button')?.prepend(avatar);\n\nconst bar = document.createElement('header');\nbar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;width:100%;padding:8px 14px;border-radius:12px;background:color-mix(in srgb,var(--primary-color) 7%,transparent)';\nbar.innerHTML = '<strong>Northwind</strong>';\nbar.append(menu);\nreturn bar;\n:::\n\n:::script label=\"Sizes, shapes and statuses\" expected=\"five sizes from xs to xl; a row of rounded team avatars; the four statuses; the icon fallback\"\nconst row = (label) => {\n  const r = document.createElement('div');\n  r.style.cssText = 'display:flex;align-items:center;gap:12px;flex-wrap:wrap';\n  r.innerHTML = `<span style=\"width:70px;font-size:.8rem;opacity:.7\">${label}</span>`;\n  return r;\n};\nconst sizes = row('Sizes');\nfor (const size of ['xs', 'sm', 'md', 'lg', 'xl']) sizes.append(await slice.build('Avatar', { name: 'Ana López', size }));\nconst teams = row('Teams');\nfor (const name of ['Design', 'Platform', 'Sales']) teams.append(await slice.build('Avatar', { name, shape: 'rounded' }));\nconst statuses = row('Status');\nfor (const status of ['online', 'away', 'busy', 'offline']) statuses.append(await slice.build('Avatar', { name: 'Lucas Molina', status }));\nconst fallback = row('No name');\nfallback.append(await slice.build('Avatar', {}), await slice.build('Avatar', { icon: 'users', shape: 'rounded' }));\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:14px';\nbox.append(sizes, teams, statuses, fallback);\nreturn box;\n:::\n\n## Best Practices\n:::tip\nAlways pass `name`, even with a picture. It is what screen readers hear, and what shows when the picture fails.\n:::\n\n:::tip\nUse `shape: 'rounded'` for teams, companies and projects, and circles for people. The shape tells them apart at a glance.\n:::\n\n## Pitfalls\n:::warning\nDo not pass a status the app cannot keep up to date. A green dot that stays green after the person left is worse than no dot.\n:::\n\n## Language\n\nThe built-in texts are `slice.avatar.*` keys with English and Spanish defaults, registered by\n`shared/text/texts.js` in the translator's lowest layer: an app dictionary always wins, and the\ncomponent keeps its English text when the translator is off.\nThe text prop `texts` still wins over the dictionary.\nKeys: `online`, `away`, `busy`, `offline`, `unknown`.\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"name\": \"Ana López\",\n  \"status\": \"online\",\n  \"size\": \"lg\"\n}") {
               try {
                  props = JSON.parse("{\n  \"name\": \"Ana López\",\n  \"status\": \"online\",\n  \"size\": \"lg\"\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Avatar', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Card","path":"/docs/layout/card"},{"text":"AvatarGroup","path":"/docs/display/avatar-group"},{"text":"Badge","path":"/docs/display/badge"}];
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

customElements.define('slice-avatardocumentation', AvatarDocumentation);
