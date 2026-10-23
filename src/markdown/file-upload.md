---
title: FileUpload
route: /docs/input/file-upload
navLabel: FileUpload
section: Input Components
group: Basic
order: 12
description: Pick, drop or paste files, check them (type, size, count), see them with previews, remove them, and upload them with progress, retry and cancel. A real file input underneath, and a Form field.
component: FileUploadDocumentation
generate: true
tags: [file, upload, dropzone, drop, input, attachment, image]
---

# FileUpload

## Overview
`FileUpload` takes files from people: picked with the file dialog, dropped on the zone, or pasted. It checks each file and turns away the wrong ones with a reason. It then lists the accepted files with a preview and a remove button, and can upload them with progress.

Underneath is a real `<input type="file">` inside a `<label>`, so the zone opens the picker with a click, a tap, **Enter** or **Space**, and **Tab** reaches it like any other field.

### When to use it
- Attachments in a form: a CV, receipts, a contract.
- Images for a profile, a listing or a gallery.
- Importing a file the page will read itself, such as a CSV into a Table.

### When not to use it
- For one image with a crop step (an avatar editor), FileUpload only does the picking. The crop is another component.
- For files that already live on the server, a FileUpload is the wrong tool. Show them in a list or a Table, with their own actions.

## Core Behavior

### Taking files
- `multiple` allows several files. Without it, a new file replaces the one already there.
- `paste` (default `true`) takes files pasted while the zone has the focus, such as a screenshot.
- `browse()` opens the picker from code. `addFiles(files)` adds files from code, with the same checks.

### Checks
Each file is checked before it is accepted:
- `accept` (`'.pdf,image/*'`) limits the type. Dropped files are checked too, which the browser does not do by itself.
- `maxSize` (`'5 MB'`, `'500 KB'` or a number of bytes) limits each file.
- `maxFiles` limits how many files there can be.

Files that fail are listed under the zone with the reason ("notes.txt: This type of file is not allowed") and reported to `onReject(rejected)`, as `[{ file, reason: 'type' | 'size' | 'count', message }]`.

When you give no `hint`, the zone writes one from the checks: "PDF, IMAGE · up to 5.0 MB · 3 files at most".

### The list
The accepted files are listed under the zone:
- a preview for images, or the file's extension;
- the name and the size;
- a remove button.

`list: false` hides the list when you show the files your own way, and `preview: false` keeps images as an extension tag. Removing a file moves the focus to the next one, or back to the zone.

### Uploading
Pass `upload(file, { signal, onProgress })` and FileUpload sends each file:
- `onProgress(value)` takes 0–1 or 0–100 and fills that file's progress bar;
- what `upload` returns is kept, and `results` lists it;
- a thrown error marks the file as failed with its message, and **Retry** sends it again;
- the ✕ during an upload aborts `signal` (pass it to `fetch`) and drops the file;
- `concurrency` (default 3) sets how many files go at once;
- `autoUpload: false` waits for `uploadAll()`, which resolves when every file is done or has failed;
- `onUpload(file, result)` and `onUploadError(file, error)` report each file.

### The value
- `value` is the list of accepted files (`File[]`). It can be set from code, and `clear()` and `removeFile(file)` change it.
- `onChange(files, { items })` and the `change` event report every change. `onFiles(added)` reports only the new files.
- `items` gives each file's state: `{ file, status, progress, result, error }`.
- `name` adds a hidden input that carries the files, so a plain `<form>` posts them.

### Validation
- `required` shows "Add at least one file" when `validate()` runs (and on a Form's submit), never on its own.
- `validationMessage` also reports files still uploading ("Wait for the uploads to finish") or failed ones. A Form will not submit while either is true.
- `error` and `invalid` set an error from outside, `help` adds a line under the zone, and `validateOn: 'manual'` leaves all checking to `validate()`.

### Inside a Form
Use `component: 'FileUpload'` in the schema. The Form shows the label and the errors, and `getValues()` returns the `File[]` under the field's name.

### Memory
Image previews use object URLs, which keep the file in memory until they are revoked. FileUpload revokes each one when its file is removed, the files are replaced or the component is destroyed. Destroying it also aborts uploads in flight.

## Looks
- `variant`:
  - `'dropzone'` (default): a large area for dropping files;
  - `'compact'`: one row with a button, for forms where space is tight. It still takes drops.
- `size`: `'sm'`, `'md'` (default) or `'lg'`.
- `icon` is the zone's icon (`'upload'` by default, `''` for none). `prompt` replaces the zone's text, and `hint` the line under it.
- `label` puts a label above the zone, outside a Form.

## Language
- `texts` replaces the zone's words:
  - `prompt` / `promptOne`, where `{browse}` marks the link;
  - `browse`;
  - `compact` / `compactOne`;
  - `remove`, `retry`, `cancel`;
  - `uploading`, with `{percent}`;
  - `done`, `failed`, `upTo`, `maxFiles`.
- `messages` replaces the errors: `required`, `type`, `tooLarge` (`{max}`), `tooMany` (`{max}`), `uploading` and `failed`.

## Live Preview
:::component name="FileUpload"
{
  "label": "Attachments",
  "multiple": true,
  "accept": ".pdf,image/*",
  "maxSize": "5 MB"
}
:::

## Examples
:::script label="Job application" expected="a Form with name, email, a required CV (PDF or Word, up to 5 MB) and a cover letter; Submit without a CV says so; a wrong file type is turned away with the reason"
const toasts = await slice.build('ToastProvider', { singleton: true });
const form = await slice.build('Form', {
  columns: 2,
  submitText: 'Send application',
  schema: [
    { kind: 'field', name: 'name', label: 'Full name', component: 'Input', required: true },
    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true, props: { type: 'email' } },
    { kind: 'field', name: 'cv', label: 'CV', component: 'FileUpload', required: true, full: true,
      props: { accept: '.pdf,.doc,.docx', maxSize: '5 MB', variant: 'compact' } },
    { kind: 'field', name: 'letter', label: 'Cover letter', component: 'Textarea', full: true, props: { rows: 4 } }
  ],
  onSubmit: (values) => toasts.show(`Thanks, ${values.name}. We got ${values.cv[0].name}.`, { type: 'success' })
});
return form;
:::

:::script label="Photo gallery" expected="drop or pick up to 8 images; each one uploads with progress (some fail and can be retried); uploaded photos appear as Cards, and removing a Card frees its image"
const toasts = await slice.build('ToastProvider', { singleton: true });

// A pretend server: progress in steps, and one upload in four fails.
const send = async (file, { signal, onProgress }) => {
  for (let p = 0.2; p <= 1; p += 0.2) {
    await new Promise((r) => setTimeout(r, 120));
    if (signal.aborted) throw new Error('aborted');
    onProgress(p);
  }
  if (Math.random() < 0.25) throw new Error('The server was busy');
  return { url: URL.createObjectURL(file), name: file.name };
};

const gallery = document.createElement('div');
gallery.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px';

const uploader = await slice.build('FileUpload', {
  multiple: true,
  accept: 'image/*',
  maxFiles: 8,
  maxSize: '10 MB',
  prompt: 'Drop photos here, or {browse}',
  upload: send,
  onUpload: async (file, result) => {
    const card = await slice.build('Card', {
      image: result.url,
      imageAlt: '',
      title: result.name,
      size: 'sm',
      mediaRatio: '4 / 3',
      actions: [{
        value: 'Remove', variant: 'ghost', icon: 'trash-bin',
        onClick: ({ card }) => {
          // The photo's object URL holds the file in memory: free it with the Card.
          URL.revokeObjectURL(result.url);
          slice.controller.destroyComponent(card);
          card.remove();
          uploader.removeFile(file);
        }
      }]
    });
    gallery.appendChild(card);
  },
  onUploadError: (file, error) => toasts.show(`${file.name}: ${error.message}`, { type: 'error' })
});

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:16px;width:100%';
box.append(uploader, gallery);
return box;
:::

:::script label="Import a CSV into a Table" expected="a compact picker that only takes .csv; the file is read in the page and its rows fill a Table; Clear empties both"
const table = await slice.build('Table', { columns: [], rows: [] });
table.style.width = '100%';
const status = document.createElement('p');
status.style.cssText = 'margin:0;font-size:.9rem;opacity:.8';
status.textContent = 'No file yet. Try a CSV with a header row.';

const parse = (text) => {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const split = (line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
  const headers = split(lines.shift() || '');
  return {
    columns: headers.map((label, i) => ({ key: `c${i}`, label, sortable: true })),
    rows: lines.map((line, n) => Object.fromEntries([['id', n], ...split(line).map((cell, i) => [`c${i}`, cell])]))
  };
};

const picker = await slice.build('FileUpload', {
  variant: 'compact',
  accept: '.csv,text/csv',
  maxSize: '2 MB',
  prompt: 'Choose a CSV',
  onChange: async (files) => {
    if (!files.length) {
      table.columns = []; table.rows = [];
      status.textContent = 'No file yet. Try a CSV with a header row.';
      return;
    }
    const { columns, rows } = parse(await files[0].text());
    table.columns = columns;
    table.rows = rows;
    status.textContent = `${rows.length} rows from ${files[0].name}`;
  }
});

// A sample, for trying it without a file at hand.
const sample = await slice.build('Button', {
  value: 'Use a sample file', variant: 'ghost', size: 'sm',
  onClick: () => picker.addFiles([new File(
    ['name,city,orders\nAna Pérez,Maracaibo,12\nLuis Gómez,Caracas,7\nMaría Rojas,Mérida,21'],
    'customers.csv', { type: 'text/csv' }
  )])
});

const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';
bar.append(picker, sample);
picker.style.flex = '1 1 280px';

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:12px;width:100%';
box.append(bar, status, table);
return box;
:::

:::script label="Profile picture" expected="a round preview beside a compact picker that takes one image up to 2 MB; picking one shows it; Remove puts the initials back"
const preview = document.createElement('div');
preview.style.cssText = 'width:88px;height:88px;border-radius:50%;display:grid;place-items:center;font-size:1.6rem;font-weight:700;color:var(--primary-color-contrast);background:var(--primary-color);background-size:cover;background-position:center;flex:none';
preview.textContent = 'AP';
let url = '';

const picker = await slice.build('FileUpload', {
  variant: 'compact',
  accept: 'image/*',
  maxSize: '2 MB',
  list: false,
  prompt: 'Upload a photo',
  icon: 'image',
  onChange: (files) => {
    // One URL at a time: the old one is freed before the new one is made.
    if (url) URL.revokeObjectURL(url);
    url = files[0] ? URL.createObjectURL(files[0]) : '';
    preview.style.backgroundImage = url ? `url("${url}")` : '';
    preview.textContent = url ? '' : 'AP';
    remove.hidden = !url;
  }
});
const remove = await slice.build('Button', { value: 'Remove', variant: 'ghost', size: 'sm', onClick: () => picker.clear() });
remove.hidden = true;

const side = document.createElement('div');
side.style.cssText = 'display:grid;gap:8px;flex:1 1 220px';
side.append(picker, remove);
const box = document.createElement('div');
box.style.cssText = 'display:flex;gap:20px;align-items:center;flex-wrap:wrap;width:100%;max-width:520px';
box.append(preview, side);
return box;
:::

:::script label="Looks at a glance" expected="the dropzone in three sizes, the compact variant, a disabled one and one with an error"
const box = document.createElement('div');
box.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;width:100%';
for (const size of ['sm', 'md', 'lg']) {
  box.appendChild(await slice.build('FileUpload', { label: `Size ${size}`, size, multiple: true }));
}
box.appendChild(await slice.build('FileUpload', { label: 'Compact', variant: 'compact', multiple: true, accept: '.pdf' }));
box.appendChild(await slice.build('FileUpload', { label: 'Disabled', disabled: true }));
box.appendChild(await slice.build('FileUpload', { label: 'With an error', error: 'The contract is missing', variant: 'compact' }));
return box;
:::

## Best Practices
:::tip
Say what is allowed before people pick: set `accept`, `maxSize` and `maxFiles`, and the zone writes the hint for you. Finding out after a slow upload is the worst time.
:::

:::tip
Pass the `signal` to `fetch(url, { signal, body: file })`. Cancel then really stops the request, instead of hiding a file that keeps uploading.
:::

:::tip
Read files in the page when you can: `await file.text()` for a CSV, an image's object URL for a preview. Nothing needs to reach the server until the person confirms.
:::

## Pitfalls
:::warning
`accept` and `maxSize` help people, but they are not security. Check the type and the size again on the server: a request can be sent without this page.
:::

:::warning
Every `URL.createObjectURL` you make yourself keeps its file in memory until you call `URL.revokeObjectURL`. FileUpload frees its own previews. Free the ones you create, as the gallery and profile examples do.
:::