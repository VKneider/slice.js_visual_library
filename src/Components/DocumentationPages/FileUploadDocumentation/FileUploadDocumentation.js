export default class FileUploadDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Job application","expected":"a Form with name, email, a required CV (PDF or Word, up to 5 MB) and a cover letter; Submit without a CV says so; a wrong file type is turned away with the reason","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\nconst form = await slice.build('Form', {\n  columns: 2,\n  submitText: 'Send application',\n  schema: [\n    { kind: 'field', name: 'name', label: 'Full name', component: 'Input', required: true },\n    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true, props: { type: 'email' } },\n    { kind: 'field', name: 'cv', label: 'CV', component: 'FileUpload', required: true, full: true,\n      props: { accept: '.pdf,.doc,.docx', maxSize: '5 MB', variant: 'compact' } },\n    { kind: 'field', name: 'letter', label: 'Cover letter', component: 'Textarea', full: true, props: { rows: 4 } }\n  ],\n  onSubmit: (values) => toasts.show(`Thanks, ${values.name}. We got ${values.cv[0].name}.`, { type: 'success' })\n});\nreturn form;"},{"label":"Photo gallery","expected":"drop or pick up to 8 images; each one uploads with progress (some fail and can be retried); uploaded photos appear as Cards, and removing a Card frees its image","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\n\n// A pretend server: progress in steps, and one upload in four fails.\nconst send = async (file, { signal, onProgress }) => {\n  for (let p = 0.2; p <= 1; p += 0.2) {\n    await new Promise((r) => setTimeout(r, 120));\n    if (signal.aborted) throw new Error('aborted');\n    onProgress(p);\n  }\n  if (Math.random() < 0.25) throw new Error('The server was busy');\n  return { url: URL.createObjectURL(file), name: file.name };\n};\n\nconst gallery = document.createElement('div');\ngallery.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px';\n\nconst uploader = await slice.build('FileUpload', {\n  multiple: true,\n  accept: 'image/*',\n  maxFiles: 8,\n  maxSize: '10 MB',\n  prompt: 'Drop photos here, or {browse}',\n  upload: send,\n  onUpload: async (file, result) => {\n    const card = await slice.build('Card', {\n      image: result.url,\n      imageAlt: '',\n      title: result.name,\n      size: 'sm',\n      mediaRatio: '4 / 3',\n      actions: [{\n        value: 'Remove', variant: 'ghost', icon: 'trash-bin',\n        onClick: ({ card }) => {\n          // The photo's object URL holds the file in memory: free it with the Card.\n          URL.revokeObjectURL(result.url);\n          slice.controller.destroyComponent(card);\n          card.remove();\n          uploader.removeFile(file);\n        }\n      }]\n    });\n    gallery.appendChild(card);\n  },\n  onUploadError: (file, error) => toasts.show(`${file.name}: ${error.message}`, { type: 'error' })\n});\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:16px;width:100%';\nbox.append(uploader, gallery);\nreturn box;"},{"label":"Import a CSV into a Table","expected":"a compact picker that only takes .csv; the file is read in the page and its rows fill a Table; Clear empties both","kind":"script","content":"const table = await slice.build('Table', { columns: [], rows: [] });\ntable.style.width = '100%';\nconst status = document.createElement('p');\nstatus.style.cssText = 'margin:0;font-size:.9rem;opacity:.8';\nstatus.textContent = 'No file yet. Try a CSV with a header row.';\n\nconst parse = (text) => {\n  const lines = text.trim().split(/\\r?\\n/).filter(Boolean);\n  const split = (line) => line.split(',').map((cell) => cell.trim().replace(/^\"|\"$/g, ''));\n  const headers = split(lines.shift() || '');\n  return {\n    columns: headers.map((label, i) => ({ key: `c${i}`, label, sortable: true })),\n    rows: lines.map((line, n) => Object.fromEntries([['id', n], ...split(line).map((cell, i) => [`c${i}`, cell])]))\n  };\n};\n\nconst picker = await slice.build('FileUpload', {\n  variant: 'compact',\n  accept: '.csv,text/csv',\n  maxSize: '2 MB',\n  prompt: 'Choose a CSV',\n  onChange: async (files) => {\n    if (!files.length) {\n      table.columns = []; table.rows = [];\n      status.textContent = 'No file yet. Try a CSV with a header row.';\n      return;\n    }\n    const { columns, rows } = parse(await files[0].text());\n    table.columns = columns;\n    table.rows = rows;\n    status.textContent = `${rows.length} rows from ${files[0].name}`;\n  }\n});\n\n// A sample, for trying it without a file at hand.\nconst sample = await slice.build('Button', {\n  value: 'Use a sample file', variant: 'ghost', size: 'sm',\n  onClick: () => picker.addFiles([new File(\n    ['name,city,orders\\nAna Pérez,Maracaibo,12\\nLuis Gómez,Caracas,7\\nMaría Rojas,Mérida,21'],\n    'customers.csv', { type: 'text/csv' }\n  )])\n});\n\nconst bar = document.createElement('div');\nbar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';\nbar.append(picker, sample);\npicker.style.flex = '1 1 280px';\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%';\nbox.append(bar, status, table);\nreturn box;"},{"label":"Profile picture","expected":"a round preview beside a compact picker that takes one image up to 2 MB; picking one shows it; Remove puts the initials back","kind":"script","content":"const preview = document.createElement('div');\npreview.style.cssText = 'width:88px;height:88px;border-radius:50%;display:grid;place-items:center;font-size:1.6rem;font-weight:700;color:var(--primary-color-contrast);background:var(--primary-color);background-size:cover;background-position:center;flex:none';\npreview.textContent = 'AP';\nlet url = '';\n\nconst picker = await slice.build('FileUpload', {\n  variant: 'compact',\n  accept: 'image/*',\n  maxSize: '2 MB',\n  list: false,\n  prompt: 'Upload a photo',\n  icon: 'image',\n  onChange: (files) => {\n    // One URL at a time: the old one is freed before the new one is made.\n    if (url) URL.revokeObjectURL(url);\n    url = files[0] ? URL.createObjectURL(files[0]) : '';\n    preview.style.backgroundImage = url ? `url(\"${url}\")` : '';\n    preview.textContent = url ? '' : 'AP';\n    remove.hidden = !url;\n  }\n});\nconst remove = await slice.build('Button', { value: 'Remove', variant: 'ghost', size: 'sm', onClick: () => picker.clear() });\nremove.hidden = true;\n\nconst side = document.createElement('div');\nside.style.cssText = 'display:grid;gap:8px;flex:1 1 220px';\nside.append(picker, remove);\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;gap:20px;align-items:center;flex-wrap:wrap;width:100%;max-width:520px';\nbox.append(preview, side);\nreturn box;"},{"label":"Looks at a glance","expected":"the dropzone in three sizes, the compact variant, a disabled one and one with an error","kind":"script","content":"const box = document.createElement('div');\nbox.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;width:100%';\nfor (const size of ['sm', 'md', 'lg']) {\n  box.appendChild(await slice.build('FileUpload', { label: `Size ${size}`, size, multiple: true }));\n}\nbox.appendChild(await slice.build('FileUpload', { label: 'Compact', variant: 'compact', multiple: true, accept: '.pdf' }));\nbox.appendChild(await slice.build('FileUpload', { label: 'Disabled', disabled: true }));\nbox.appendChild(await slice.build('FileUpload', { label: 'With an error', error: 'The contract is missing', variant: 'compact' }));\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "file-upload.md";
    this.markdownContent = "---\ntitle: FileUpload\nroute: /docs/input/file-upload\nnavLabel: FileUpload\nsection: Input Components\ngroup: Basic\norder: 12\ndescription: Pick, drop or paste files, check them (type, size, count), see them with previews, remove them, and upload them with progress, retry and cancel. A real file input underneath, and a Form field.\ncomponent: FileUploadDocumentation\ngenerate: true\ntags: [file, upload, dropzone, drop, input, attachment, image]\n---\n\n# FileUpload\n\n## Overview\n`FileUpload` takes files from people: picked with the file dialog, dropped on the zone, or pasted. It checks each file and turns away the wrong ones with a reason. It then lists the accepted files with a preview and a remove button, and can upload them with progress.\n\nUnderneath is a real `<input type=\"file\">` inside a `<label>`, so the zone opens the picker with a click, a tap, **Enter** or **Space**, and **Tab** reaches it like any other field.\n\n### When to use it\n- Attachments in a form: a CV, receipts, a contract.\n- Images for a profile, a listing or a gallery.\n- Importing a file the page will read itself, such as a CSV into a Table.\n\n### When not to use it\n- For one image with a crop step (an avatar editor), FileUpload only does the picking. The crop is another component.\n- For files that already live on the server, a FileUpload is the wrong tool. Show them in a list or a Table, with their own actions.\n\n## Core Behavior\n\n### Taking files\n- `multiple` allows several files. Without it, a new file replaces the one already there.\n- `paste` (default `true`) takes files pasted while the zone has the focus, such as a screenshot.\n- `browse()` opens the picker from code. `addFiles(files)` adds files from code, with the same checks.\n\n### Checks\nEach file is checked before it is accepted:\n- `accept` (`'.pdf,image/*'`) limits the type. Dropped files are checked too, which the browser does not do by itself.\n- `maxSize` (`'5 MB'`, `'500 KB'` or a number of bytes) limits each file.\n- `maxFiles` limits how many files there can be.\n\nFiles that fail are listed under the zone with the reason (\"notes.txt: This type of file is not allowed\") and reported to `onReject(rejected)`, as `[{ file, reason: 'type' | 'size' | 'count', message }]`.\n\nWhen you give no `hint`, the zone writes one from the checks: \"PDF, IMAGE · up to 5.0 MB · 3 files at most\".\n\n### The list\nThe accepted files are listed under the zone:\n- a preview for images, or the file's extension;\n- the name and the size;\n- a remove button.\n\n`list: false` hides the list when you show the files your own way, and `preview: false` keeps images as an extension tag. Removing a file moves the focus to the next one, or back to the zone.\n\n### Uploading\nPass `upload(file, { signal, onProgress })` and FileUpload sends each file:\n- `onProgress(value)` takes 0–1 or 0–100 and fills that file's progress bar;\n- what `upload` returns is kept, and `results` lists it;\n- a thrown error marks the file as failed with its message, and **Retry** sends it again;\n- the ✕ during an upload aborts `signal` (pass it to `fetch`) and drops the file;\n- `concurrency` (default 3) sets how many files go at once;\n- `autoUpload: false` waits for `uploadAll()`, which resolves when every file is done or has failed;\n- `onUpload(file, result)` and `onUploadError(file, error)` report each file.\n\n### The value\n- `value` is the list of accepted files (`File[]`). It can be set from code, and `clear()` and `removeFile(file)` change it.\n- `onChange(files, { items })` and the `change` event report every change. `onFiles(added)` reports only the new files.\n- `items` gives each file's state: `{ file, status, progress, result, error }`.\n- `name` adds a hidden input that carries the files, so a plain `<form>` posts them.\n\n### Validation\n- `required` shows \"Add at least one file\" when `validate()` runs (and on a Form's submit), never on its own.\n- `validationMessage` also reports files still uploading (\"Wait for the uploads to finish\") or failed ones. A Form will not submit while either is true.\n- `error` and `invalid` set an error from outside, `help` adds a line under the zone, and `validateOn: 'manual'` leaves all checking to `validate()`.\n\n### Inside a Form\nUse `component: 'FileUpload'` in the schema. The Form shows the label and the errors, and `getValues()` returns the `File[]` under the field's name.\n\n### Memory\nImage previews use object URLs, which keep the file in memory until they are revoked. FileUpload revokes each one when its file is removed, the files are replaced or the component is destroyed. Destroying it also aborts uploads in flight.\n\n## Looks\n- `variant`:\n  - `'dropzone'` (default): a large area for dropping files;\n  - `'compact'`: one row with a button, for forms where space is tight. It still takes drops.\n- `size`: `'sm'`, `'md'` (default) or `'lg'`.\n- `icon` is the zone's icon (`'upload'` by default, `''` for none). `prompt` replaces the zone's text, and `hint` the line under it.\n- `label` puts a label above the zone, outside a Form.\n\n## Language\n- `texts` replaces the zone's words:\n  - `prompt` / `promptOne`, where `{browse}` marks the link;\n  - `browse`;\n  - `compact` / `compactOne`;\n  - `remove`, `retry`, `cancel`;\n  - `uploading`, with `{percent}`;\n  - `done`, `failed`, `upTo`, `maxFiles`.\n- `messages` replaces the errors: `required`, `type`, `tooLarge` (`{max}`), `tooMany` (`{max}`), `uploading` and `failed`.\n\n## Live Preview\n:::component name=\"FileUpload\"\n{\n  \"label\": \"Attachments\",\n  \"multiple\": true,\n  \"accept\": \".pdf,image/*\",\n  \"maxSize\": \"5 MB\"\n}\n:::\n\n## Examples\n:::script label=\"Job application\" expected=\"a Form with name, email, a required CV (PDF or Word, up to 5 MB) and a cover letter; Submit without a CV says so; a wrong file type is turned away with the reason\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst form = await slice.build('Form', {\n  columns: 2,\n  submitText: 'Send application',\n  schema: [\n    { kind: 'field', name: 'name', label: 'Full name', component: 'Input', required: true },\n    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true, props: { type: 'email' } },\n    { kind: 'field', name: 'cv', label: 'CV', component: 'FileUpload', required: true, full: true,\n      props: { accept: '.pdf,.doc,.docx', maxSize: '5 MB', variant: 'compact' } },\n    { kind: 'field', name: 'letter', label: 'Cover letter', component: 'Textarea', full: true, props: { rows: 4 } }\n  ],\n  onSubmit: (values) => toasts.show(`Thanks, ${values.name}. We got ${values.cv[0].name}.`, { type: 'success' })\n});\nreturn form;\n:::\n\n:::script label=\"Photo gallery\" expected=\"drop or pick up to 8 images; each one uploads with progress (some fail and can be retried); uploaded photos appear as Cards, and removing a Card frees its image\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\n\n// A pretend server: progress in steps, and one upload in four fails.\nconst send = async (file, { signal, onProgress }) => {\n  for (let p = 0.2; p <= 1; p += 0.2) {\n    await new Promise((r) => setTimeout(r, 120));\n    if (signal.aborted) throw new Error('aborted');\n    onProgress(p);\n  }\n  if (Math.random() < 0.25) throw new Error('The server was busy');\n  return { url: URL.createObjectURL(file), name: file.name };\n};\n\nconst gallery = document.createElement('div');\ngallery.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px';\n\nconst uploader = await slice.build('FileUpload', {\n  multiple: true,\n  accept: 'image/*',\n  maxFiles: 8,\n  maxSize: '10 MB',\n  prompt: 'Drop photos here, or {browse}',\n  upload: send,\n  onUpload: async (file, result) => {\n    const card = await slice.build('Card', {\n      image: result.url,\n      imageAlt: '',\n      title: result.name,\n      size: 'sm',\n      mediaRatio: '4 / 3',\n      actions: [{\n        value: 'Remove', variant: 'ghost', icon: 'trash-bin',\n        onClick: ({ card }) => {\n          // The photo's object URL holds the file in memory: free it with the Card.\n          URL.revokeObjectURL(result.url);\n          slice.controller.destroyComponent(card);\n          card.remove();\n          uploader.removeFile(file);\n        }\n      }]\n    });\n    gallery.appendChild(card);\n  },\n  onUploadError: (file, error) => toasts.show(`${file.name}: ${error.message}`, { type: 'error' })\n});\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:16px;width:100%';\nbox.append(uploader, gallery);\nreturn box;\n:::\n\n:::script label=\"Import a CSV into a Table\" expected=\"a compact picker that only takes .csv; the file is read in the page and its rows fill a Table; Clear empties both\"\nconst table = await slice.build('Table', { columns: [], rows: [] });\ntable.style.width = '100%';\nconst status = document.createElement('p');\nstatus.style.cssText = 'margin:0;font-size:.9rem;opacity:.8';\nstatus.textContent = 'No file yet. Try a CSV with a header row.';\n\nconst parse = (text) => {\n  const lines = text.trim().split(/\\r?\\n/).filter(Boolean);\n  const split = (line) => line.split(',').map((cell) => cell.trim().replace(/^\"|\"$/g, ''));\n  const headers = split(lines.shift() || '');\n  return {\n    columns: headers.map((label, i) => ({ key: `c${i}`, label, sortable: true })),\n    rows: lines.map((line, n) => Object.fromEntries([['id', n], ...split(line).map((cell, i) => [`c${i}`, cell])]))\n  };\n};\n\nconst picker = await slice.build('FileUpload', {\n  variant: 'compact',\n  accept: '.csv,text/csv',\n  maxSize: '2 MB',\n  prompt: 'Choose a CSV',\n  onChange: async (files) => {\n    if (!files.length) {\n      table.columns = []; table.rows = [];\n      status.textContent = 'No file yet. Try a CSV with a header row.';\n      return;\n    }\n    const { columns, rows } = parse(await files[0].text());\n    table.columns = columns;\n    table.rows = rows;\n    status.textContent = `${rows.length} rows from ${files[0].name}`;\n  }\n});\n\n// A sample, for trying it without a file at hand.\nconst sample = await slice.build('Button', {\n  value: 'Use a sample file', variant: 'ghost', size: 'sm',\n  onClick: () => picker.addFiles([new File(\n    ['name,city,orders\\nAna Pérez,Maracaibo,12\\nLuis Gómez,Caracas,7\\nMaría Rojas,Mérida,21'],\n    'customers.csv', { type: 'text/csv' }\n  )])\n});\n\nconst bar = document.createElement('div');\nbar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';\nbar.append(picker, sample);\npicker.style.flex = '1 1 280px';\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%';\nbox.append(bar, status, table);\nreturn box;\n:::\n\n:::script label=\"Profile picture\" expected=\"a round preview beside a compact picker that takes one image up to 2 MB; picking one shows it; Remove puts the initials back\"\nconst preview = document.createElement('div');\npreview.style.cssText = 'width:88px;height:88px;border-radius:50%;display:grid;place-items:center;font-size:1.6rem;font-weight:700;color:var(--primary-color-contrast);background:var(--primary-color);background-size:cover;background-position:center;flex:none';\npreview.textContent = 'AP';\nlet url = '';\n\nconst picker = await slice.build('FileUpload', {\n  variant: 'compact',\n  accept: 'image/*',\n  maxSize: '2 MB',\n  list: false,\n  prompt: 'Upload a photo',\n  icon: 'image',\n  onChange: (files) => {\n    // One URL at a time: the old one is freed before the new one is made.\n    if (url) URL.revokeObjectURL(url);\n    url = files[0] ? URL.createObjectURL(files[0]) : '';\n    preview.style.backgroundImage = url ? `url(\"${url}\")` : '';\n    preview.textContent = url ? '' : 'AP';\n    remove.hidden = !url;\n  }\n});\nconst remove = await slice.build('Button', { value: 'Remove', variant: 'ghost', size: 'sm', onClick: () => picker.clear() });\nremove.hidden = true;\n\nconst side = document.createElement('div');\nside.style.cssText = 'display:grid;gap:8px;flex:1 1 220px';\nside.append(picker, remove);\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;gap:20px;align-items:center;flex-wrap:wrap;width:100%;max-width:520px';\nbox.append(preview, side);\nreturn box;\n:::\n\n:::script label=\"Looks at a glance\" expected=\"the dropzone in three sizes, the compact variant, a disabled one and one with an error\"\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;width:100%';\nfor (const size of ['sm', 'md', 'lg']) {\n  box.appendChild(await slice.build('FileUpload', { label: `Size ${size}`, size, multiple: true }));\n}\nbox.appendChild(await slice.build('FileUpload', { label: 'Compact', variant: 'compact', multiple: true, accept: '.pdf' }));\nbox.appendChild(await slice.build('FileUpload', { label: 'Disabled', disabled: true }));\nbox.appendChild(await slice.build('FileUpload', { label: 'With an error', error: 'The contract is missing', variant: 'compact' }));\nreturn box;\n:::\n\n## Best Practices\n:::tip\nSay what is allowed before people pick: set `accept`, `maxSize` and `maxFiles`, and the zone writes the hint for you. Finding out after a slow upload is the worst time.\n:::\n\n:::tip\nPass the `signal` to `fetch(url, { signal, body: file })`. Cancel then really stops the request, instead of hiding a file that keeps uploading.\n:::\n\n:::tip\nRead files in the page when you can: `await file.text()` for a CSV, an image's object URL for a preview. Nothing needs to reach the server until the person confirms.\n:::\n\n## Pitfalls\n:::warning\n`accept` and `maxSize` help people, but they are not security. Check the type and the size again on the server: a request can be sent without this page.\n:::\n\n:::warning\nEvery `URL.createObjectURL` you make yourself keeps its file in memory until you call `URL.revokeObjectURL`. FileUpload frees its own previews. Free the ones you create, as the gallery and profile examples do.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"label\": \"Attachments\",\n  \"multiple\": true,\n  \"accept\": \".pdf,image/*\",\n  \"maxSize\": \"5 MB\"\n}") {
               try {
                  props = JSON.parse("{\n  \"label\": \"Attachments\",\n  \"multiple\": true,\n  \"accept\": \".pdf,image/*\",\n  \"maxSize\": \"5 MB\"\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('FileUpload', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"accept\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"multiple\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"maxSize\",\"type\":\"any\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"maxFiles\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"prompt\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"hint\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"string\",\"required\":false,\"default\":\"upload\",\"allowedValues\":[]},{\"path\":\"help\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"error\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"invalid\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"list\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"preview\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"paste\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"dropzone\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"upload\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"autoUpload\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"concurrency\",\"type\":\"number\",\"required\":false,\"default\":\"3\",\"allowedValues\":[]},{\"path\":\"validateOn\",\"type\":\"string\",\"required\":false,\"default\":\"change\",\"allowedValues\":[]},{\"path\":\"messages\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onFiles\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onReject\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onUpload\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onUploadError\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"accept\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"multiple\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"maxSize\",\"type\":\"any\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"maxFiles\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"prompt\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"hint\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"string\",\"required\":false,\"default\":\"upload\",\"allowedValues\":[]},{\"path\":\"help\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"error\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"invalid\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"list\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"preview\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"paste\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"dropzone\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"upload\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"autoUpload\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"concurrency\",\"type\":\"number\",\"required\":false,\"default\":\"3\",\"allowedValues\":[]},{\"path\":\"validateOn\",\"type\":\"string\",\"required\":false,\"default\":\"change\",\"allowedValues\":[]},{\"path\":\"messages\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onFiles\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onReject\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onUpload\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onUploadError\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
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

customElements.define('slice-fileuploaddocumentation', FileUploadDocumentation);
