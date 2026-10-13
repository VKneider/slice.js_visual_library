---
title: UnsavedChangesGuard
route: /docs/services/unsaved-changes-guard
navLabel: UnsavedChangesGuard
section: Services
group: Security
order: 13
description: Warns before the user throws away work in progress — tab close, in-app navigation, or the back button.
component: UnsavedChangesGuardDocumentation
generate: true
tags: [service, unsaved, guard, navigation, beforeunload, confirm, dirty]
---

# UnsavedChangesGuard

## Overview

The "you have unsaved changes" guard. Any component can declare pending work with a stable key, and
the guard covers the three ways a user can walk away from it.

```javascript title="Build it once"
const guard = slice.getComponent('UnsavedChangesGuard');
```

```javascript title="Arm while editing, disarm when saved"
guard.arm('project-form');          // the user starts typing
// ... on save success:
guard.disarm('project-form');
```

## API

- `arm(key = 'default', { message })` — declare pending work.
- `disarm(key = 'default')` — the work is saved or deliberately abandoned.
- `isArmed` / `pendingCount` — what is currently holding the guard.
- `confirmLeave(message?) -> Promise<boolean>` — ask by hand, for anything the built-in exits miss.
- `guardFn(to, from, next)` — the router guard body, if you want to compose it yourself.
- `setDialog(fn)` — replace the browser `confirm` with your own dialog.
- `destroy()` — release everything and detach the listeners.

Arms are **reference-counted by key**: `arm('editor')` twice is still one holder, and two different
keys need two `disarm` calls. A component that re-arms on every render therefore cannot lock the
user out of the page.

## The three exits, and why they are not equally reliable

| Exit | Mechanism | Reliability |
| --- | --- | --- |
| Tab close, reload, leaving the site | `beforeunload` | **Solid.** The browser's own dialog. |
| In-app navigation (`navigate()`, `<slice-link>`) | Router `beforeEach` | **Solid.** |
| Back / forward buttons | `popstate`, intercepted | **Best effort.** See below. |

### The back button is best effort, and cannot be otherwise

The router does **not** run `beforeEach` on `popstate` — `Router.onRouteChange()` goes straight to
rendering. By the time the event reaches you, the URL has already changed.

So this service asks anyway, and if the answer is no it calls `history.go(1)` to put the history
back. Two consequences are worth knowing:

- The route you navigated away from can paint for a frame before being restored.
- Only a **single step** back is reliably recoverable. Pressing Back three times in a row can
  outrun the recovery.

The browser's native `confirm` is used on this path and **your `setDialog` dialog is not**, because
a `popstate` handler has to answer synchronously or the browser moves on without it.

### The browser owns the wording on `beforeunload`

Every current browser ignores any message you set and shows its own text. That is deliberate: a page
that could name the consequence could also use it to trick people into staying. Expect "Changes you
made may not be saved."

Browsers also only honour the prompt after the user has interacted with the page at least once.

## Prop Scenarios

:::script label="Try to leave with pending work" expected="arm the guard, then use the back button, a link, or reload — each one asks"
const guard = await slice.build('UnsavedChangesGuard', { singleton: true });
guard.setDialog((message, done) => {
   done(window.confirm(message));
});

const log = document.createElement('p');
log.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';

const draft = document.createElement('textarea');
draft.placeholder = 'Type something, then try to leave the page…';
draft.style.cssText = 'width:100%;min-height:80px;padding:8px;font-family:system-ui,sans-serif;font-size:.85rem;border:1px solid var(--medium-color);border-radius:6px;box-sizing:border-box;';

const setLog = () => {
   const pending = draft.value.trim().length > 0;
   log.textContent = pending
      ? 'Armed — the browser will warn you before you leave.'
      : 'Not armed — nothing to lose.';
};

draft.addEventListener('input', () => {
   // A form component would do this around its own state.
   if (draft.value.trim()) guard.arm('demo', { message: 'Your draft has not been saved.' });
   else guard.disarm('demo');
   setLog();
});

const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;';

row.appendChild(await slice.build('Button', {
   value: 'Save (disarms)',
   onClick: () => { draft.value = ''; guard.disarm('demo'); setLog(); draft.blur(); },
}));
row.appendChild(await slice.build('Button', {
   value: 'Go to the Button docs',
   variant: 'outlined',
   onClick: () => slice.router.navigate('/docs/input/button'),
}));

const wrap = document.createElement('div');
wrap.appendChild(log);
wrap.appendChild(row);
wrap.appendChild(draft);

setLog();
mount(wrap);
:::

## Composing with your own router guard

The router keeps guards in a **single slot** (`router._beforeEachGuard`), so registering a second one
replaces the first. This service composes with whatever was already there at the moment it was built —
but an app that registers a guard *afterwards* replaces this one. If that is you, compose explicitly:

```javascript title="Your guard, with the unsaved-changes check"
slice.router.beforeEach(async (to, from, next) => {
   if (to.meta?.public) return next();

   // Ours first: if the user declines, your guard must not run either, because
   // it may redirect somewhere they did not agree to go.
   if (!(await guard.confirmLeave())) return next();

   return next();
});
```

:::warning
In Slice.js 4.x, **`next(false)` does not cancel the navigation.** `Router._executeBeforeEachGuard`
ends with `return redirectPath ? { path: redirectPath, … } : null`, and `false` is falsy, so the
cancellation branch is unreachable — the router proceeds with a warning-free "success". If you need to
cancel a navigation, throw from the guard instead: the router's `catch` returns `{ path: false }`,
which does cancel. `next('/some/path')` redirects correctly and is unaffected.

## Best Practices

:::tip
Disarm on **save success**, not on save click. Disarming optimistically loses the user's work if the
save fails.
:::

:::tip
Use a different key per form. Two forms on one page then warn independently, instead of one saving
silently switching the other's guard off.
:::

## Pitfalls

:::warning
Arming is not the same as validating. The guard warns about leaving; it does not check that what the
user typed is worth keeping.

:::warning
Do not arm for trivial state — a collapsed panel, a ticked checkbox, a search filter. A guard that
fires on things nobody would mourn is a guard the user learns to dismiss without reading, which
costs you the warning you wanted for the one case that mattered.

:::warning
`beforeunload` cannot be styled or worded. If the confirmation must be your own design, you cannot
cover page close with it — only in-app navigation, through `confirmLeave()` or `setDialog()`.
:::
