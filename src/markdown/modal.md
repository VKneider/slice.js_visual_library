---
title: Modal
route: /docs/feedback/modal
navLabel: Modal
section: Feedback
group: Overlay
order: 10
description: Modal dialog component built on native <dialog> with composition via slots, focus trap, and backdrop dismiss.
component: ModalDocumentation
generate: true
tags: [modal, dialog, overlay, feedback]
---

# Modal

## Overview
The `Modal` component wraps the native `<dialog>` element to provide a focused overlay for confirmations, forms, alerts, and custom content. It uses `showModal()` for built-in focus trapping, Escape key handling, and backdrop styling.

## Core Behavior
- Built on `<dialog>` — focus trap, Escape dismiss, and `::backdrop` are handled natively.
- `open` prop controls visibility. Set `true` to call `showModal()`.
- `title` renders into a dedicated header slot.
- `dismissable` controls the close button and backdrop click to dismiss.
- `customColor` overrides the background, text, and accent colors.
- The close button has `aria-label="Cerrar"`; the dialog has `role="dialog"` and `aria-modal="true"` (native).
- Use `$body` and `$footer` to compose custom content after mounting.

## Props

| Prop           | Type              | Default     | Description                             |
|----------------|-------------------|-------------|-----------------------------------------|
| `open`         | `boolean`         | `false`     | Show the modal via `showModal()`        |
| `title`        | `string`          | `''`        | Header text                             |
| `dismissable`  | `boolean`         | `true`      | Show close button + backdrop dismiss    |
| `width`        | `string`          | `''`        | CSS width override (e.g. `400px`)       |
| `maxWidth`     | `string`          | `''`        | CSS max-width override                  |
| `customColor`  | `object \| null`  | `null`      | `{ background, text, accent }`          |
| `onClose`      | `function`        | `null`      | Called when the modal is dismissed      |

## Prop Scenarios

:::script label="Open and close" expected="modal opens and closes via close button"
const btn = await slice.build('Button', {
  value: 'Open modal',
  onClick: async () => {
    const modal = await slice.build('Modal', { title: 'Hello', open: true });
    document.body.appendChild(modal);
  }
});
return btn;
:::

:::script label="Custom title and body" expected="modal with custom title and body content"
const btn = await slice.build('Button', {
  value: 'Open with custom content',
  onClick: async () => {
    const modal = await slice.build('Modal', { title: 'Confirm action', open: true });
    const p = document.createElement('p');
    p.textContent = 'Are you sure you want to proceed?';
    modal.$body.appendChild(p);
    document.body.appendChild(modal);
  }
});
return btn;
:::

:::script label="Custom color" expected="modal with dark blue background"
const btn = await slice.build('Button', {
  value: 'Styled modal',
  onClick: async () => {
    const modal = await slice.build('Modal', {
      title: 'Styled',
      open: true,
      customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }
    });
    document.body.appendChild(modal);
  }
});
return btn;
:::

:::script label="Confirm action" expected="modal with two action buttons"
const btn = await slice.build('Button', {
  value: 'Delete item',
  onClick: async () => {
    const modal = await slice.build('Modal', {
      title: 'Confirm delete',
      open: true
    });
    const p = document.createElement('p');
    p.textContent = 'Are you sure you want to delete this item? This action cannot be undone.';
    modal.$body.appendChild(p);
    const cancelBtn = await slice.build('Button', {
      value: 'Cancel',
      onClick: () => modal.close()
    });
    const confirmBtn = await slice.build('Button', {
      value: 'Delete',
      customColor: { background: '#dc2626', text: '#ffffff' },
      onClick: () => { modal.close('confirmed'); }
    });
    modal.$footer.appendChild(cancelBtn);
    modal.$footer.appendChild(confirmBtn);
    document.body.appendChild(modal);
  }
});
return btn;
:::

:::script label="Form demo" expected="modal with form inputs inside Grid component"
const btn = await slice.build('Button', {
  value: 'New User',
  onClick: async () => {
    const modal = await slice.build('Modal', {
      title: 'New User',
      open: true,
      width: '520px'
    });
    const grid = await slice.build('Grid', {
      columns: 2, gap: '0.75rem'
    });
    const firstName = await slice.build('Input', { placeholder: 'First name' });
    const lastName = await slice.build('Input', { placeholder: 'Last name' });
    const email = await slice.build('Input', { placeholder: 'Email', type: 'email' });
    const role = await slice.build('Input', { placeholder: 'Role' });
    const dept = await slice.build('Input', { placeholder: 'Department' });
    grid.items = [firstName, lastName, email, role, dept];
    email.style.gridColumn = '1 / -1';
    modal.$body.appendChild(grid);
    const cancelBtn = await slice.build('Button', {
      value: 'Cancel',
      onClick: () => modal.close()
    });
    const saveBtn = await slice.build('Button', {
      value: 'Save',
      customColor: { background: '#059669', text: '#ffffff' },
      onClick: () => modal.close('saved')
    });
    modal.$footer.appendChild(cancelBtn);
    modal.$footer.appendChild(saveBtn);
    document.body.appendChild(modal);
  }
});
return btn;
:::

:::script label="Non-dismissable" expected="modal without close button, backdrop click or Escape"
const btn = await slice.build('Button', {
  value: 'Non-dismissable',
  onClick: async () => {
    const modal = await slice.build('Modal', {
      title: 'Attention',
      open: true,
      dismissable: false
    });
    const p = document.createElement('p');
    p.textContent = 'This modal can only be closed programmatically.';
    modal.$body.appendChild(p);
    const closeBtn = await slice.build('Button', {
      value: 'Close me',
      onClick: () => modal.close()
    });
    modal.$footer.appendChild(closeBtn);
    document.body.appendChild(modal);
  }
});
return btn;
:::

## Best Practices
:::tip
Use modal for focused tasks that require user input or confirmation before continuing. Always provide a clear way to dismiss (close button, cancel action, or Escape key). For simple notifications, prefer `Toast` instead.
:::

## Pitfalls
:::warning
The modal creates a `<dialog>` in the top layer — ensure no other element interferes with `z-index` handling. Multiple open modals stack but the browser only allows one `<dialog>` in the top layer at a time; close one before opening another.
:::
