---
title: ConfirmDialog
route: /docs/display/confirm-dialog
navLabel: ConfirmDialog
section: Display
group: Feedback
order: 32
description: Promise-based "are you sure?" dialog and single-value prompt, built on Modal.
component: ConfirmDialogDocumentation
generate: true
tags: [dialog, confirm, alert, prompt, modal, danger, confirmation]
---

# ConfirmDialog

## Overview

The "are you sure?" dialog, and the single-value prompt. Built on [`Modal`](/docs/display/modal), so
scroll-lock, focus, `Escape` and backdrop dismissal are already handled — this only owns the copy,
the two buttons and the promise.

```javascript title="Build it once, anywhere in your composition root"
const confirm = slice.getComponent('ConfirmDialog');
```

## Why a promise and not an event

The obvious alternative is a global `confirm:request` event plus callbacks. With that, every call
site has to juggle two async channels plus a "did this already fire?" flag, and a caller that
returns early leaves the event unfired.

With a promise the control flow is linear and cannot get wrong:

```javascript
if (!await confirm.ask({ title: 'Delete project?' })) return;
await deleteProject();
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
| `confirmLabel` | `'Confirm'` | |
| `cancelLabel` | `'Cancel'` | |
| `danger` | `false` | confirm button becomes the `danger` variant |
| `confirmVariant` | `'filled'` | used when `danger` is false |
| `inputLabel` / `inputPlaceholder` / `inputValue` | `''` | `prompt()` only |
| `inputType` | `'text'` | `'email'` adds native validation |
| `required` | `false` | `prompt()` only; blocks confirm while empty |

Defaults can be set once on the component (`confirmLabel`, `cancelLabel`, `confirmVariant` props)
and overridden per call.

## The one invariant

**Every `ask()`/`prompt()` resolves exactly once.** A dialog that could be dismissed without
settling would leave the awaiting caller hanging for the life of the page, so `Escape`, the
backdrop, the X button, a second question arriving while one is open, and destroying the component
all resolve — as cancellations. There is a spec for each of those.

## Prop Scenarios

:::script label="Yes / no" expected="the flow stops at the dialog until you answer; try Escape and the backdrop too"
const confirm = await slice.build('ConfirmDialog', { singleton: true });

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

## Best Practices

:::tip
Put the consequence in `message`, not in the title. The title says what is being asked; the
message says what happens if the answer is yes. "This cannot be undone" is worth more than
"Confirm".
:::

:::tip
Use `danger: true` for anything irreversible. It is the only thing that distinguishes "shall I
publish this?" from "shall I delete this?", and it is one property.
:::

## Pitfalls

:::warning
`required` blocks the confirm button and paints an error, but it does not disable it. That is
deliberate: a permanently greyed-out button tells the user nothing about why. If the empty case
should not even be reachable, validate before opening the dialog.

:::warning
A prompt's field is focused when it opens, so `Enter` confirms. If the answer is not something a
user should be able to submit with a single keystroke, do not put a prompt on that action.

:::warning
`ask()` cannot prevent the dialog from being dismissed — `Escape` and the backdrop always count as
"no". If the answer must be explicit, do not make it cancellable: leave `dismissable` on and accept
that a stray Escape reads as a refusal.
:::
