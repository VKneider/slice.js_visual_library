---
title: ConfirmActionModal
route: /docs/display/confirm-action-modal
navLabel: ConfirmActionModal
section: Display
group: Feedback
order: 32
description: Promise-based "are you sure?" modal and single-value prompt, built on Modal, with an event-manager channel.
component: ConfirmActionModalDocumentation
generate: true
tags: [modal, confirm, alert, prompt, danger, confirmation, dialog, events]
---

# ConfirmActionModal

## Overview

The "are you sure?" modal, and the single-value prompt. Built on
[`Modal`](/docs/display/modal), so scroll-lock, focus, `Escape` and backdrop
dismissal are already handled — this only owns the copy, the header mark, the
two buttons and the answer.

Build it **once**, near your composition root, and recover it anywhere else:

```javascript title="Build it once"
const confirm = slice.getComponent('ConfirmActionModal');
```

:::warning
Build exactly one. Unlike a `Service`, a Visual component is **not** a
singleton: a second instance would also subscribe to `confirm:request`, so
every question would open two dialogs.
:::

:::warning
It must be **in the document**. The Modal is built inside the component, and
`showModal()` on a detached `<dialog>` is a silent no-op: nothing appears,
the promise still settles, and it looks like the button is dead. Append it
somewhere real — `document.body` is the usual choice — and the component logs
a warning if you forget.
:::

## The two ways in

### 1. A promise — when the answer decides what happens next

```javascript
if (!await confirm.ask({ title: 'Delete project?', danger: true })) return;
await deleteProject();
```

This is the better default and the one to reach for first. The alternative — a
bare event plus callbacks — makes every call site juggle two async channels and
a "did this already fire?" flag, and a caller that returns early leaves the
event unfired. With a promise the control flow is linear and cannot get wrong.

### 2. The event manager — when the emitter cannot hold a reference

Some call sites genuinely cannot reach the component: a deep save routine, a
store subscriber, a keyboard shortcut, a third-party callback. Emitting is then
the sane move, and `confirm:request` is subscribed for you:

```javascript title="No reference needed"
slice.events.emit('confirm:request', {
   title: 'Discard unsaved draft?',
   message: 'Three responses have not been sent.',
   danger: true,
});
```

Nobody is waiting on the answer, so this is fire-and-forget: it opens, the user
answers, the modal closes.

Add `onConfirm` / `onCancel` if the emitter does need the verdict:

```javascript
slice.events.emit('confirm:request', {
   title: 'Publish?',
   onConfirm: () => publish(),
   onCancel: () => console.log('left it'),
});
```

An `inputLabel` in the payload makes it a **prompt**, and `onConfirm` receives
the typed value:

```javascript
slice.events.emit('confirm:request', {
   title: 'Your name',
   inputLabel: 'Name',
   inputValue: 'Ana',
   onConfirm: (name) => save({ name }),
});
```

If two independently-built modals would collide, give one of them a different
channel:

```javascript
const admin = await slice.build('ConfirmActionModal', {
   sliceId: 'admin-confirm',
   eventName: 'admin:confirm:request',
});
```

## API

- `ask(options) -> Promise<boolean>` — `true` confirmed, `false` cancelled or dismissed.
- `prompt(options) -> Promise<string|null>` — the value, or `null` if cancelled.
- `isOpen` (boolean) — whether a question is currently on screen.

Options for both (all optional):

| Option | Default | Notes |
| --- | --- | --- |
| `title` | `''` | |
| `message` | `''` | hidden when empty |
| `icon` | by `danger` | any Icon name; `false` hides the mark |
| `confirmLabel` | `'Confirm'` | |
| `cancelLabel` | `'Cancel'` | |
| `danger` | `false` | confirm button becomes the `danger` variant |
| `confirmVariant` | `'filled'` | used when `danger` is false |
| `inputLabel` / `inputPlaceholder` / `inputValue` | `''` | `prompt()` only |
| `inputType` | `'text'` | `'email'` adds native validation |
| `required` | `false` | `prompt()` only; blocks confirm while empty |

Props set once on the component and overridden per call: `confirmLabel`,
`cancelLabel`, `confirmVariant`, `eventName`.

## The header mark

The icon in the header follows `danger` so a destructive question never looks
like a routine one: `exclamation-circle` for danger, `question-circle`
otherwise. Override it with any Icon name, or pass `icon: false` to show no
mark at all.

## The one invariant

**Every `ask()`/`prompt()` resolves exactly once.** A dialog that could be
dismissed without settling would leave the awaiting caller hanging for the life
of the page, so `Escape`, the backdrop, the X button, a second question arriving
while one is open, and destroying the component all resolve — as cancellations.
There is a spec for each of those.

## Prop Scenarios

:::script label="Yes / no" expected="the flow stops at the dialog until you answer; try Escape and the backdrop too"
const confirm = await slice.build('ConfirmActionModal', { sliceId: 'demo-confirm' });

// It has to be IN the document. The Modal is built inside this element, and
// showModal() on a detached <dialog> is a silent no-op - nothing appears and
// the promise still settles, so the failure looks like "the button is dead".
document.body.appendChild(confirm);

const log = document.createElement('p');
log.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';
log.textContent = 'Nothing decided yet.';

const ask = async () => {
   const ok = await confirm.ask({
      title: 'Delete “Quarterly report”?',
      message: 'It moves to trash, where it stays for 30 days.',
      confirmLabel: 'Delete',
      danger: true,
   });
   log.textContent = ok ? 'Deleted.' : 'Kept.';
};

const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';

row.appendChild(await slice.build('Button', { value: 'Delete the report', variant: 'danger', onClick: ask }));
row.appendChild(await slice.build('Button', {
   value: 'Rename instead',
   variant: 'outlined',
   onClick: async () => {
      const name = await confirm.prompt({
         title: 'Rename report',
         inputLabel: 'New name',
         inputValue: 'Quarterly report',
         required: true,
      });
      log.textContent = name === null ? 'Renaming cancelled.' : `Renamed to “${name}”.`;
   },
}));

const wrap = document.createElement('div');
wrap.appendChild(log);
wrap.appendChild(row);
mount(wrap);
:::

:::script label="Through the event manager" expected="the buttons never touch the component — they just emit on the channel"
// A different channel, because the demo above already built a modal on the
// default one and EVERY instance subscribes. Two on one page, one channel,
// means one question opens two dialogs — which is exactly the footgun this
// component has.
const confirm = await slice.build('ConfirmActionModal', {
   sliceId: 'demo-confirm-evt',
   eventName: 'demo:confirm:request',
});
document.body.appendChild(confirm);

const log = document.createElement('p');
log.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';
log.textContent = 'Nothing emitted yet.';

// A stand-in for a call site with no reference to the component: a save
// routine, a store subscriber, a keyboard shortcut.
const emitFromAnywhere = (payload) => {
   log.textContent = 'Asked. Answer in the dialog…';
   slice.events.emit('demo:confirm:request', payload);
};

const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';

row.appendChild(await slice.build('Button', {
   value: 'Emit a question',
   variant: 'danger',
   onClick: () => emitFromAnywhere({
      title: 'Discard 3 unsent responses?',
      message: 'They will not be recoverable.',
      danger: true,
      onConfirm: () => { log.textContent = 'Emitter heard: yes.'; },
      onCancel: () => { log.textContent = 'Emitter heard: no.'; },
   }),
}));

row.appendChild(await slice.build('Button', {
   value: 'Emit a prompt',
   variant: 'outlined',
   onClick: () => emitFromAnywhere({
      title: 'Your name',
      inputLabel: 'Name',
      inputValue: 'Ana',
      onConfirm: (name) => { log.textContent = `Emitter heard: “${name}”.`; },
   }),
}));

const wrap = document.createElement('div');
wrap.appendChild(log);
wrap.appendChild(row);
mount(wrap);
:::

## Best Practices

:::tip
Put the consequence in `message`, not in the title. The title says what is being asked; the
message says what happens if the answer is yes. "This cannot be undone" is worth more than
"Confirm".
:::

:::tip
Use `danger: true` for anything irreversible. It swaps the confirm button, the header mark and
the badge behind it in one property.
:::

:::tip
Prefer the promise over the event. Reach for the event when the emitter genuinely has no
reference to the component, not because callbacks read nicely at the call site.
:::

## Pitfalls

:::warning
`required` blocks the confirm button and paints an error, but it does not disable it. That is
deliberate: a permanently greyed-out button tells the user nothing about why. If the empty case
should not even be reachable, validate before opening the modal.
:::

:::warning
Do not pass `singleton: true`. That flag is only for components registered as `"Service"`, and
`slice.build` returns **`null`** for a Visual component built with it — so `confirm.ask` is then
"not a function". Build the modal once and share it with `slice.getComponent`.
:::

:::warning
A prompt's field is focused when it opens, so `Enter` confirms. If the answer is not something a
user should be able to submit with a single keystroke, do not put a prompt on that action.
:::

:::warning
`ask()` cannot prevent the modal from being dismissed — `Escape` and the backdrop always count as
"no". If the answer must be explicit, do not make it cancellable: leave `dismissable` on and accept
that a stray Escape reads as a refusal.
:::

:::warning
Every instance subscribes to `confirm:request`. Two instances means two dialogs for one question,
so build exactly one, or give the second a different `eventName`.
:::