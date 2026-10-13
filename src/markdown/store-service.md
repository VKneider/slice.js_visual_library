---
title: StoreService
route: /docs/services/store-service
navLabel: StoreService
section: Services
group: State
order: 63
description: A thin facade over slice.context, so context persistence is configured in one place.
component: StoreServiceDocumentation
generate: true
tags: [store, context, state, persistence, service]
---

# StoreService

## Overview

A small facade over `slice.context`. It exists so context **persistence is configured in one place**
instead of every state-owning service repeating `create(name, initial, { persist: true, ... })`.

Build it first in your composition root, then recover it anywhere with
`slice.getComponent('StoreService')`.

## API

- `ensure(name, initialState, storageKey)` — create the context only if it does not exist. Idempotent.
- `has(name)` / `get(name)`
- `set(name, updater)` — `updater` is `(prev) => next`, the same contract as `slice.context.setState`.
- `watch(name, component, callback, selector)` — subscribe a component to a slice of state.

Watchers registered **with a component** are cleaned up automatically when it is destroyed — do not
unwatch by hand. `selector` narrows the callback, so the watcher only fires when the relevant part
changes rather than on every write.

## Prop Scenarios

:::script label="Create, read, write" expected="a counter that survives a reload"
const store = await slice.build('StoreService', { singleton: true });

// Only the FIRST call creates; calling again is a no-op, so a service can
// `ensure` its own context from init() without knowing who ran first.
store.ensure('demo-counter', { count: 0 });

const wrap = document.createElement('div');
wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;align-items:flex-start;font-family:system-ui,sans-serif;';

const readout = document.createElement('p');
readout.style.cssText = 'font-size:1.1rem;font-weight:700;margin:0;';
const paint = () => { readout.textContent = `count: ${store.get('demo-counter').count}`; };

const inc = await slice.build('Button', {
  value: '+1',
  onClick: () => { store.set('demo-counter', (prev) => ({ ...prev, count: prev.count + 1 })); paint(); },
});

const reset = await slice.build('Button', {
  value: 'Reset',
  size: 'sm',
  variant: 'outlined',
  onClick: () => { store.set('demo-counter', { count: 0 }); paint(); },
});

paint();
wrap.appendChild(readout);
wrap.appendChild(inc);
wrap.appendChild(reset);

const note = document.createElement('p');
note.textContent = 'Persisted: reload the page and the count survives.';
note.style.cssText = 'font-size:.75rem;color:var(--font-secondary-color);margin:0;';
wrap.appendChild(note);

mount(wrap);
:::

## Best Practices

:::tip
One context per domain concept, not per screen: a `settings` context everyone reads beats three
copies of the same preferences that can drift apart.
:::

## Pitfalls

:::warning
`ensure` is create-if-absent, **not** a migration helper. Adding a key to a context's `initialState`
after release does not backfill it for a returning user — their stored copy is already there. Shape
migrations belong in the service that owns that state, in its own `init()`.
:::