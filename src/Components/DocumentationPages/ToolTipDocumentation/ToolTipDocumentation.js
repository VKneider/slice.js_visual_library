export default class ToolTipDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Editor toolbar","expected":"a toolbar of buttons, each with its name and shortcut; after the first tooltip, moving along the toolbar shows the others at once; Tab moves button to button with no extra stops","kind":"script","content":"const tools = [\n  { label: 'Bold', icon: 'letter-bold', shortcut: '⌘B' },\n  { label: 'Italic', icon: 'letter-italic', shortcut: '⌘I' },\n  { label: 'Underline', icon: 'letter-underline', shortcut: '⌘U' },\n  { label: 'Insert link', icon: 'link', shortcut: '⌘K' },\n  { label: 'Undo', icon: 'undo', shortcut: '⌘Z' }\n];\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst bar = document.createElement('div');\nbar.setAttribute('role', 'toolbar');\nbar.setAttribute('aria-label', 'Formatting');\nbar.style.cssText = 'display:inline-flex;gap:4px;padding:6px;border:1px solid var(--slice-border-raised);border-radius:12px';\n\nfor (const tool of tools) {\n  // Icon only: no label on screen, the name in ariaLabel.\n  const button = await slice.build('Button', {\n    value: '', ariaLabel: tool.label, icon: tool.icon, variant: 'ghost', size: 'sm',\n    onClick: () => toasts.show(tool.label, { duration: 1200 })\n  });\n  const tip = await slice.build('ToolTip', { text: tool.label, shortcut: tool.shortcut, placement: 'bottom' });\n  tip.appendChild(button);\n  bar.appendChild(tip);\n}\nreturn bar;"},{"label":"Why is it disabled?","expected":"a disabled Publish button whose tooltip says the title is missing (on hover, or by tabbing to it); typing a title enables it and the tooltip changes to its shortcut","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\nconst publish = await slice.build('Button', {\n  value: 'Publish', icon: 'upload', disabled: true,\n  onClick: () => toasts.show(`Published “${title.value}”`, { type: 'success' })\n});\nconst tip = await slice.build('ToolTip', { text: 'Add a title to publish', placement: 'right' });\ntip.appendChild(publish);\n\nconst title = await slice.build('Input', {\n  label: 'Title',\n  onChange: (value) => {\n    const ready = value.trim().length > 0;\n    publish.disabled = !ready;\n    // The same tooltip, saying something else once the button works.\n    tip.text = ready ? 'Publish now' : 'Add a title to publish';\n    tip.shortcut = ready ? '⌘↵' : '';\n  }\n});\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:14px;max-width:420px;width:100%;justify-items:start';\nbox.append(title, tip);\nreturn box;"},{"label":"A field with a toggletip","expected":"a phone field with an ⓘ beside its label; clicking the ⓘ explains why the number is asked for, with a link Tab can reach; Escape closes it and returns to the ⓘ","kind":"script","content":"const why = document.createElement('div');\nwhy.innerHTML = 'We only use it to text you about this delivery. <a href=\"#privacy\">Read the privacy policy</a>';\n\nconst info = await slice.build('ToolTip', { mode: 'toggletip', title: 'Why we ask', content: why, variant: 'light', placement: 'top-start' });\nconst button = await slice.build('Button', { value: '', ariaLabel: 'Why we ask for your phone', icon: 'info-circle', variant: 'ghost', size: 'sm' });\ninfo.appendChild(button);\n\nconst label = document.createElement('div');\nlabel.style.cssText = 'display:flex;align-items:center;gap:2px;font-weight:600;font-size:.9rem';\nlabel.append('Phone', info);\n\nconst phone = await slice.build('Input', { ariaLabel: 'Phone', type: 'tel', placeholder: '+58 412 000 0000', labelPlacement: 'above' });\nconst card = await slice.build('Card', { title: 'Delivery details', content: [label, phone] });\ncard.style.maxWidth = '420px';\nreturn card;"},{"label":"Copy with feedback","expected":"a Copy link button; clicking it copies the link and the tooltip says 'Copied!' for a moment, then goes back to 'Copy link'","kind":"script","content":"const link = 'https://slice.dev/invite/7f3a';\nconst field = await slice.build('Input', { value: link, readonly: true, ariaLabel: 'Invite link' });\nfield.style.flex = '1';\nconst tip = await slice.build('ToolTip', { text: 'Copy link', placement: 'top' });\nconst copy = await slice.build('Button', {\n  value: 'Copy', icon: 'file-clone', variant: 'outlined',\n  onClick: async () => {\n    try { await navigator.clipboard.writeText(link); } catch { /* the docs page may not allow it */ }\n    tip.text = 'Copied!';\n    tip.show();\n    setTimeout(() => { tip.hide(); tip.text = 'Copy link'; }, 1200);\n  }\n});\ntip.appendChild(copy);\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:8px;align-items:center;max-width:480px;width:100%';\nrow.append(field, tip);\nreturn row;"},{"label":"Inside a Modal","expected":"a button opens a Modal whose icon buttons have tooltips, shown above the dialog; the first Escape closes the tooltip, the second the Modal","kind":"script","content":"const open = async () => {\n  const actions = document.createElement('div');\n  actions.style.cssText = 'display:flex;gap:8px';\n  for (const [label, icon] of [['Download', 'download'], ['Share', 'share-nodes'], ['Move to trash', 'trash-bin']]) {\n    const button = await slice.build('Button', { value: '', ariaLabel: label, icon, variant: 'outlined', size: 'sm' });\n    const tip = await slice.build('ToolTip', { text: label, showDelay: 200 });\n    tip.appendChild(button);\n    actions.appendChild(tip);\n  }\n  const modal = await slice.build('Modal', { title: 'quarterly-report.pdf', icon: 'file-lines', content: ['2.4 MB · edited yesterday', actions], destroyOnClose: true });\n  document.body.appendChild(modal);\n  modal.show();\n};\nreturn await slice.build('Button', { value: 'Open file', onClick: open });"},{"label":"Looks at a glance","expected":"the three variants, the small size, a rich tooltip with a title, and twelve placements; hover each to see it","kind":"script","content":"const box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:22px;width:100%';\nconst row = () => {\n  const r = document.createElement('div');\n  r.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px';\n  box.appendChild(r);\n  return r;\n};\nconst add = async (target, label, props) => {\n  const tip = await slice.build('ToolTip', { showDelay: 0, ...props });\n  tip.appendChild(await slice.build('Button', { value: label, variant: 'outlined', size: 'sm' }));\n  target.appendChild(tip);\n};\nconst looks = row();\nfor (const variant of ['inverse', 'light', 'accent']) await add(looks, variant, { text: `variant: '${variant}'`, variant });\nawait add(looks, 'size sm', { text: 'A small tooltip', size: 'sm' });\nawait add(looks, 'rich', { title: 'Version history', text: 'See every change, and restore an earlier version.', shortcut: '⌥⌘H', maxWidth: 240 });\nawait add(looks, 'no arrow', { text: 'No arrow', arrow: false });\n\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(4,max-content);gap:10px;padding:30px 0';\nfor (const side of ['top', 'bottom', 'left', 'right']) {\n  for (const align of ['-start', '', '-end']) await add(grid, `${side}${align}`, { text: `placement: '${side}${align}'`, placement: `${side}${align}` });\n}\nbox.appendChild(grid);\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "tooltip.md";
    this.markdownContent = "---\ntitle: ToolTip\nroute: /docs/display/tooltip\nnavLabel: ToolTip\nsection: Display\ngroup: Overlay\norder: 10\ndescription: Explains a control on hover, keyboard focus or a long press. Title, text and shortcut, twelve placements with an arrow that follows the trigger, three looks, a toggletip mode for an ⓘ with links, and it shows above modals.\ncomponent: ToolTipDocumentation\ngenerate: true\ntags: [tooltip, toggletip, hint, overlay, display]\n---\n\n# ToolTip\n\n## Overview\nA `ToolTip` explains the control it wraps: what an icon button does, the keyboard shortcut, or why a button is disabled. It shows on hover after a short delay, on keyboard focus right away, and on a long press on touch screens.\n\n```javascript\nconst tip = await slice.build('ToolTip', { text: 'Bold', shortcut: '⌘B' });\ntip.appendChild(boldButton);\n```\n\n### When to use it\n- Icon buttons, whose icon alone may not say enough.\n- Keyboard shortcuts, next to the action's name.\n- A disabled control, to say why it is disabled.\n- An abbreviation or a term, wrapped in text.\n\n### When not to use it\n- **Information people need to complete a task.** Put it on the page, as a field's `help` text for example. A tooltip is hidden until someone looks for it.\n- **Anything to click** (a link, a button) belongs in a **toggletip** (`mode: 'toggletip'`), or a [Modal](/docs/feedback/modal).\n- **Many plain-text tooltips** on one page (a toolbar, a table) are cheaper with [ToolTipProvider](/docs/services/tooltip-provider), which shares one bubble.\n\n## Core Behavior\n\n### The trigger\nWhatever you put inside the ToolTip is its trigger.\n- **A focusable control** (a Button, a link, an input) keeps its own place in the Tab order and gets `aria-describedby`. The ToolTip adds no tab stop, so a toolbar is not twice as long to tab through.\n- **Text, or a disabled control,** has nothing to focus, so the ToolTip itself becomes focusable. That is how a disabled button can still say why, to the mouse and to the keyboard.\n\n### Showing and hiding\n- **Hover:** shows after `showDelay` (400ms by default), so it does not flash while the pointer crosses the page. Once one tooltip has shown, its neighbours show at once for a moment, so moving along a toolbar reads every label without waiting.\n- **Keyboard focus:** shows at once. A mouse click that happens to focus the control does not show it.\n- **Touch:** a long press shows it, and it stays a moment after the finger lifts.\n- **Clicking the control** does what the control does, and the tooltip steps aside.\n- The bubble can be hovered without closing, so it can be read and selected (WCAG 1.4.13). It closes `hideDelay` (100ms) after the pointer leaves both the trigger and the bubble.\n- **Escape** closes it from anywhere. That Escape is used up: a tooltip open in a Modal takes the first Escape, and the Modal the second.\n- It also closes when the trigger scrolls out of view or leaves the page. Only one tooltip is open at a time.\n- `show()`, `hide()` and `toggle()` work from code, and `onOpenChange(open)` reports changes. `disabled` switches it off.\n\n### Above everything\nThe bubble is a popover, so it renders in the browser's top layer: above a [Modal](/docs/feedback/modal), a Drawer or a calendar, and never clipped by an ancestor's `overflow: hidden`.\n\n### Content\n- `text` is the description.\n- `title` adds a bold line above it, for a richer tooltip.\n- `shortcut` shows a key combination (`'⌘B'`, `'Ctrl+S'`) in a `<kbd>`.\n- `content` takes a node instead of `text`.\n\nChanging any of them while the tooltip is open updates it in place (\"Copy\" → \"Copied!\").\n\n### Toggletip\n`mode: 'toggletip'` is for an ⓘ button that explains something and may hold a link.\n- A click opens and closes it. Hover does nothing.\n- The trigger gets `aria-expanded`.\n- The bubble sits right after the trigger, so **Tab** goes from the ⓘ into its links.\n- **Escape** closes it and puts the focus back on the ⓘ. Tabbing out or clicking elsewhere closes it too.\n\n## Looks\n- `placement`: `'top'` (default), `'bottom'`, `'left'` or `'right'`, each with `-start` or `-end` to align with an edge of the trigger (`'bottom-start'`).\n  - When the side has no room, it flips to the other side, then shifts into the screen.\n  - The arrow keeps pointing at the trigger's centre after a shift. `arrow: false` removes it.\n- `variant`:\n  - `'inverse'` (default): dark on a light theme, light on a dark one;\n  - `'light'`: a raised surface with a border;\n  - `'accent'`: the primary colour.\n- `size`: `'sm'` or `'md'` (default).\n- `offset` (8px) is the gap to the trigger. `maxWidth` (280px) wraps long text.\n- `customColor: { background, text, border }` retints one tooltip.\n\n## Live Preview\n:::component name=\"ToolTip\"\n{\n  \"text\": \"Save your work before leaving\",\n  \"showDelay\": 0\n}\n:::\n\n## Examples\n:::script label=\"Editor toolbar\" expected=\"a toolbar of buttons, each with its name and shortcut; after the first tooltip, moving along the toolbar shows the others at once; Tab moves button to button with no extra stops\"\nconst tools = [\n  { label: 'Bold', icon: 'letter-bold', shortcut: '⌘B' },\n  { label: 'Italic', icon: 'letter-italic', shortcut: '⌘I' },\n  { label: 'Underline', icon: 'letter-underline', shortcut: '⌘U' },\n  { label: 'Insert link', icon: 'link', shortcut: '⌘K' },\n  { label: 'Undo', icon: 'undo', shortcut: '⌘Z' }\n];\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst bar = document.createElement('div');\nbar.setAttribute('role', 'toolbar');\nbar.setAttribute('aria-label', 'Formatting');\nbar.style.cssText = 'display:inline-flex;gap:4px;padding:6px;border:1px solid var(--slice-border-raised);border-radius:12px';\n\nfor (const tool of tools) {\n  // Icon only: no label on screen, the name in ariaLabel.\n  const button = await slice.build('Button', {\n    value: '', ariaLabel: tool.label, icon: tool.icon, variant: 'ghost', size: 'sm',\n    onClick: () => toasts.show(tool.label, { duration: 1200 })\n  });\n  const tip = await slice.build('ToolTip', { text: tool.label, shortcut: tool.shortcut, placement: 'bottom' });\n  tip.appendChild(button);\n  bar.appendChild(tip);\n}\nreturn bar;\n:::\n\n:::script label=\"Why is it disabled?\" expected=\"a disabled Publish button whose tooltip says the title is missing (on hover, or by tabbing to it); typing a title enables it and the tooltip changes to its shortcut\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst publish = await slice.build('Button', {\n  value: 'Publish', icon: 'upload', disabled: true,\n  onClick: () => toasts.show(`Published “${title.value}”`, { type: 'success' })\n});\nconst tip = await slice.build('ToolTip', { text: 'Add a title to publish', placement: 'right' });\ntip.appendChild(publish);\n\nconst title = await slice.build('Input', {\n  label: 'Title',\n  onChange: (value) => {\n    const ready = value.trim().length > 0;\n    publish.disabled = !ready;\n    // The same tooltip, saying something else once the button works.\n    tip.text = ready ? 'Publish now' : 'Add a title to publish';\n    tip.shortcut = ready ? '⌘↵' : '';\n  }\n});\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:14px;max-width:420px;width:100%;justify-items:start';\nbox.append(title, tip);\nreturn box;\n:::\n\n:::script label=\"A field with a toggletip\" expected=\"a phone field with an ⓘ beside its label; clicking the ⓘ explains why the number is asked for, with a link Tab can reach; Escape closes it and returns to the ⓘ\"\nconst why = document.createElement('div');\nwhy.innerHTML = 'We only use it to text you about this delivery. <a href=\"#privacy\">Read the privacy policy</a>';\n\nconst info = await slice.build('ToolTip', { mode: 'toggletip', title: 'Why we ask', content: why, variant: 'light', placement: 'top-start' });\nconst button = await slice.build('Button', { value: '', ariaLabel: 'Why we ask for your phone', icon: 'info-circle', variant: 'ghost', size: 'sm' });\ninfo.appendChild(button);\n\nconst label = document.createElement('div');\nlabel.style.cssText = 'display:flex;align-items:center;gap:2px;font-weight:600;font-size:.9rem';\nlabel.append('Phone', info);\n\nconst phone = await slice.build('Input', { ariaLabel: 'Phone', type: 'tel', placeholder: '+58 412 000 0000', labelPlacement: 'above' });\nconst card = await slice.build('Card', { title: 'Delivery details', content: [label, phone] });\ncard.style.maxWidth = '420px';\nreturn card;\n:::\n\n:::script label=\"Copy with feedback\" expected=\"a Copy link button; clicking it copies the link and the tooltip says 'Copied!' for a moment, then goes back to 'Copy link'\"\nconst link = 'https://slice.dev/invite/7f3a';\nconst field = await slice.build('Input', { value: link, readonly: true, ariaLabel: 'Invite link' });\nfield.style.flex = '1';\nconst tip = await slice.build('ToolTip', { text: 'Copy link', placement: 'top' });\nconst copy = await slice.build('Button', {\n  value: 'Copy', icon: 'file-clone', variant: 'outlined',\n  onClick: async () => {\n    try { await navigator.clipboard.writeText(link); } catch { /* the docs page may not allow it */ }\n    tip.text = 'Copied!';\n    tip.show();\n    setTimeout(() => { tip.hide(); tip.text = 'Copy link'; }, 1200);\n  }\n});\ntip.appendChild(copy);\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:8px;align-items:center;max-width:480px;width:100%';\nrow.append(field, tip);\nreturn row;\n:::\n\n:::script label=\"Inside a Modal\" expected=\"a button opens a Modal whose icon buttons have tooltips, shown above the dialog; the first Escape closes the tooltip, the second the Modal\"\nconst open = async () => {\n  const actions = document.createElement('div');\n  actions.style.cssText = 'display:flex;gap:8px';\n  for (const [label, icon] of [['Download', 'download'], ['Share', 'share-nodes'], ['Move to trash', 'trash-bin']]) {\n    const button = await slice.build('Button', { value: '', ariaLabel: label, icon, variant: 'outlined', size: 'sm' });\n    const tip = await slice.build('ToolTip', { text: label, showDelay: 200 });\n    tip.appendChild(button);\n    actions.appendChild(tip);\n  }\n  const modal = await slice.build('Modal', { title: 'quarterly-report.pdf', icon: 'file-lines', content: ['2.4 MB · edited yesterday', actions], destroyOnClose: true });\n  document.body.appendChild(modal);\n  modal.show();\n};\nreturn await slice.build('Button', { value: 'Open file', onClick: open });\n:::\n\n:::script label=\"Looks at a glance\" expected=\"the three variants, the small size, a rich tooltip with a title, and twelve placements; hover each to see it\"\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:22px;width:100%';\nconst row = () => {\n  const r = document.createElement('div');\n  r.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px';\n  box.appendChild(r);\n  return r;\n};\nconst add = async (target, label, props) => {\n  const tip = await slice.build('ToolTip', { showDelay: 0, ...props });\n  tip.appendChild(await slice.build('Button', { value: label, variant: 'outlined', size: 'sm' }));\n  target.appendChild(tip);\n};\nconst looks = row();\nfor (const variant of ['inverse', 'light', 'accent']) await add(looks, variant, { text: `variant: '${variant}'`, variant });\nawait add(looks, 'size sm', { text: 'A small tooltip', size: 'sm' });\nawait add(looks, 'rich', { title: 'Version history', text: 'See every change, and restore an earlier version.', shortcut: '⌥⌘H', maxWidth: 240 });\nawait add(looks, 'no arrow', { text: 'No arrow', arrow: false });\n\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(4,max-content);gap:10px;padding:30px 0';\nfor (const side of ['top', 'bottom', 'left', 'right']) {\n  for (const align of ['-start', '', '-end']) await add(grid, `${side}${align}`, { text: `placement: '${side}${align}'`, placement: `${side}${align}` });\n}\nbox.appendChild(grid);\nreturn box;\n:::\n\n## Best Practices\n:::tip\nKeep it short: a name, or a sentence. If it needs a paragraph, it belongs on the page or in a toggletip.\n:::\n\n:::tip\nExplain disabled buttons. \"Add a title to publish\" saves people from guessing what is missing.\n:::\n\n:::tip\nShow the shortcut. A tooltip is the one place people look for it, and `shortcut` styles it as a key.\n:::\n\n## Pitfalls\n:::warning\nDo not put links or buttons in a plain tooltip: it closes when the pointer leaves, and touch users barely see it. Use `mode: 'toggletip'`.\n:::\n\n:::warning\nA tooltip is not a label. An icon-only button still needs its own accessible name (Button's `value`), and the tooltip describes it.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const tip = await slice.build('ToolTip', { text: 'Bold', shortcut: '⌘B' });\ntip.appendChild(boldButton);",
               language: "javascript"
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
            let props = {};
            if ("{\n  \"text\": \"Save your work before leaving\",\n  \"showDelay\": 0\n}") {
               try {
                  props = JSON.parse("{\n  \"text\": \"Save your work before leaving\",\n  \"showDelay\": 0\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('ToolTip', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Modal","path":"/docs/feedback/modal"},{"text":"ToolTipProvider","path":"/docs/services/tooltip-provider"},{"text":"Modal","path":"/docs/feedback/modal"}];
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

customElements.define('slice-tooltipdocumentation', ToolTipDocumentation);
