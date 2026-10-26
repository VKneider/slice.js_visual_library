export default class TextareaDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Comments","expected":"the box grows as you type (up to 6 lines); Ctrl+Enter or Comment posts it to the list; the button wakes up once there is text","kind":"script","content":"const list = document.createElement('div');\nlist.style.cssText = 'display:flex;flex-direction:column;gap:12px';\n\nconst addComment = async (text) => {\n  const item = document.createElement('div');\n  item.style.cssText = 'display:flex;gap:10px;align-items:flex-start';\n  const avatar = document.createElement('span');\n  avatar.textContent = 'AL';\n  avatar.style.cssText = 'flex:none;display:inline-grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--primary-color);color:var(--primary-color-contrast);font-size:12px;font-weight:700';\n  const body = document.createElement('div');\n  const who = document.createElement('div');\n  who.style.cssText = 'font-size:.8rem;font-weight:600';\n  who.textContent = 'Ana López · just now';\n  const p = document.createElement('p');\n  p.style.cssText = 'margin:2px 0 0;white-space:pre-wrap;font-size:.9rem;line-height:1.5';\n  p.textContent = text;\n  body.append(who, p);\n  item.append(avatar, body);\n  list.prepend(item);\n};\n\nconst post = () => {\n  const text = box.value.trim();\n  if (!text) return;\n  addComment(text);\n  box.clear();\n  sync();\n  box.focus();\n};\nconst box = await slice.build('Textarea', {\n  label: 'Add a comment',\n  placeholder: 'Ctrl+Enter to post',\n  rows: 2,\n  autoGrow: true,\n  maxRows: 6,\n  maxlength: 280,\n  showCount: true,\n  onSubmit: post\n});\nconst button = await slice.build('Button', { value: 'Comment', size: 'sm', onClick: post });\nconst sync = () => { button.$button.disabled = box.value.trim() === ''; };\nbox.onChange = sync;\nsync();\n\nconst actions = document.createElement('div');\nactions.style.cssText = 'display:flex;justify-content:flex-end';\nactions.append(button);\nconst wrap = document.createElement('div');\nwrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;width:100%;max-width:560px';\nwrap.append(box, actions, list);\nreturn wrap;"},{"label":"Feedback in a Modal","expected":"a rating and a required comment of at least 20 characters; Send stays in the modal until both are valid","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\nconst open = async () => {\n  const rating = await slice.build('RadioGroup', {\n    label: 'How was it?',\n    orientation: 'horizontal',\n    options: ['Bad', 'Okay', 'Good', 'Great']\n  });\n  const comment = await slice.build('Textarea', {\n    label: 'Tell us more',\n    required: true,\n    minlength: 20,\n    rows: 4,\n    showCount: true,\n    messages: { minlength: 'A few more words, please ({minlength} characters at least)' }\n  });\n  const body = document.createElement('div');\n  body.style.cssText = 'display:flex;flex-direction:column;gap:20px';\n  body.append(rating, comment);\n\n  const modal = await slice.build('Modal', {\n    title: 'Send feedback',\n    icon: 'bell',\n    content: body,\n    destroyOnClose: true,\n    mobileLayout: 'sheet',\n    actions: [\n      { value: 'Cancel', variant: 'ghost' },\n      {\n        value: 'Send',\n        onClick: () => {\n          if (!rating.value) { toasts.show('Pick a rating first', { type: 'warning' }); return false; }\n          if (!comment.validate()) { comment.focus(); return false; }\n          toasts.show(`Thanks! (${rating.value})`, { type: 'success' });\n        },\n        close: true\n      }\n    ]\n  });\n  document.body.appendChild(modal);\n  modal.open = true;\n};\nreturn await slice.build('Button', { value: 'Give feedback', icon: 'bell', variant: 'outlined', onClick: open });"},{"label":"Generated output, read-only","expected":"editing the fields rewrites the JSON below; the read-only box can be selected and copied but not edited","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\nconst name = await slice.build('Input', { label: 'Project name', value: 'website-redesign' });\nconst owner = await slice.build('Input', { label: 'Owner', type: 'email', value: 'ana@acme.dev' });\nconst isPublic = await slice.build('Switch', { label: 'Public', checked: false, labelPlacement: 'left' });\nconst output = await slice.build('Textarea', {\n  label: 'project.json',\n  readonly: true,\n  autoGrow: true,\n  resize: 'none'\n});\nconst render = () => {\n  output.value = JSON.stringify({ name: name.value, owner: owner.value, public: isPublic.checked }, null, 2);\n};\nname.onChange = render;\nowner.onChange = render;\nisPublic.onChange = render;\nrender();\nconst copy = await slice.build('Button', {\n  value: 'Copy JSON', size: 'sm', variant: 'outlined',\n  onClick: async () => {\n    try { await navigator.clipboard.writeText(output.value); toasts.show('Copied', { type: 'success' }); }\n    catch { output.select(); toasts.show('Press Ctrl+C to copy', { type: 'info' }); }\n  }\n});\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;align-items:end;width:100%';\ngrid.append(name, owner, isPublic);\nconst wrap = document.createElement('div');\nwrap.style.cssText = 'display:flex;flex-direction:column;gap:18px;width:100%';\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;justify-content:flex-end';\nrow.append(copy);\nwrap.append(grid, output, row);\nreturn wrap;"},{"label":"Looks at a glance","expected":"variants, sizes, the label above, an error and a disabled field","kind":"script","content":"const grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px 18px;width:100%';\nconst specs = [\n  { label: 'Outlined', value: 'Default look' },\n  { label: 'Filled', variant: 'filled', value: 'Tinted, no border' },\n  { label: 'Ghost', variant: 'ghost', placeholder: 'Shows on hover' },\n  { label: 'Small', size: 'sm' },\n  { label: 'Large', size: 'lg' },\n  { label: 'Label above', labelPlacement: 'above', placeholder: 'Static label' },\n  { label: 'With an error', error: 'Please describe the problem' },\n  { label: 'Disabled', disabled: true, value: 'Not editable' }\n];\nfor (const props of specs) grid.appendChild(await slice.build('Textarea', { rows: 2, ...props }));\nreturn grid;"}];
  }

  async init() {
    this.markdownPath = "textarea.md";
    this.markdownContent = "---\ntitle: Textarea\nroute: /docs/input/textarea\nnavLabel: Textarea\nsection: Input Components\ngroup: Basic\norder: 13\ndescription: Multi-line text field that shares Input's label, looks and validation, with auto-grow up to a limit, a counter and Ctrl+Enter to submit.\ncomponent: TextareaDocumentation\ngenerate: true\ntags: [textarea, input, forms, multiline, validation]\n---\n\n# Textarea\n\n## Overview\n`Textarea` is the multi-line sibling of [Input](/docs/input/input), and the two are built to be one family. They share:\n- the label: floating, or above the field;\n- the variants and sizes;\n- the help / error line and the counter;\n- the validation rules and when errors show;\n- the floating-label animation and the error shake, which are the same rules in both stylesheets.\n\nOn top of that, Textarea adds what multi-line text needs: auto-grow with a ceiling, resize control and Ctrl+Enter to submit.\n\n## Core Behavior\n- `value` reads and sets the text. `onChange(value)` fires on every keystroke, or once after a pause with `debounce`.\n- `rows` is the starting height in lines.\n- `autoGrow` makes the field grow with its content. `maxRows` stops it growing at that many lines; past that, it scrolls.\n- `resize`: `'vertical'` (default), `'none'`, `'both'` or `'horizontal'`. Auto-grow turns the handle off.\n- `onSubmit(value, event)` fires on Ctrl+Enter (⌘+Enter on a Mac). That is the usual \"send\" shortcut for a comment or a message, and plain Enter still makes a new line.\n- `name` makes it part of a native `<form>`.\n- `readonly` shows text people can select and copy but not edit, such as generated code or an ID. `disabled` would also take it out of the tab order and stop selection.\n- `focus()`, `blur()`, `select()` and `clear()` work as on Input.\n\n## Shared with Input\nThese work exactly as they do on [Input](/docs/input/input):\n- `label`, `labelPlacement`, `placeholder`, `required` and `ariaLabel`;\n- `variant` (`outlined`, `filled`, `ghost`) and `size` (`sm`, `md`, `lg`);\n- `help`, `error`, `invalid`, `showCount`, `minlength` and `maxlength`;\n- `validator`, `conditions`, `messages`, `validateOn`, `validate()`, `validationMessage` and `isValid`.\n\nAn error shows when the person leaves the field and then follows the value live, so it goes away as soon as the text is fixed. An empty field is never turned red on its own: `required` and `minlength` wait for `validate()` (a submit).\n\n## Live Preview\n:::component name=\"Textarea\"\n{\n  \"label\": \"Bio\",\n  \"help\": \"Shown on your profile\",\n  \"maxlength\": 160,\n  \"showCount\": true,\n  \"autoGrow\": true,\n  \"maxRows\": 6\n}\n:::\n\n## Examples\n:::script label=\"Comments\" expected=\"the box grows as you type (up to 6 lines); Ctrl+Enter or Comment posts it to the list; the button wakes up once there is text\"\nconst list = document.createElement('div');\nlist.style.cssText = 'display:flex;flex-direction:column;gap:12px';\n\nconst addComment = async (text) => {\n  const item = document.createElement('div');\n  item.style.cssText = 'display:flex;gap:10px;align-items:flex-start';\n  const avatar = document.createElement('span');\n  avatar.textContent = 'AL';\n  avatar.style.cssText = 'flex:none;display:inline-grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--primary-color);color:var(--primary-color-contrast);font-size:12px;font-weight:700';\n  const body = document.createElement('div');\n  const who = document.createElement('div');\n  who.style.cssText = 'font-size:.8rem;font-weight:600';\n  who.textContent = 'Ana López · just now';\n  const p = document.createElement('p');\n  p.style.cssText = 'margin:2px 0 0;white-space:pre-wrap;font-size:.9rem;line-height:1.5';\n  p.textContent = text;\n  body.append(who, p);\n  item.append(avatar, body);\n  list.prepend(item);\n};\n\nconst post = () => {\n  const text = box.value.trim();\n  if (!text) return;\n  addComment(text);\n  box.clear();\n  sync();\n  box.focus();\n};\nconst box = await slice.build('Textarea', {\n  label: 'Add a comment',\n  placeholder: 'Ctrl+Enter to post',\n  rows: 2,\n  autoGrow: true,\n  maxRows: 6,\n  maxlength: 280,\n  showCount: true,\n  onSubmit: post\n});\nconst button = await slice.build('Button', { value: 'Comment', size: 'sm', onClick: post });\nconst sync = () => { button.$button.disabled = box.value.trim() === ''; };\nbox.onChange = sync;\nsync();\n\nconst actions = document.createElement('div');\nactions.style.cssText = 'display:flex;justify-content:flex-end';\nactions.append(button);\nconst wrap = document.createElement('div');\nwrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;width:100%;max-width:560px';\nwrap.append(box, actions, list);\nreturn wrap;\n:::\n\n:::script label=\"Feedback in a Modal\" expected=\"a rating and a required comment of at least 20 characters; Send stays in the modal until both are valid\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst open = async () => {\n  const rating = await slice.build('RadioGroup', {\n    label: 'How was it?',\n    orientation: 'horizontal',\n    options: ['Bad', 'Okay', 'Good', 'Great']\n  });\n  const comment = await slice.build('Textarea', {\n    label: 'Tell us more',\n    required: true,\n    minlength: 20,\n    rows: 4,\n    showCount: true,\n    messages: { minlength: 'A few more words, please ({minlength} characters at least)' }\n  });\n  const body = document.createElement('div');\n  body.style.cssText = 'display:flex;flex-direction:column;gap:20px';\n  body.append(rating, comment);\n\n  const modal = await slice.build('Modal', {\n    title: 'Send feedback',\n    icon: 'bell',\n    content: body,\n    destroyOnClose: true,\n    mobileLayout: 'sheet',\n    actions: [\n      { value: 'Cancel', variant: 'ghost' },\n      {\n        value: 'Send',\n        onClick: () => {\n          if (!rating.value) { toasts.show('Pick a rating first', { type: 'warning' }); return false; }\n          if (!comment.validate()) { comment.focus(); return false; }\n          toasts.show(`Thanks! (${rating.value})`, { type: 'success' });\n        },\n        close: true\n      }\n    ]\n  });\n  document.body.appendChild(modal);\n  modal.open = true;\n};\nreturn await slice.build('Button', { value: 'Give feedback', icon: 'bell', variant: 'outlined', onClick: open });\n:::\n\n:::script label=\"Generated output, read-only\" expected=\"editing the fields rewrites the JSON below; the read-only box can be selected and copied but not edited\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst name = await slice.build('Input', { label: 'Project name', value: 'website-redesign' });\nconst owner = await slice.build('Input', { label: 'Owner', type: 'email', value: 'ana@acme.dev' });\nconst isPublic = await slice.build('Switch', { label: 'Public', checked: false, labelPlacement: 'left' });\nconst output = await slice.build('Textarea', {\n  label: 'project.json',\n  readonly: true,\n  autoGrow: true,\n  resize: 'none'\n});\nconst render = () => {\n  output.value = JSON.stringify({ name: name.value, owner: owner.value, public: isPublic.checked }, null, 2);\n};\nname.onChange = render;\nowner.onChange = render;\nisPublic.onChange = render;\nrender();\nconst copy = await slice.build('Button', {\n  value: 'Copy JSON', size: 'sm', variant: 'outlined',\n  onClick: async () => {\n    try { await navigator.clipboard.writeText(output.value); toasts.show('Copied', { type: 'success' }); }\n    catch { output.select(); toasts.show('Press Ctrl+C to copy', { type: 'info' }); }\n  }\n});\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;align-items:end;width:100%';\ngrid.append(name, owner, isPublic);\nconst wrap = document.createElement('div');\nwrap.style.cssText = 'display:flex;flex-direction:column;gap:18px;width:100%';\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;justify-content:flex-end';\nrow.append(copy);\nwrap.append(grid, output, row);\nreturn wrap;\n:::\n\n:::script label=\"Looks at a glance\" expected=\"variants, sizes, the label above, an error and a disabled field\"\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px 18px;width:100%';\nconst specs = [\n  { label: 'Outlined', value: 'Default look' },\n  { label: 'Filled', variant: 'filled', value: 'Tinted, no border' },\n  { label: 'Ghost', variant: 'ghost', placeholder: 'Shows on hover' },\n  { label: 'Small', size: 'sm' },\n  { label: 'Large', size: 'lg' },\n  { label: 'Label above', labelPlacement: 'above', placeholder: 'Static label' },\n  { label: 'With an error', error: 'Please describe the problem' },\n  { label: 'Disabled', disabled: true, value: 'Not editable' }\n];\nfor (const props of specs) grid.appendChild(await slice.build('Textarea', { rows: 2, ...props }));\nreturn grid;\n:::\n\n## Best Practices\n:::tip\nUse `autoGrow` with a `maxRows` for anything people write freely (comments, messages, descriptions). It starts compact, grows as they write, and stops before it pushes the rest of the page away.\n:::\n\n:::tip\nOffer Ctrl+Enter (`onSubmit`) wherever there is a send button. People who write a lot expect it, and plain Enter still makes a new line.\n:::\n\n## Pitfalls\n:::warning\nTextareas no longer carry a 20px margin. Spacing belongs to whatever holds them. To get it back on one field, set `--control-margin-block: 20px` on it.\n:::\n\n:::warning\n`autoGrow` measures the text, and a field that is not on the page (or is inside something with `display: none`) has nothing to measure. It keeps its last good height and measures again as soon as it is shown, so you do not need to call `grow()` yourself.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"label\": \"Bio\",\n  \"help\": \"Shown on your profile\",\n  \"maxlength\": 160,\n  \"showCount\": true,\n  \"autoGrow\": true,\n  \"maxRows\": 6\n}") {
               try {
                  props = JSON.parse("{\n  \"label\": \"Bio\",\n  \"help\": \"Shown on your profile\",\n  \"maxlength\": 160,\n  \"showCount\": true,\n  \"autoGrow\": true,\n  \"maxRows\": 6\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Textarea', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"labelPlacement\",\"type\":\"string\",\"required\":false,\"default\":\"floating\",\"allowedValues\":[\"floating\",\"above\"]},{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"rows\",\"type\":\"number\",\"required\":false,\"default\":\"3\",\"allowedValues\":[]},{\"path\":\"maxRows\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"minlength\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"maxlength\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"showCount\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"autoGrow\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"resize\",\"type\":\"string\",\"required\":false,\"default\":\"vertical\",\"allowedValues\":[\"vertical\",\"none\",\"both\",\"horizontal\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[\"outlined\",\"filled\",\"ghost\"]},{\"path\":\"help\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"error\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"invalid\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"readonly\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"conditions\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"conditionsMessage\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"validator\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"messages\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"validateOn\",\"type\":\"string\",\"required\":false,\"default\":\"blur\",\"allowedValues\":[\"blur\",\"input\",\"manual\"]},{\"path\":\"debounce\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onSubmit\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"labelPlacement\",\"type\":\"string\",\"required\":false,\"default\":\"floating\",\"allowedValues\":[\"floating\",\"above\"]},{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"rows\",\"type\":\"number\",\"required\":false,\"default\":\"3\",\"allowedValues\":[]},{\"path\":\"maxRows\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"minlength\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"maxlength\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"showCount\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"autoGrow\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"resize\",\"type\":\"string\",\"required\":false,\"default\":\"vertical\",\"allowedValues\":[\"vertical\",\"none\",\"both\",\"horizontal\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[\"outlined\",\"filled\",\"ghost\"]},{\"path\":\"help\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"error\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"invalid\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"readonly\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"conditions\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"conditionsMessage\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"validator\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"messages\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"validateOn\",\"type\":\"string\",\"required\":false,\"default\":\"blur\",\"allowedValues\":[\"blur\",\"input\",\"manual\"]},{\"path\":\"debounce\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onSubmit\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Input","path":"/docs/input/input"},{"text":"Input","path":"/docs/input/input"}];
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

customElements.define('slice-textareadocumentation', TextareaDocumentation);
