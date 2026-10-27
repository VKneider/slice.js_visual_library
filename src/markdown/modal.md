---
title: Modal
route: /docs/feedback/modal
navLabel: Modal
section: Feedback
group: Overlay
order: 10
description: Native dialog with sizes, tones, centred, top, drawer, sheet and fullscreen layouts, actions, a close guard, a promise for the answer and enter/exit animations.
component: ModalDocumentation
generate: true
tags: [modal, dialog, drawer, sheet, overlay, feedback]
---

# Modal

## Overview
`Modal` is a dialog built on the native `<dialog>` element. The browser handles the hard parts: the dialog sits above everything (no `z-index` to fight, and no ancestor with `overflow: hidden` can clip it), the page behind becomes inert, and focus stays inside. On top of that, `Modal` gives you:
- five layouts: centred, near the top, a drawer from any side, a bottom sheet and fullscreen;
- sizes and tones;
- content and buttons straight from props;
- one close path you can guard ("you have unsaved changes");
- a promise for the answer;
- animations both in and out.

## Core Behavior
- `open` shows or hides it. `show()` opens it and returns a promise that resolves with `{ returnValue, reason }` when it closes.
- `title` and `description` fill the header. They also name and describe the dialog for screen readers (`aria-labelledby` and `aria-describedby`). A modal with no title should get an `ariaLabel`.
- `icon` is any `Icon` name, shown in a tinted circle before the title.
- `content` fills the body. It takes text (shown as a paragraph, never parsed as HTML), a node, or a list mixing both. Setting it again replaces only what it put there before. `appendBody(node)` and `appendFooter(node)` still work and leave that alone.
- `actions` are the footer buttons. See [Actions](#actions).
- Focus:
  - When the modal opens, focus goes to the element marked `autofocus` if there is one. Otherwise it goes to the dialog itself, so it does not land on the ✕.
  - `initialFocus` chooses the element instead: a CSS selector, `'first'` for the first field or button, or `'dialog'`.
  - When the modal closes, focus returns to whatever had it before. `returnFocus: false` turns that off.
- The page behind stops scrolling while the modal is open. Stacked modals share the lock, so it is released only when the last one closes. `scrollLock: false` leaves the page scrollable.
- An empty footer is hidden. A header with no title, description or icon shrinks to a ✕ in the corner. With `dismissable: false` as well, the header disappears.

## Looks
- `size`: `'sm'` (400px), `'md'` (520px, default), `'lg'` (720px), `'xl'` (960px) or `'full'` (the whole screen minus a 16px margin). On a drawer the sizes are 320, 400, 560 and 720px. `width` and `maxWidth` override the size with any CSS length.
- `tone`:
  - `'neutral'` (default) uses the primary colour.
  - `'info'`, `'success'`, `'warning'` and `'danger'` tint the top bar and the icon circle.
  - A tone also brings its own icon. `icon: 'none'` turns it off.
- `accent: false` removes the coloured bar on top.
- `customColor: { background, text, accent }` sets the colours by hand.

## Layouts
- `layout`:
  - `'center'` (default): a box in the middle of the screen.
  - `'top'`: a box near the top, for search and command palettes.
  - `'drawer'`: a panel the height (or width) of the screen, from the edge set by `side` (`'right'` by default, or `'left'`, `'top'` or `'bottom'`).
  - `'sheet'`: rises from the bottom edge, with a grab handle. Drag the handle or the header down to close it. On a sheet the action buttons stretch across the full width, which suits thumbs.
  - `'fullscreen'`: the whole viewport, for editors and long flows.
- `mobileLayout: 'sheet'` or `'fullscreen'` switches to that layout at `breakpoint` (600px) and below, and back when the window grows. `effectiveLayout` tells you which one is showing.
- Each layout enters and leaves from its own direction: a drawer slides in from its side, a sheet from below. With reduced motion turned on, the modal simply appears and disappears.

## Actions
`actions` is a list of buttons for the footer. Each one is a `Button` config plus a few extras:
- `value` is the text. `variant`, `icon` and `size` are passed to `Button`.
- `onClick({ modal, action })` runs when it is clicked. Return `false` to stop the modal from closing.
- `close` decides what happens after the click:
  - With no `onClick`, a button closes the modal by default, and its `value` becomes the return value. That is all a "Cancel" or "OK" needs.
  - With an `onClick`, a button leaves the modal open unless you say `close: true`.
  - `close: 'saved'` closes it with that return value.
- `autofocus: true` focuses the button when the modal opens. Use it on the safe choice.
- `disabled` and `hidden` do what they say. A node in the list is placed as it is.
- `actionsAlign` arranges the buttons: `'end'` (default), `'start'`, `'between'` or `'stretch'`.

## Closing
Every way of closing has a reason, and `onClose({ returnValue, reason })` reports it:
- `'escape'`: the Escape key, or the back gesture on Android.
- `'backdrop'`: a click outside the dialog.
- `'close-button'`: the ✕.
- `'action'`: an action button.
- `'swipe'`: a sheet dragged down.
- `'form'`: a `<form method="dialog">` inside was submitted. The return value is the value of the button that submitted it.
- `'api'`: your code called `close()`.

How to control it:
- `onBeforeClose({ reason, returnValue })` runs before anything a person does closes the modal. Return `false`, or a promise that resolves to `false`, and the modal stays open.
- `close(returnValue)` closes it straight away, without asking `onBeforeClose`, because a call from your code is a decision already made. `requestClose(reason, returnValue)` goes through the guard and resolves with whether the modal closed.
- `dismissable: false` removes the ✕ and ignores Escape and backdrop clicks. `closeOnEscape` and `closeOnBackdrop` turn off one of them alone.
- A backdrop click that is not allowed to close the modal gives it a small shake, so the click does not seem lost.
- An Escape that something inside the modal already used does not close it. For example, pressing Escape in an open `Select` or `DropDown` closes only the menu.
- `destroyOnClose: true` destroys and removes the modal once it has closed and finished animating out. Use it for modals you build for a single question.

## Live Preview
:::component name="Modal"
{
  "title": "Invite people",
  "description": "They will get an email with a link.",
  "content": "Everyone you invite can view and comment on this workspace.",
  "actions": [{ "value": "Cancel", "variant": "ghost" }, { "value": "Send invites" }]
}
:::

## Examples
Each example is a small piece of a real app, built with other components from the library, so you can see the modal doing its job rather than its props one by one.

:::script label="Projects: delete with a typed confirmation" expected="the ⋯ menu of a row opens a danger modal; Delete stays disabled until you type the project name; the row disappears and a toast confirms"
const toasts = await slice.build('ToastProvider', { singleton: true });
let projects = [
  { id: 1, name: 'website-redesign', owner: 'Ana López', files: 24, updated: '2 hours ago' },
  { id: 2, name: 'mobile-app', owner: 'José Pérez', files: 112, updated: 'yesterday' },
  { id: 3, name: 'q4-report', owner: 'Lucas Molina', files: 8, updated: '3 days ago' },
  { id: 4, name: 'brand-assets', owner: 'Ana López', files: 57, updated: 'last week' }
];

const confirmDelete = async (row) => {
  const hint = document.createElement('p');
  hint.style.margin = '0 0 10px';
  const name = document.createElement('strong');
  name.textContent = row.name;
  hint.append('Type ', name, ' to confirm.');
  const input = await slice.build('Input', { placeholder: row.name });

  const modal = await slice.build('Modal', {
    title: `Delete ${row.name}?`,
    description: `Its ${row.files} files and the whole history go with it. This cannot be undone.`,
    tone: 'danger',
    size: 'sm',
    content: [hint, input],
    initialFocus: 'input',
    destroyOnClose: true,
    actions: [
      { value: 'Cancel', variant: 'ghost' },
      { value: 'Delete project', variant: 'danger', close: 'delete', disabled: true }
    ]
  });
  // The destructive button only wakes up once the name is typed exactly.
  const matches = () => input.value.trim() === row.name;
  input.onChange = () => {
    const btn = modal.footerElement.querySelector('.slice-modal__action:last-child');
    if (btn) btn.disabled = !matches();
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && matches()) modal.close('delete');
  });

  document.body.appendChild(modal);
  const { returnValue } = await modal.show();
  if (returnValue !== 'delete') return;
  projects = projects.filter((p) => p.id !== row.id);
  table.rows = projects;
  toasts.show(`${row.name} was deleted`, { type: 'success' });
};

const table = await slice.build('Table', {
  columns: [
    { key: 'name', label: 'Project', sortable: true },
    { key: 'owner', label: 'Owner' },
    { key: 'files', label: 'Files', sortable: true },
    { key: 'updated', label: 'Updated' }
  ],
  rows: projects,
  rowKey: 'id',
  rowActions: [
    { label: 'Delete', danger: true, onClick: ({ row }) => confirmDelete(row) }
  ]
});
table.style.width = '100%';
return table;
:::

:::script label="Contacts: edit in a Form, with an unsaved-changes guard" expected="clicking a card opens a Form; closing with changes asks first in a second, stacked modal; Save updates the card"
const toasts = await slice.build('ToastProvider', { singleton: true });
const contacts = [
  { name: 'Ana López', email: 'ana@example.com', role: 'Owner', notify: true },
  { name: 'José Pérez', email: 'jose@example.com', role: 'Editor', notify: false },
  { name: 'Lucas Molina', email: 'lucas@example.com', role: 'Viewer', notify: true }
];

// A second modal on top of the first: both share the scroll lock and the
// focus goes back to the form when it closes.
const askDiscard = async () => {
  const ask = await slice.build('Modal', {
    title: 'Discard your changes?',
    description: 'What you typed in this form will be lost.',
    tone: 'warning',
    size: 'sm',
    destroyOnClose: true,
    actions: [
      { value: 'Keep editing', variant: 'ghost', autofocus: true },
      { value: 'Discard', variant: 'danger', close: 'discard' }
    ]
  });
  document.body.appendChild(ask);
  return (await ask.show()).returnValue === 'discard';
};

const edit = async (contact, card) => {
  let modal;
  const form = await slice.build('Form', {
    variant: 'plain',
    columns: 2,
    submitText: 'Save changes',
    schema: [
      { kind: 'field', name: 'name', label: 'Name', component: 'Input', required: true, value: contact.name },
      { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true, value: contact.email,
        validate: (v) => (/\S+@\S+\.\S+/.test(v) ? null : 'Enter a valid email') },
      { kind: 'field', name: 'role', label: 'Role', component: 'RadioGroup', full: true, value: contact.role,
        props: { options: ['Owner', 'Editor', 'Viewer'], orientation: 'horizontal' } },
      { kind: 'field', name: 'notify', label: 'Email them when someone comments', component: 'Switch',
        valueProp: 'checked', full: true, value: contact.notify }
    ],
    onSubmit: (values) => {
      Object.assign(contact, values);
      card.title = contact.name;
      card.text = `${contact.role} · ${contact.email}`;
      modal.close('saved');   // close() skips the guard: nothing is lost
      toasts.show(`Saved ${contact.name}`, { type: 'success' });
    }
  });
  const initial = JSON.stringify(form.getValues());

  modal = await slice.build('Modal', {
    title: `Edit ${contact.name}`,
    description: 'Changes are visible to the whole team.',
    size: 'lg',
    mobileLayout: 'sheet',
    content: form,
    destroyOnClose: true,   // also destroys the Form inside
    onBeforeClose: async () => JSON.stringify(form.getValues()) === initial || askDiscard()
  });
  document.body.appendChild(modal);
  modal.open = true;
};

const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;width:100%';
for (const contact of contacts) {
  const card = await slice.build('Card', {
    title: contact.name,
    text: `${contact.role} · ${contact.email}`,
    variant: 'outlined',
    interactive: true
  });
  card.onClick = () => edit(contact, card);
  grid.appendChild(card);
}
return grid;
:::

:::script label="Orders: a filters drawer" expected="Filters opens a drawer (a sheet on phones) with a RadioGroup, a Select and a Switch; Apply filters the table and shows removable chips"
const names = ['Ana López', 'José Pérez', 'Lucas Molina', 'María Ruiz', 'Carlos Díaz', 'Elena Mora'];
const cities = ['Maracaibo', 'Caracas', 'Valencia', 'Mérida'];
const statuses = ['Pending', 'Shipped', 'Delivered'];
const orders = Array.from({ length: 30 }, (_, i) => ({
  id: 1001 + i,
  customer: names[i % names.length],
  city: cities[(i * 3) % cities.length],
  status: statuses[i % statuses.length],
  express: i % 4 === 0,
  total: ((i * 37) % 180) + 20
}));
const filters = { status: 'All', cities: [], express: false };

const table = await slice.build('Table', {
  columns: [
    { key: 'id', label: 'Order', render: (row) => `#${row.id}` },
    { key: 'customer', label: 'Customer', sortable: true },
    { key: 'city', label: 'City' },
    { key: 'status', label: 'Status' },
    { key: 'total', label: 'Total', align: 'right', sortable: true, render: (row) => `$${row.total}` }
  ],
  rows: orders,
  rowKey: 'id',
  pageSize: 8
});
table.style.width = '100%';

const chips = document.createElement('div');
chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-height:32px';

const apply = async () => {
  table.rows = orders.filter((o) =>
    (filters.status === 'All' || o.status === filters.status) &&
    (filters.cities.length === 0 || filters.cities.includes(o.city)) &&
    (!filters.express || o.express));
  slice.controller.destroyByContainer(chips);
  chips.replaceChildren();
  const add = async (label, clear) => {
    chips.appendChild(await slice.build('Chip', {
      label, size: 'sm', variant: 'accent', removable: true,
      onRemove: () => { clear(); apply(); }
    }));
  };
  if (filters.status !== 'All') await add(filters.status, () => { filters.status = 'All'; });
  for (const city of filters.cities) await add(city, () => { filters.cities = filters.cities.filter((c) => c !== city); });
  if (filters.express) await add('Express only', () => { filters.express = false; });
};

const openFilters = async () => {
  const status = await slice.build('RadioGroup', {
    label: 'Status', options: ['All', ...statuses], value: filters.status
  });
  const city = await slice.build('Select', {
    label: 'City', options: cities, multiple: true, selected: filters.cities
  });
  const express = await slice.build('Switch', {
    label: 'Express shipping only', checked: filters.express, labelPlacement: 'left'
  });
  const body = document.createElement('div');
  body.style.cssText = 'display:flex;flex-direction:column;gap:20px';
  body.append(status, city, express);

  const modal = await slice.build('Modal', {
    title: 'Filters',
    description: `${orders.length} orders`,
    layout: 'drawer',
    size: 'sm',
    mobileLayout: 'sheet',
    content: body,
    destroyOnClose: true,
    actionsAlign: 'stretch',
    actions: [
      { value: 'Reset', variant: 'outlined', onClick: () => { status.value = 'All'; city.selected = []; express.checked = false; } },
      {
        value: 'Apply', close: true,
        onClick: () => {
          filters.status = status.value;
          filters.cities = [...(city.selected || [])];
          filters.express = express.checked;
          apply();
        }
      }
    ]
  });
  document.body.appendChild(modal);
  modal.open = true;
};

const button = await slice.build('Button', { value: 'Filters', icon: 'filter', variant: 'outlined', onClick: openFilters });
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px';
bar.append(button, chips);
const wrap = document.createElement('div');
wrap.style.width = '100%';
wrap.append(bar, table);
return wrap;
:::

:::script label="Upload files with progress" expected="pick or drop files; Upload sends them with progress per file, and the modal cannot be dismissed until it finishes"
const toasts = await slice.build('ToastProvider', { singleton: true });
const summary = document.createElement('p');
summary.textContent = 'No files uploaded yet.';

// A pretend server: reports progress, takes longer for bigger files.
const send = async (file, { signal, onProgress }) => {
  for (let p = 0.2; p <= 1; p += 0.2) {
    if (signal.aborted) throw new Error('aborted');
    await new Promise((r) => setTimeout(r, 80 + Math.min(200, file.size / 5000)));
    onProgress(p);
  }
  return { name: file.name };
};

const openUpload = async () => {
  let modal;
  const uploadButton = () => modal.footerElement.querySelector('.slice-modal__action:last-child');

  // The list, the progress bars and cancel come with FileUpload.
  const zone = await slice.build('FileUpload', {
    multiple: true,
    maxFiles: 10,
    maxSize: '20 MB',
    upload: send,
    autoUpload: false,
    onChange: (files) => { uploadButton().disabled = files.length === 0; }
  });

  modal = await slice.build('Modal', {
    title: 'Upload files',
    icon: 'upload',
    content: zone,
    mobileLayout: 'sheet',
    destroyOnClose: true,
    actions: [
      { value: 'Cancel', variant: 'ghost' },
      {
        value: 'Upload',
        disabled: true,
        close: 'done',
        onClick: async () => {
          // While uploading nothing may close it: no ✕, no Escape, no backdrop.
          modal.dismissable = false;
          modal.footerElement.querySelectorAll('slice-button').forEach((b) => { b.disabled = true; });
          const items = await zone.uploadAll();
          modal.dismissable = true;
          if (items.some((i) => i.status === 'error')) {
            modal.footerElement.querySelectorAll('slice-button').forEach((b) => { b.disabled = false; });
            return false;   // stay open, so the failed ones can be retried
          }
        }
      }
    ]
  });
  document.body.appendChild(modal);
  const { returnValue } = await modal.show();
  if (returnValue === 'done') {
    summary.textContent = `Uploaded ${zone.results.length} file${zone.results.length === 1 ? '' : 's'}.`;
    toasts.show(summary.textContent, { type: 'success' });
  }
};

const btn = await slice.build('Button', { value: 'Upload files', icon: 'upload', onClick: openUpload });
const box = document.createElement('div');
box.append(btn, summary);
return box;
:::

:::script label="Account settings with Tabs" expected="a large modal with Profile, Notifications and Danger zone tabs (fullscreen on phones); Delete account opens a second modal on top"
const toasts = await slice.build('ToastProvider', { singleton: true });

const open = async () => {
  const profile = await slice.build('Form', {
    variant: 'plain',
    columns: 2,
    submitText: 'Save profile',
    schema: [
      { kind: 'field', name: 'first', label: 'First name', component: 'Input', value: 'Ana' },
      { kind: 'field', name: 'last', label: 'Last name', component: 'Input', value: 'López' },
      { kind: 'field', name: 'bio', label: 'Bio', component: 'Textarea', full: true, value: 'Designer at Northwind.', props: { rows: 3 } }
    ],
    onSubmit: () => toasts.show('Profile saved', { type: 'success' })
  });

  const notifications = document.createElement('div');
  notifications.style.cssText = 'display:flex;flex-direction:column;gap:12px;padding-top:4px';
  for (const [label, checked] of [['Comments on my work', true], ['Mentions', true], ['Weekly digest', false], ['Product news', false]]) {
    notifications.appendChild(await slice.build('Switch', {
      label, checked, labelPlacement: 'left',
      onChange: (on) => toasts.show(`${label}: ${on ? 'on' : 'off'}`, { type: 'info' })
    }));
  }

  const danger = document.createElement('div');
  danger.style.cssText = 'display:flex;flex-direction:column;gap:12px;align-items:flex-start;padding-top:4px';
  const warning = document.createElement('p');
  warning.style.margin = '0';
  warning.textContent = 'Deleting your account removes your projects, comments and files for good.';
  const deleteBtn = await slice.build('Button', {
    value: 'Delete account',
    variant: 'danger',
    onClick: async () => {
      const confirm = await slice.build('Modal', {
        title: 'Delete your account?',
        description: 'You will be signed out everywhere.',
        tone: 'danger',
        size: 'sm',
        destroyOnClose: true,
        actions: [{ value: 'Keep my account', variant: 'ghost', autofocus: true }, { value: 'Delete', variant: 'danger', close: 'delete' }]
      });
      document.body.appendChild(confirm);
      const { returnValue } = await confirm.show();
      if (returnValue === 'delete') {
        settings.close();
        toasts.show('Account scheduled for deletion', { type: 'warning' });
      }
    }
  });
  danger.append(warning, deleteBtn);

  const tabs = await slice.build('Tabs', {
    items: [
      { id: 'profile', label: 'Profile', panel: profile },
      { id: 'notifications', label: 'Notifications', panel: notifications },
      { id: 'danger', label: 'Danger zone', panel: danger }
    ],
    activeTab: 'profile'
  });

  const settings = await slice.build('Modal', {
    title: 'Settings',
    icon: 'cog',
    size: 'lg',
    mobileLayout: 'fullscreen',
    content: tabs,
    destroyOnClose: true,
    actions: [{ value: 'Done' }]
  });
  document.body.appendChild(settings);
  settings.open = true;
};

return await slice.build('Button', { value: 'Open settings', icon: 'cog', variant: 'outlined', onClick: open });
:::

:::script label="Command palette" expected="a search box near the top; type to filter, ↑ ↓ to move, Enter or a click to run"
const toasts = await slice.build('ToastProvider', { singleton: true });
const commands = [
  { label: 'New project', icon: 'plus' },
  { label: 'Invite people', icon: 'user-add' },
  { label: 'Search files', icon: 'search' },
  { label: 'Notifications', icon: 'bell' },
  { label: 'Open settings', icon: 'cog' },
  { label: 'Upload files', icon: 'upload' },
  { label: 'Go home', icon: 'home' }
];

const open = async () => {
  const input = document.createElement('input');
  input.placeholder = 'Type a command…';
  input.setAttribute('aria-label', 'Command');
  input.style.cssText = 'width:100%;box-sizing:border-box;font:inherit;font-size:1rem;padding:12px 14px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:10px;background:transparent;color:inherit;outline-color:var(--primary-color)';
  const list = document.createElement('ul');
  list.setAttribute('role', 'listbox');
  list.style.cssText = 'list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:2px';

  // Build every row (and its Icon) once; filtering only hides rows.
  const rows = [];
  for (const command of commands) {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.style.cssText = 'display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer';
    li.appendChild(await slice.build('Icon', { name: command.icon, size: 'small' }));
    li.append(command.label);
    li.addEventListener('click', () => run(command));
    li.addEventListener('pointermove', () => { active = visible().indexOf(li); paint(); });
    list.appendChild(li);
    rows.push({ li, command });
  }
  let active = 0;
  const visible = () => rows.filter((r) => r.li.style.display !== 'none').map((r) => r.li);
  const paint = () => rows.forEach(({ li }) => { li.style.background = ''; li.removeAttribute('aria-selected'); }) || visible().forEach((li, i) => {
    li.style.background = i === active ? 'color-mix(in srgb, var(--primary-color) 14%, transparent)' : '';
    li.setAttribute('aria-selected', String(i === active));
  });
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    for (const r of rows) r.li.style.display = r.command.label.toLowerCase().includes(q) ? 'flex' : 'none';
    active = 0;
    paint();
  });
  input.addEventListener('keydown', (event) => {
    const shown = visible();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      active = (active + (event.key === 'ArrowDown' ? 1 : -1) + shown.length) % Math.max(1, shown.length);
      paint();
    } else if (event.key === 'Enter' && shown[active]) {
      run(rows.find((r) => r.li === shown[active]).command);
    }
  });
  paint();

  const modal = await slice.build('Modal', {
    ariaLabel: 'Command palette',
    layout: 'top',
    accent: false,
    content: [input, list],
    initialFocus: 'input',
    destroyOnClose: true   // destroys the Icons too
  });
  const run = (command) => {
    modal.close(command.label);
    toasts.show(`Ran “${command.label}”`, { type: 'info' });
  };
  document.body.appendChild(modal);
  modal.open = true;
};

return await slice.build('Button', { value: 'Search commands', icon: 'search', variant: 'soft', onClick: open });
:::

:::script label="Live log viewer" expected="a draggable, resizable window streaming log lines; Follow keeps the newest line in view; closing it stops the stream"
const open = async () => {
  const pre = document.createElement('pre');
  pre.style.cssText = 'margin:0;font-size:12.5px;line-height:1.55;white-space:pre-wrap';
  const follow = await slice.build('Switch', { label: 'Follow', checked: true, labelPlacement: 'left' });
  let count = 0;
  const levels = ['INFO ', 'INFO ', 'INFO ', 'WARN ', 'DEBUG'];
  const timer = setInterval(() => {
    count += 1;
    const time = new Date().toLocaleTimeString();
    pre.append(`[${time}] ${levels[count % levels.length]} request ${1000 + count} served in ${(count * 13) % 240}ms\n`);
    if (follow.checked) modal.bodyElement.scrollTop = modal.bodyElement.scrollHeight;
  }, 400);

  const modal = await slice.build('Modal', {
    title: 'api-gateway · logs',
    description: 'Streaming from production',
    size: 'lg',
    draggable: true,
    resizable: true,
    content: pre,
    destroyOnClose: true,
    // A modal that starts something stops it when it closes.
    onClose: () => clearInterval(timer),
    actionsAlign: 'between',
    actions: [
      follow,
      { value: 'Clear', variant: 'outlined', onClick: () => { pre.textContent = ''; } }
    ]
  });
  document.body.appendChild(modal);
  modal.open = true;
};

return await slice.build('Button', { value: 'View logs', icon: 'file-lines', onClick: open });
:::

## Scrolling
The dialog is at most `min(85vh, 640px)` tall. Past that, only the body scrolls: the header and footer stay in view, and a scroll that reaches the end of the body does not carry on into the page on touch screens. To change the cap:

```css
slice-modal { --modal-max-height: min(90vh, 900px); }
```

## Best Practices
:::tip
For a plain "are you sure?", use [ConfirmActionModal](/docs/display/confirm-action-modal): it is this modal with the question, the two buttons and the promise already wired up. Reach for `Modal` when the content is your own.
:::

:::tip
Put `autofocus` on the safe action of a destructive dialog ("Cancel"), not on "Delete". A stray Enter should never destroy anything.
:::

:::tip
Use `mobileLayout: 'sheet'` for modals people open on phones. A sheet sits where the thumb is, and it can be closed with a swipe.
:::

## Pitfalls
:::warning
A `Modal` built with `slice.build` is not destroyed when it closes. Pass `destroyOnClose: true` for a one-off modal, or build one once and reuse it. Building a new one on every click without either leaks a component each time.
:::

:::warning
`close()` skips `onBeforeClose` on purpose. If your code closes the modal on someone's behalf and the guard should still run, call `requestClose()`.
:::

:::warning
`resizable: true` removes the width and height caps while the modal is open, so it can grow past them. Drag and resize only apply to the `center` and `top` layouts; on a drawer, sheet or fullscreen they are off.
:::