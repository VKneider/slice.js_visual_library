---
title: ToastProvider
route: /docs/services/toast-provider
navLabel: ToastProvider
section: Services
group: Feedback
order: 50
description: Singleton service for programmatic toast management — show, dismiss, clear, and position notifications.
component: ToastProviderDocumentation
generate: true
tags: [toast, provider, service, notification]
---

# ToastProvider

ToastProvider is a singleton **Service** that manages a stack of notifications.  
Unlike manually placing `<slice-toast>` elements, it handles the container, queue limits, positioning, and cleanup for you.

> See the [Toast](/docs/visual/toast) component for the visual building block.

## Getting the instance

`ToastProvider` is registered as a `"Service"` type component. Build it to access the singleton:

```js
const provider = await slice.build('ToastProvider');
```

You can also access it directly via `ToastProvider.getInstance()` when the class is available.

## Basic usage

:::script
const provider = await slice.build('ToastProvider');
const btn = await slice.build('Button', {
  value: 'Show toast',
  onClick: () => provider.show('Hello from ToastProvider!', { type: 'success' })
});
mount(btn);
:::

## Toast types

Buttons for each type: success, error, warning, info, and default (no icon).

:::script
const provider = await slice.build('ToastProvider');
const container = document.createElement('div');
container.style.display = 'flex';
container.style.flexWrap = 'wrap';
container.style.gap = '0.5rem';

const types = [
  { value: 'Success', type: 'success', message: 'Operation completed successfully' },
  { value: 'Error', type: 'error', message: 'Something went wrong' },
  { value: 'Warning', type: 'warning', message: 'Check your input' },
  { value: 'Info', type: 'info', message: 'New version available' },
  { value: 'Default', type: 'default', message: 'Plain notification' }
];

for (const t of types) {
  const btn = await slice.build('Button', {
    value: t.value, onClick: () => provider.show(t.message, { type: t.type })
  });
  container.appendChild(btn);
}
mount(container);
:::

## Configuration

| Config        | Type              | Default     | Description                     |
|---------------|-------------------|-------------|---------------------------------|
| `type`        | `string`          | `'default'` | `success`, `error`, `warning`, `info`, `default` |
| `duration`    | `number`          | `4000`      | Auto-dismiss in ms. `0` = sticky |
| `dismissable` | `boolean`         | `true`      | Show close button               |
| `customColor` | `object \| null`  | `null`      | `{ background, text, accent }`  |

### Duration

Sticky toasts (`duration: 0`) stay until manually closed. Short durations auto-dismiss quickly.

:::script
const provider = await slice.build('ToastProvider');
const container = document.createElement('div');
container.style.display = 'flex';
container.style.flexWrap = 'wrap';
container.style.gap = '0.5rem';

const stickyBtn = await slice.build('Button', {
  value: 'Sticky (stays open)', onClick: () => provider.show('Close me manually', { duration: 0 })
});
container.appendChild(stickyBtn);

const shortBtn = await slice.build('Button', {
  value: 'Short (1s)', onClick: () => provider.show('Quick toast!', { duration: 1000 })
});
container.appendChild(shortBtn);

mount(container);
:::

### Non-dismissable

Hide the close button for notifications that should auto-dismiss only.

:::script
const provider = await slice.build('ToastProvider');
const btn = await slice.build('Button', {
  value: 'Non-dismissable toast',
  onClick: () => provider.show('Auto-dismiss only — no close button', { dismissable: false, duration: 3000 })
});
mount(btn);
:::

### Custom color

Apply a custom background, text, and accent.

:::script
const provider = await slice.build('ToastProvider');
const btn = await slice.build('Button', {
  value: 'Custom styled toast',
  onClick: () => provider.show('Dark blue custom theme', {
    type: 'info', duration: 0,
    customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }
  })
});
mount(btn);
:::

## Manual dismiss

`show()` returns a unique id. Pass it to `dismiss(id)` to close a specific toast programmatically.

:::script
const provider = await slice.build('ToastProvider');
let lastId = null;
const showBtn = await slice.build('Button', {
  value: 'Show toast',
  onClick: async () => { lastId = await provider.show('Dismiss me with the button below', { duration: 0 }); }
});
const dismissBtn = await slice.build('Button', {
  value: 'Dismiss it',
  onClick: () => { if (lastId) provider.dismiss(lastId); }
});
const container = document.createElement('div');
container.style.display = 'flex';
container.style.gap = '0.5rem';
container.appendChild(showBtn);
container.appendChild(dismissBtn);
mount(container);
:::

## Clear all

Remove every visible toast at once.

:::script
const provider = await slice.build('ToastProvider');
const container = document.createElement('div');
container.style.display = 'flex';
container.style.flexWrap = 'wrap';
container.style.gap = '0.5rem';

const showManyBtn = await slice.build('Button', {
  value: 'Stack 3 toasts',
  onClick: async () => {
    await provider.show('Toast A', { type: 'info', duration: 0 });
    await provider.show('Toast B', { type: 'warning', duration: 0 });
    await provider.show('Toast C', { type: 'error', duration: 0 });
  }
});
container.appendChild(showManyBtn);

const clearBtn = await slice.build('Button', {
  value: 'Clear all',
  onClick: () => provider.clear()
});
container.appendChild(clearBtn);

mount(container);
:::

## Positioning

Change the position of the toast stack with `setPosition(position)`.

| Position          | Description             |
|-------------------|-------------------------|
| `top-right`       | Top-right corner (default) |
| `top-left`        | Top-left corner         |
| `bottom-right`    | Bottom-right corner     |
| `bottom-left`     | Bottom-left corner      |
| `top-center`      | Top center              |
| `bottom-center`   | Bottom center           |

:::script
const provider = await slice.build('ToastProvider');
const container = document.createElement('div');
container.style.display = 'flex';
container.style.flexWrap = 'wrap';
container.style.gap = '0.5rem';

const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'];
for (const pos of positions) {
  const btn = await slice.build('Button', {
    value: pos,
    onClick: () => { provider.setPosition(pos); provider.show('Position: ' + pos, { type: 'info', duration: 1500 }); }
  });
  container.appendChild(btn);
}
mount(container);
:::

## API

| Method                                    | Returns    | Description                              |
|-------------------------------------------|------------|------------------------------------------|
| `show(message, config?)`                  | `string`   | Shows a toast, returns its unique id     |
| `dismiss(id)`                             | `this`     | Dismisses the toast with the given id    |
| `clear()`                                 | `this`     | Dismisses all visible toasts             |
| `setPosition(position)`                   | `this`     | Changes the position                     |
| `destroy()`                               | `void`     | Clears all toasts and removes the container |

## Best practices

- Build the provider once with `slice.build('ToastProvider')` and reuse the instance — it's a singleton.
- Use `clear()` before changing routes or views to avoid stale notifications.
- Use `duration: 0` for toasts that require user action to dismiss.
- All six positions work with the stack layout — toasts never overlap.
