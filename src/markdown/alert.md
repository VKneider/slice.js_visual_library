---
title: Alert
route: /docs/feedback/alert
navLabel: Alert
section: Feedback
group: Notifications
order: 9
description: A message inside the page, next to what it is about. Tone for the meaning, variant for the loudness; a title, actions such as Undo or Try again, a close button, and a timeout that waits while you point at it.
component: AlertDocumentation
generate: true
tags: [alert, notice, banner, callout, message, undo, feedback]
---

# Alert

## Overview
`Alert` is a message that sits in the page, next to what it talks about: "Changes saved" above a form, "Your trial ends in 3 days" at the top of the billing page, "2 rows removed · Undo" over a list, "The report could not be loaded · Try again" where the report should be.

Two choices, as in [Badge](/docs/display/badge) and [Button](/docs/input/button):

- **`tone`** is what it **means**: `neutral`, `info` (the default), `success`, `warning`, `danger`.
- **`variant`** is how **loud** it is: `soft` (a tint, the default), `filled` (for what must be seen now) or `outlined`.

### When to use it
- **The result of something done on this page**: saved, sent, failed, with what to do next.
- **A state of the page or the account**: a trial ending, a read-only record, a sync in progress.
- **An undo**: "Row removed · Undo" for a few seconds. [DataList](/docs/data/datalist) and [Table](/docs/data/table) use an Alert for exactly this.
- **An error with a way out**: "Could not load · Try again".

### When not to use it
- **Something that happened elsewhere, or that should not move the layout**: a [Toast](/docs/feedback/toast) floats over the app and goes away.
- **A question that needs an answer before going on**: a [Modal](/docs/feedback/modal) or [ConfirmActionModal](/docs/display/confirm-action-modal).
- **A status in a row or next to a title**: a [Badge](/docs/display/badge).
- **A field's error**: the field shows it ([Input](/docs/input/input) `error`).

## Core Behavior
- `title` and `message`. Either can be left out.
- `icon`: the tone gives one (`neutral` has none); an Icon name replaces it; `false` removes it.
- `actions: [{ label, onClick({ alert, event }), variant, icon, keepOpen }]`: [Button](/docs/input/button)s on the right. Using one closes the alert, unless it says `keepOpen`.
- `dismissible`: a ✕ to close it (`dismissLabel` is what screen readers hear).
- `timeout`: milliseconds until it closes by itself. The time **stops while the pointer or the focus is on it**, so nobody loses an Undo in the middle of reaching for it.
- `onDismiss({ reason })`: why it closed: `'close'` (the ✕), `'timeout'`, `'action'` or `'api'` (`hide()` from code).
- `danger` and `warning` interrupt a screen reader (`role="alert"`); the others wait their turn (`role="status"`).

### One alert, many messages
An alert can be placed once and reused: `open: false` starts it hidden, `show({ … })` shows it with new content, `hide()` takes it away. The `onDismiss` given to `show()` is for that showing only, which is what an undo needs:

```js
notice.show({
  tone: 'neutral', variant: 'filled', message: 'Row removed', timeout: 5000, dismissible: true,
  actions: [{ label: 'Undo', onClick: restore }],
  // The time ran out or it was closed: the removal is final.
  onDismiss: ({ reason }) => { if (reason !== 'action') deleteForGood(); },
});
```

## Looks
- `size`: `'md'` (default) or `'sm'`.
- Every tone, in every variant, is measured against WCAG AA in the light and the dark theme. It uses the same tokens as Badge (`--success-color-readable` and the rest; see [Badge › Theming](/docs/display/badge)).

## Live Preview
:::component name="Alert"
{
  "tone": "success",
  "title": "Changes saved",
  "message": "Your profile is up to date.",
  "dismissible": true
}
:::

## Examples
:::script label="After saving a form" expected="a short profile form; Save shows a soft success alert above it for 4 seconds ('Profile saved'); with an empty name it shows a danger alert with the problem instead, which stays until it is closed"
const status = await slice.build('Alert', { open: false, dismissible: true });
const name = await slice.build('Input', { label: 'Name', value: 'Ana López' });
const email = await slice.build('Input', { label: 'Email', value: 'ana@example.com', type: 'email' });
const save = await slice.build('Button', {
  value: 'Save',
  variant: 'filled',
  onClick: () => {
    if (!name.value.trim()) {
      status.show({ tone: 'danger', title: 'The profile was not saved', message: 'Write a name first.', timeout: 0 });
      return;
    }
    status.show({ tone: 'success', title: 'Profile saved', message: '', timeout: 4000 });
  }
});
const form = document.createElement('div');
form.style.cssText = 'display:grid;gap:12px;width:100%;max-width:420px';
form.append(status, name, email, save);
return form;
:::

:::script label="Undo over a list" expected="a list of three files with a Delete button each; Delete removes the file and a dark alert says 'report.pdf removed' with Undo for five seconds; Undo brings it back; if the time runs out the line below says it was deleted for good"
let files = ['report.pdf', 'budget.xlsx', 'photo.png'];
const list = document.createElement('ul');
list.style.cssText = 'display:grid;gap:6px;margin:0;padding:0;list-style:none';
const log = document.createElement('p');
log.style.cssText = 'margin:0;font-size:.85rem;opacity:.75';
const notice = await slice.build('Alert', { open: false, size: 'sm' });

const paint = async () => {
  slice.controller.destroyByContainer(list);
  list.replaceChildren();
  for (const file of files) {
    const li = document.createElement('li');
    li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:8px;background:color-mix(in srgb,var(--primary-color) 6%,transparent)';
    li.textContent = file;
    li.append(await slice.build('Button', { value: 'Delete', variant: 'ghost', size: 'sm', onClick: () => remove(file) }));
    list.append(li);
  }
};
const remove = (file) => {
  const before = files;
  files = files.filter((f) => f !== file);
  paint();
  notice.show({
    tone: 'neutral', variant: 'filled', message: `${file} removed`, timeout: 5000, dismissible: true,
    actions: [{ label: 'Undo', onClick: () => { files = before; paint(); } }],
    onDismiss: ({ reason }) => { if (reason !== 'action') log.textContent = `${file} was deleted for good.`; }
  });
};
await paint();
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:10px;width:100%;max-width:420px';
box.append(notice, list, log);
return box;
:::

:::script label="Account notices" expected="three alerts stacked: an outlined warning 'Your trial ends in 3 days' with an Upgrade button, an info alert about scheduled maintenance that can be closed, and a filled danger alert 'Payment failed' with Update card and Contact support buttons"
const toasts = await slice.build('ToastProvider', { singleton: true });
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:10px;width:100%;max-width:640px';
box.append(
  await slice.build('Alert', {
    tone: 'warning', variant: 'outlined', title: 'Your trial ends in 3 days',
    message: 'Upgrade to keep your projects and your team.',
    actions: [{ label: 'Upgrade', variant: 'filled', keepOpen: true, onClick: () => toasts.show('Opening plans…') }]
  }),
  await slice.build('Alert', {
    tone: 'info', dismissible: true,
    message: 'Maintenance on Sunday from 02:00 to 03:00 (UTC-4). The app will be read-only.'
  }),
  await slice.build('Alert', {
    tone: 'danger', variant: 'filled', title: 'Payment failed',
    message: 'We could not charge the card ending in 4242.',
    actions: [
      { label: 'Update card', keepOpen: true, onClick: () => toasts.show('Card form') },
      { label: 'Contact support', keepOpen: true, onClick: () => toasts.show('Support chat') }
    ]
  })
);
return box;
:::

:::script label="Tones and variants" expected="a grid of five tones in soft, filled and outlined, each with a title and a message"
const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;width:100%';
for (const variant of ['soft', 'filled', 'outlined']) {
  for (const tone of ['neutral', 'info', 'success', 'warning', 'danger']) {
    grid.append(await slice.build('Alert', { tone, variant, size: 'sm', title: `${tone} · ${variant}`, message: 'A short message.' }));
  }
}
return grid;
:::

## Best Practices
:::tip
Say what happened and what to do next, in that order: "The report could not be loaded · Try again". An alert with no way out leaves people stuck.
:::

:::tip
Keep `filled` for what must be seen now (a failed payment, an undo). A page with several filled alerts has no priority left.
:::

## Pitfalls
:::warning
Do not put a `timeout` on an error. A problem that disappears before it was read is a problem nobody fixes.
:::

:::warning
Colour is not the message. Keep the words clear enough that the alert makes sense in grey.
:::