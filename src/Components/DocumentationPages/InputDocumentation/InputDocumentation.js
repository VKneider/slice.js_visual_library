export default class InputDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Sign in","expected":"Sign in validates both fields (the first problem gets the focus); Enter in the password signs in too","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\nconst card = document.createElement('div');\ncard.style.cssText = 'display:flex;flex-direction:column;gap:18px;width:100%;max-width:380px;padding:24px;border:1px solid var(--slice-border-raised);border-radius:16px;background:var(--slice-surface-raised)';\n\nconst title = document.createElement('h3');\ntitle.textContent = 'Welcome back';\ntitle.style.margin = '0';\n\nconst email = await slice.build('Input', {\n  label: 'Email', type: 'email', name: 'email', autocomplete: 'email', icon: 'user', required: true\n});\nconst password = await slice.build('Input', {\n  label: 'Password', type: 'password', name: 'password', autocomplete: 'current-password',\n  secret: true, required: true, minlength: 8,\n  onEnter: () => signIn()\n});\nconst remember = await slice.build('Checkbox', { label: 'Keep me signed in', checked: true });\n\nconst signIn = () => {\n  // validate() each field; focus the first one that fails.\n  const fields = [email, password];\n  const results = fields.map((f) => f.validate());\n  const first = fields[results.indexOf(false)];\n  if (first) return first.focus();\n  toasts.show(`Signed in as ${email.value}`, { type: 'success' });\n};\nconst button = await slice.build('Button', { value: 'Sign in', onClick: signIn });\nbutton.style.alignSelf = 'stretch';\n\ncard.append(title, email, password, remember, button);\nreturn card;"},{"label":"Search that filters a Table","expected":"typing filters the table after a short pause; the badge counts the matches; ✕ or Escape clears","kind":"script","content":"const people = [\n  { name: 'Ana López', role: 'Designer', city: 'Maracaibo' },\n  { name: 'José Pérez', role: 'Engineer', city: 'Caracas' },\n  { name: 'Luis Galué', role: 'Engineer', city: 'Valencia' },\n  { name: 'María Ruiz', role: 'Product', city: 'Mérida' },\n  { name: 'Carlos Díaz', role: 'Support', city: 'Maracaibo' },\n  { name: 'Elena Mora', role: 'Designer', city: 'Caracas' }\n];\nconst table = await slice.build('Table', {\n  columns: [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'city', label: 'City' }],\n  rows: people\n});\ntable.style.width = '100%';\nconst count = await slice.build('Badge', { label: `${people.length} people`, tone: 'accent' });\n\nconst search = await slice.build('Input', {\n  ariaLabel: 'Search people',\n  placeholder: 'Search by name, role or city…',\n  labelPlacement: 'above',\n  icon: 'search',\n  clearable: true,\n  debounce: 250,\n  onChange: (q) => {\n    const query = q.trim().toLowerCase();\n    const rows = people.filter((p) => Object.values(p).some((v) => v.toLowerCase().includes(query)));\n    table.rows = rows;\n    count.label = `${rows.length} ${rows.length === 1 ? 'person' : 'people'}`;\n  }\n});\nsearch.style.flex = '1';\n\nconst bar = document.createElement('div');\nbar.style.cssText = 'display:flex;gap:12px;align-items:center;margin-bottom:12px';\nbar.append(search, count);\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(bar, table);\nreturn box;"},{"label":"Order line with a total","expected":"quantity and price fields with prefix and suffix; the total updates live; out-of-range values explain themselves","kind":"script","content":"const qty = await slice.build('Input', {\n  label: 'Quantity', type: 'number', value: '2', min: 1, max: 50, suffix: 'units', validateOn: 'input'\n});\nconst price = await slice.build('Input', {\n  label: 'Unit price', type: 'number', value: '19.90', step: '0.01', min: 0, prefix: '$', suffix: 'USD'\n});\nconst discount = await slice.build('Select', {\n  label: 'Discount', options: [{ label: 'None', value: 0 }, { label: '10%', value: 0.1 }, { label: '25%', value: 0.25 }], selected: 0\n});\nconst total = document.createElement('div');\ntotal.style.cssText = 'font-size:1.6rem;font-weight:700;font-variant-numeric:tabular-nums';\n\nconst update = () => {\n  if (!qty.isValid || !price.isValid) { total.textContent = '—'; return; }\n  const sum = Number(qty.value) * Number(price.value) * (1 - Number(discount.selected || 0));\n  total.textContent = `$${sum.toFixed(2)}`;\n};\nqty.onChange = update;\nprice.onChange = update;\ndiscount.onChange = update;\nupdate();\n\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:18px;align-items:end;width:100%';\nconst sumBox = document.createElement('div');\nsumBox.append(Object.assign(document.createElement('div'), { textContent: 'Total', style: 'font-size:.8rem;opacity:.7' }), total);\ngrid.append(qty, price, discount, sumBox);\nreturn grid;"},{"label":"Username with an availability check","expected":"the format is checked locally; after a pause the 'server' answers: taken names show an error, free ones a confirmation","kind":"script","content":"const taken = ['admin', 'ana', 'slice', 'root'];\nlet request = 0;\nconst username = await slice.build('Input', {\n  label: 'Username',\n  prefix: '@',\n  maxlength: 20,\n  showCount: true,\n  help: 'Letters, numbers and _ only',\n  validateOn: 'input',\n  validator: (v) => (/^[a-z0-9_]+$/i.test(v) ? null : 'Only letters, numbers and _'),\n  debounce: 400,\n  onChange: async (value) => {\n    username.error = '';\n    if (!value || !username.isValid) { username.help = 'Letters, numbers and _ only'; return; }\n    const mine = ++request;\n    username.help = 'Checking…';\n    await new Promise((r) => setTimeout(r, 500));   // pretend to ask the server\n    if (mine !== request) return;                    // an older answer arrived late\n    if (taken.includes(value.toLowerCase())) username.error = `@${value} is taken`;\n    else username.help = `✓ @${value} is available`;\n  }\n});\nusername.style.maxWidth = '360px';\nreturn username;"},{"label":"Invite by email","expected":"Enter adds an email as a chip; invalid ones are refused with a message; Send invites confirms","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\nconst emails = new Set();\nconst chips = document.createElement('div');\nchips.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;min-height:28px';\n\nconst input = await slice.build('Input', {\n  label: 'Invite people',\n  type: 'email',\n  icon: 'user-add',\n  placeholder: 'name@company.com, then Enter',\n  help: 'Press Enter after each address',\n  onEnter: async (value) => {\n    const email = value.trim().toLowerCase();\n    if (!email || !input.validate()) return;\n    if (emails.has(email)) { input.error = 'Already on the list'; return; }\n    emails.add(email);\n    const chip = await slice.build('Chip', {\n      label: email, size: 'sm', removable: true,\n      onRemove: () => { emails.delete(email); slice.controller.destroyComponent(chip); chip.remove(); }\n    });\n    chips.appendChild(chip);\n    input.clear();\n  }\n});\nconst send = await slice.build('Button', {\n  value: 'Send invites',\n  icon: 'user-add',\n  onClick: () => {\n    if (emails.size === 0) { input.error = 'Add at least one address'; input.focus(); return; }\n    toasts.show(`Sent ${emails.size} invite${emails.size === 1 ? '' : 's'}`, { type: 'success' });\n    emails.clear();\n    slice.controller.destroyByContainer(chips);\n    chips.replaceChildren();\n  }\n});\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;flex-direction:column;gap:14px;width:100%;max-width:460px';\nbox.append(input, chips, send);\nreturn box;"},{"label":"Looks at a glance","expected":"the three variants, the three sizes, and the label above","kind":"script","content":"const grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:22px 18px;width:100%';\nconst specs = [\n  { label: 'Outlined', value: 'Default look' },\n  { label: 'Filled', variant: 'filled', value: 'Tinted, no border' },\n  { label: 'Ghost', variant: 'ghost', placeholder: 'Shows on hover' },\n  { label: 'Small', size: 'sm' },\n  { label: 'Medium' },\n  { label: 'Large', size: 'lg' },\n  { label: 'Label above', labelPlacement: 'above', placeholder: 'Static label' },\n  { label: 'Disabled', disabled: true, value: 'Not editable' },\n  { label: 'Read-only', readonly: true, value: 'Copy me' }\n];\nfor (const props of specs) grid.appendChild(await slice.build('Input', props));\nreturn grid;"}];
  }

  async init() {
    this.markdownPath = "input.md";
    this.markdownContent = "---\ntitle: Input\nroute: /docs/input/input\nnavLabel: Input\nsection: Input Components\ngroup: Basic\norder: 11\ndescription: Text field with a floating label, variants, sizes, icon, prefix and suffix, clear button, help, errors, a counter and validation shared with Textarea.\ncomponent: InputDocumentation\ngenerate: true\ntags: [input, forms, field, validation]\n---\n\n# Input\n\n## Overview\n`Input` is a single-line text field. Underneath it is a real `<input>` labelled by a real `<label>`, so browser autofill, password managers, screen readers and native `<form>`s all work with it as they would with a plain field. It shares one look with [Textarea](/docs/input/textarea) and [Select](/docs/input/select): the same heights, border, focus ring, variants and help line. Its floating label and error shake are the same as Textarea's.\n\n## Core Behavior\n- `value` reads and sets the text. `onChange(value)` fires on every keystroke; with `debounce: 300` it fires once, 300 ms after typing stops (right for search).\n- `type` is any native type: `text`, `email`, `password`, `number`, `url`, `tel`, `search`, `date`…\n- `name` makes the field part of a native `<form>` (`FormData` sees it). `autocomplete`, `inputmode`, `min`, `max`, `step` and `pattern` are passed to the `<input>`.\n- `onEnter(value, event)` fires on Enter.\n- `focus()`, `blur()`, `select()` and `clear()` do what they say.\n- `disabled` greys it out; `readonly` keeps it focusable and copyable but not editable.\n\n## The label\n- `label` floats: it sits inside the empty field and rises above it on focus or once there is a value. With a `label`, `placeholder` becomes the native hint, shown once the label has risen.\n- `labelPlacement: 'above'` puts the label above the field, in the flow, the way forms usually do.\n- `required` adds a red asterisk to the label.\n- **Older API:** `placeholder` alone, with no `label`, is still the floating label, as it always was.\n- With no visible label, give it an `ariaLabel` so screen readers can name it.\n\n## Looks\n- `variant`: `'outlined'` (default), `'filled'` (a tinted background, no border) or `'ghost'` (no background or border until hovered). The same names as Select and Button.\n- `size`: `'sm'` (32px), `'md'` (42px, default) or `'lg'` (50px). The same heights as Select and Button, so a row of them lines up.\n- `icon` is any [Icon](/docs/display/icon) name, shown at the start of the field.\n- `prefix` and `suffix` are short texts inside the field: `'$'`, `'https://'`, `'kg'`, `'USD'`. A prefix keeps the label risen, since it sits where the resting label would.\n- `clearable` adds a ✕ while there is text. Escape clears it too.\n- `secret` with `type: 'password'` adds an eye that shows and hides the password.\n\n## Help, errors and the counter\n- `help` is a hint under the field.\n- `error` is a message you set (from a server check, say). It replaces the help, turns the field red and is announced to screen readers. `error: ''` clears it.\n- `invalid: true` turns the field red without a message (a Form uses this, since it prints its own).\n- `showCount` shows the length under the field, against `maxlength` when there is one (\"9 / 20\").\n\n## Validation\nThe rules are shared with Textarea:\n- `required`;\n- the native checks for the type: email and URL format, number ranges (`min`, `max`, `step`) and `pattern`;\n- `minlength` and `maxlength`;\n- `conditions`, the older rule object (character counts, lengths or a `regex`), with `conditionsMessage`;\n- `validator(value)`, your own rule, returning a message or nothing.\n\nWhen an error shows:\n- An error shows when the person **leaves** the field, not while they type the first characters. From then on it follows the value **live**, so it disappears as soon as the value is fixed.\n- An **empty** field is never turned red on its own: not when someone tabs through it, and not when its text is deleted. `required` and `minlength` are only claimed by `validate()`, which a form calls when someone tries to submit, with the shake. Until then an empty field is just empty.\n- `validateOn: 'input'` judges on every keystroke; `'manual'` shows nothing until `validate()`.\n\nMessages and methods:\n- `messages` overrides the wording: `{ required, email, url, number, min, max, step, minlength, maxlength, pattern }`. `{min}`, `{max}`, `{step}`, `{minlength}` and `{maxlength}` are filled in.\n- `validate()` shows the result, gives an invalid field one short shake and returns `true` or `false`.\n- `validationMessage` returns the message without showing anything, and `isValid` says whether there is one.\n- The older `validateValue()`, `triggerError()` and `triggerSuccess()` still work.\n\n## Live Preview\n:::component name=\"Input\"\n{\n  \"label\": \"Email\",\n  \"type\": \"email\",\n  \"icon\": \"user\",\n  \"placeholder\": \"you@company.com\",\n  \"help\": \"We never share it.\",\n  \"required\": true,\n  \"clearable\": true\n}\n:::\n\n## Examples\n:::script label=\"Sign in\" expected=\"Sign in validates both fields (the first problem gets the focus); Enter in the password signs in too\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst card = document.createElement('div');\ncard.style.cssText = 'display:flex;flex-direction:column;gap:18px;width:100%;max-width:380px;padding:24px;border:1px solid var(--slice-border-raised);border-radius:16px;background:var(--slice-surface-raised)';\n\nconst title = document.createElement('h3');\ntitle.textContent = 'Welcome back';\ntitle.style.margin = '0';\n\nconst email = await slice.build('Input', {\n  label: 'Email', type: 'email', name: 'email', autocomplete: 'email', icon: 'user', required: true\n});\nconst password = await slice.build('Input', {\n  label: 'Password', type: 'password', name: 'password', autocomplete: 'current-password',\n  secret: true, required: true, minlength: 8,\n  onEnter: () => signIn()\n});\nconst remember = await slice.build('Checkbox', { label: 'Keep me signed in', checked: true });\n\nconst signIn = () => {\n  // validate() each field; focus the first one that fails.\n  const fields = [email, password];\n  const results = fields.map((f) => f.validate());\n  const first = fields[results.indexOf(false)];\n  if (first) return first.focus();\n  toasts.show(`Signed in as ${email.value}`, { type: 'success' });\n};\nconst button = await slice.build('Button', { value: 'Sign in', onClick: signIn });\nbutton.style.alignSelf = 'stretch';\n\ncard.append(title, email, password, remember, button);\nreturn card;\n:::\n\n:::script label=\"Search that filters a Table\" expected=\"typing filters the table after a short pause; the badge counts the matches; ✕ or Escape clears\"\nconst people = [\n  { name: 'Ana López', role: 'Designer', city: 'Maracaibo' },\n  { name: 'José Pérez', role: 'Engineer', city: 'Caracas' },\n  { name: 'Luis Galué', role: 'Engineer', city: 'Valencia' },\n  { name: 'María Ruiz', role: 'Product', city: 'Mérida' },\n  { name: 'Carlos Díaz', role: 'Support', city: 'Maracaibo' },\n  { name: 'Elena Mora', role: 'Designer', city: 'Caracas' }\n];\nconst table = await slice.build('Table', {\n  columns: [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'city', label: 'City' }],\n  rows: people\n});\ntable.style.width = '100%';\nconst count = await slice.build('Badge', { label: `${people.length} people`, tone: 'accent' });\n\nconst search = await slice.build('Input', {\n  ariaLabel: 'Search people',\n  placeholder: 'Search by name, role or city…',\n  labelPlacement: 'above',\n  icon: 'search',\n  clearable: true,\n  debounce: 250,\n  onChange: (q) => {\n    const query = q.trim().toLowerCase();\n    const rows = people.filter((p) => Object.values(p).some((v) => v.toLowerCase().includes(query)));\n    table.rows = rows;\n    count.label = `${rows.length} ${rows.length === 1 ? 'person' : 'people'}`;\n  }\n});\nsearch.style.flex = '1';\n\nconst bar = document.createElement('div');\nbar.style.cssText = 'display:flex;gap:12px;align-items:center;margin-bottom:12px';\nbar.append(search, count);\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(bar, table);\nreturn box;\n:::\n\n:::script label=\"Order line with a total\" expected=\"quantity and price fields with prefix and suffix; the total updates live; out-of-range values explain themselves\"\nconst qty = await slice.build('Input', {\n  label: 'Quantity', type: 'number', value: '2', min: 1, max: 50, suffix: 'units', validateOn: 'input'\n});\nconst price = await slice.build('Input', {\n  label: 'Unit price', type: 'number', value: '19.90', step: '0.01', min: 0, prefix: '$', suffix: 'USD'\n});\nconst discount = await slice.build('Select', {\n  label: 'Discount', options: [{ label: 'None', value: 0 }, { label: '10%', value: 0.1 }, { label: '25%', value: 0.25 }], selected: 0\n});\nconst total = document.createElement('div');\ntotal.style.cssText = 'font-size:1.6rem;font-weight:700;font-variant-numeric:tabular-nums';\n\nconst update = () => {\n  if (!qty.isValid || !price.isValid) { total.textContent = '—'; return; }\n  const sum = Number(qty.value) * Number(price.value) * (1 - Number(discount.selected || 0));\n  total.textContent = `$${sum.toFixed(2)}`;\n};\nqty.onChange = update;\nprice.onChange = update;\ndiscount.onChange = update;\nupdate();\n\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:18px;align-items:end;width:100%';\nconst sumBox = document.createElement('div');\nsumBox.append(Object.assign(document.createElement('div'), { textContent: 'Total', style: 'font-size:.8rem;opacity:.7' }), total);\ngrid.append(qty, price, discount, sumBox);\nreturn grid;\n:::\n\n:::script label=\"Username with an availability check\" expected=\"the format is checked locally; after a pause the 'server' answers: taken names show an error, free ones a confirmation\"\nconst taken = ['admin', 'ana', 'slice', 'root'];\nlet request = 0;\nconst username = await slice.build('Input', {\n  label: 'Username',\n  prefix: '@',\n  maxlength: 20,\n  showCount: true,\n  help: 'Letters, numbers and _ only',\n  validateOn: 'input',\n  validator: (v) => (/^[a-z0-9_]+$/i.test(v) ? null : 'Only letters, numbers and _'),\n  debounce: 400,\n  onChange: async (value) => {\n    username.error = '';\n    if (!value || !username.isValid) { username.help = 'Letters, numbers and _ only'; return; }\n    const mine = ++request;\n    username.help = 'Checking…';\n    await new Promise((r) => setTimeout(r, 500));   // pretend to ask the server\n    if (mine !== request) return;                    // an older answer arrived late\n    if (taken.includes(value.toLowerCase())) username.error = `@${value} is taken`;\n    else username.help = `✓ @${value} is available`;\n  }\n});\nusername.style.maxWidth = '360px';\nreturn username;\n:::\n\n:::script label=\"Invite by email\" expected=\"Enter adds an email as a chip; invalid ones are refused with a message; Send invites confirms\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst emails = new Set();\nconst chips = document.createElement('div');\nchips.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;min-height:28px';\n\nconst input = await slice.build('Input', {\n  label: 'Invite people',\n  type: 'email',\n  icon: 'user-add',\n  placeholder: 'name@company.com, then Enter',\n  help: 'Press Enter after each address',\n  onEnter: async (value) => {\n    const email = value.trim().toLowerCase();\n    if (!email || !input.validate()) return;\n    if (emails.has(email)) { input.error = 'Already on the list'; return; }\n    emails.add(email);\n    const chip = await slice.build('Chip', {\n      label: email, size: 'sm', removable: true,\n      onRemove: () => { emails.delete(email); slice.controller.destroyComponent(chip); chip.remove(); }\n    });\n    chips.appendChild(chip);\n    input.clear();\n  }\n});\nconst send = await slice.build('Button', {\n  value: 'Send invites',\n  icon: 'user-add',\n  onClick: () => {\n    if (emails.size === 0) { input.error = 'Add at least one address'; input.focus(); return; }\n    toasts.show(`Sent ${emails.size} invite${emails.size === 1 ? '' : 's'}`, { type: 'success' });\n    emails.clear();\n    slice.controller.destroyByContainer(chips);\n    chips.replaceChildren();\n  }\n});\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;flex-direction:column;gap:14px;width:100%;max-width:460px';\nbox.append(input, chips, send);\nreturn box;\n:::\n\n:::script label=\"Looks at a glance\" expected=\"the three variants, the three sizes, and the label above\"\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:22px 18px;width:100%';\nconst specs = [\n  { label: 'Outlined', value: 'Default look' },\n  { label: 'Filled', variant: 'filled', value: 'Tinted, no border' },\n  { label: 'Ghost', variant: 'ghost', placeholder: 'Shows on hover' },\n  { label: 'Small', size: 'sm' },\n  { label: 'Medium' },\n  { label: 'Large', size: 'lg' },\n  { label: 'Label above', labelPlacement: 'above', placeholder: 'Static label' },\n  { label: 'Disabled', disabled: true, value: 'Not editable' },\n  { label: 'Read-only', readonly: true, value: 'Copy me' }\n];\nfor (const props of specs) grid.appendChild(await slice.build('Input', props));\nreturn grid;\n:::\n\n## Best Practices\n:::tip\nGive every field a `label`. A placeholder disappears as soon as someone types, so it cannot be the only thing that says what the field is for. Use `placeholder` for an example of the format (\"you@company.com\").\n:::\n\n:::tip\nUse the right `type` and `autocomplete`. `type: 'email'` brings the email keyboard on phones and the format check for free; `autocomplete: 'current-password'` lets password managers fill it.\n:::\n\n:::tip\nFor a server check (a username, a coupon), set `error` from your own code and clear it on the next change, as in the availability example. Keep the format rules in `validator` so they answer instantly.\n:::\n\n## Pitfalls\n:::warning\nInputs no longer carry a 20px margin. Spacing belongs to whatever holds them (a Form, a grid, a flex column with a `gap`). To get the old spacing back on one field, set `--control-margin-block: 20px` on it.\n:::\n\n:::warning\nInside a [Form](/docs/input/form), the Form owns the label and the error: it sets `labelPlacement: 'above'`, turns off the field's own validation display and prints the message itself. Give the label to the schema item (`label: 'Email'`), not to the Input's `props`, or it shows twice.\n:::\n\n:::warning\n`maxlength` stops typing at the limit. If you would rather let people type past it and show the error, use a `validator` that checks the length, with `showCount` to show how far over they are.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"label\": \"Email\",\n  \"type\": \"email\",\n  \"icon\": \"user\",\n  \"placeholder\": \"you@company.com\",\n  \"help\": \"We never share it.\",\n  \"required\": true,\n  \"clearable\": true\n}") {
               try {
                  props = JSON.parse("{\n  \"label\": \"Email\",\n  \"type\": \"email\",\n  \"icon\": \"user\",\n  \"placeholder\": \"you@company.com\",\n  \"help\": \"We never share it.\",\n  \"required\": true,\n  \"clearable\": true\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Input', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"labelPlacement\",\"type\":\"string\",\"required\":false,\"default\":\"floating\",\"allowedValues\":[\"floating\",\"above\"]},{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"type\",\"type\":\"string\",\"required\":false,\"default\":\"text\",\"allowedValues\":[]},{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"autocomplete\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"inputmode\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"min\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"max\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"step\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"minlength\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"maxlength\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"pattern\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[\"outlined\",\"filled\",\"ghost\"]},{\"path\":\"icon\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"prefix\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"suffix\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"clearable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"secret\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"showCount\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"help\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"error\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"invalid\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"readonly\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"conditions\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"conditionsMessage\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"validator\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"messages\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"validateOn\",\"type\":\"string\",\"required\":false,\"default\":\"blur\",\"allowedValues\":[\"blur\",\"input\",\"manual\"]},{\"path\":\"debounce\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"className\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onEnter\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"labelPlacement\",\"type\":\"string\",\"required\":false,\"default\":\"floating\",\"allowedValues\":[\"floating\",\"above\"]},{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"type\",\"type\":\"string\",\"required\":false,\"default\":\"text\",\"allowedValues\":[]},{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"autocomplete\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"inputmode\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"min\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"max\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"step\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"minlength\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"maxlength\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"pattern\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[\"outlined\",\"filled\",\"ghost\"]},{\"path\":\"icon\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"prefix\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"suffix\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"clearable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"secret\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"showCount\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"help\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"error\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"invalid\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"readonly\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"conditions\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"conditionsMessage\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"validator\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"messages\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"validateOn\",\"type\":\"string\",\"required\":false,\"default\":\"blur\",\"allowedValues\":[\"blur\",\"input\",\"manual\"]},{\"path\":\"debounce\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"className\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onEnter\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Textarea","path":"/docs/input/textarea"},{"text":"Select","path":"/docs/input/select"},{"text":"Icon","path":"/docs/display/icon"},{"text":"Form","path":"/docs/input/form"}];
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

customElements.define('slice-inputdocumentation', InputDocumentation);
