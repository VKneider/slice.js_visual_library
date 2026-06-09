---
title: Toast
route: /docs/feedback/toast
navLabel: Toast
section: Feedback
group: Notifications
order: 10
description: Toast notification component with type-based styling, auto-dismiss, and dismissable modes.
component: ToastDocumentation
generate: true
tags: [toast, notification, feedback, alert]
---

# Toast

## Overview
The `Toast` component displays brief, auto-dismissible messages at the edge of the viewport. Use it for confirmations, errors, warnings, or any transient feedback.

## Core Behavior
- `type` selects one of five variants (`success`, `error`, `warning`, `info`, `default`) each with a distinct icon and color scheme derived from theme tokens.
- `duration` controls auto-dismiss in milliseconds. Set `0` for sticky (manual close only).
- `dismissable` toggles the close button. Defaults to `true`.
- `customColor` overrides the background, text, and accent colors when you need an exact value.
- The close button has `aria-label="Close"`; the toast has `role="alert"` for screen reader announcements.

> For programmatic control (show / dismiss / queue management) use **[ToastProvider](/docs/services/toast-provider)**.

## Live Preview
:::component name="Toast"
{
  "message": "File saved successfully",
  "type": "success",
  "duration": 0
}
:::

## Types
Each type maps to a theme token and an icon.

| Type      | Description        | Icon |
|-----------|--------------------|------|
| `success` | Positive feedback  | ✓    |
| `error`   | Failure / problem  | ✕    |
| `warning` | Heads-up / caution | ⚠    |
| `info`    | General info       | ℹ    |
| `default` | Neutral (no icon)  | —    |

:::script label="Type variants" expected="five toasts with different type icons and colors"
const container = document.createElement('div');
container.style.display = 'flex';
container.style.flexDirection = 'column';
container.style.gap = '0.5rem';
const types = ['success', 'error', 'warning', 'info', 'default'];
const labels = ['File saved', 'Connection lost', 'Low disk space', 'Update available', 'No icon variant'];
for (let i = 0; i < types.length; i++) {
  container.appendChild(await slice.build('Toast', { message: labels[i], type: types[i], duration: 0 }));
}
return container;
:::

## Props

| Prop           | Type              | Default     | Description                             |
|----------------|-------------------|-------------|-----------------------------------------|
| `message`      | `string`          | `''`        | Notification text                       |
| `type`         | `string`          | `'default'` | `success`, `error`, `warning`, `info`, `default` |
| `duration`     | `number`          | `4000`      | Auto-dismiss in ms. `0` = sticky        |
| `dismissable`  | `boolean`         | `true`      | Show close button                       |
| `customColor`  | `object \| null`  | `null`      | `{ background, text, accent }`          |

## Prop Scenarios

:::script label="Sticky toast (duration 0)" expected="toast stays visible until closed"
return await slice.build('Toast', { message: 'This toast stays until you close it', type: 'warning', duration: 0 });
:::

:::script label="Custom color" expected="toast with dark blue background and light blue accent"
return await slice.build('Toast', {
  message: 'Custom-styled toast',
  type: 'info',
  duration: 0,
  customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }
});
:::

:::script label="Non-dismissable" expected="toast with no close button"
return await slice.build('Toast', { message: 'Auto-dismiss only', dismissable: false });
:::

## Best Practices
:::tip
Use `duration: 0` for toasts that require user action. Always provide a `type` to communicate severity. For many notifications in a view, use `ToastProvider` which handles queuing, positioning, and cleanup automatically.
:::

## Pitfalls
:::warning
Do not stack multiple `<slice-toast>` elements manually — use `ToastProvider` for programmatic management. Avoid toasts for critical or mandatory information; prefer inline messages or modals for content users must acknowledge.
:::
