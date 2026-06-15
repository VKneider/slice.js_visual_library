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
- Use `appendBody(node)` and `appendFooter(node)` to compose custom content after mounting.

## Props

| Prop           | Type              | Default     | Description                             |
|----------------|-------------------|-------------|-----------------------------------------|
| `open`         | `boolean`         | `false`     | Show the modal via `showModal()`        |
| `title`        | `string`          | `''`        | Header text                             |
| `dismissable`  | `boolean`         | `true`      | Show close button + backdrop dismiss    |
| `width`        | `string`          | `''`        | CSS width override (e.g. `400px`)       |
| `maxWidth`     | `string`          | `''`        | CSS max-width override                  |
| `draggable`    | `boolean`         | `false`     | Move the modal by dragging its header   |
| `resizable`    | `boolean`         | `false`     | Resize the modal from its edges/corners |
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
modal.appendBody(p);
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
    modal.appendBody(p);
    const cancelBtn = await slice.build('Button', {
      value: 'Cancel',
      onClick: () => modal.close()
    });
    const confirmBtn = await slice.build('Button', {
      value: 'Delete',
      customColor: { background: '#dc2626', text: '#ffffff' },
      onClick: () => { modal.close('confirmed'); }
    });
    modal.appendFooter(cancelBtn);
    modal.appendFooter(confirmBtn);
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
    modal.appendBody(grid);
    const cancelBtn = await slice.build('Button', {
      value: 'Cancel',
      onClick: () => modal.close()
    });
    const saveBtn = await slice.build('Button', {
      value: 'Save',
      customColor: { background: '#059669', text: '#ffffff' },
      onClick: () => modal.close('saved')
    });
    modal.appendFooter(cancelBtn);
    modal.appendFooter(saveBtn);
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
    modal.appendBody(p);
    const closeBtn = await slice.build('Button', {
      value: 'Close me',
      onClick: () => modal.close()
    });
    modal.appendFooter(closeBtn);
    document.body.appendChild(modal);
  }
});
return btn;
:::

:::script label="Draggable + resizable" expected="modal can be moved by its header and resized from its edges/corners"
const btn = await slice.build('Button', {
  value: 'Draggable + resizable',
  onClick: async () => {
    const modal = await slice.build('Modal', {
      title: 'Move me / resize me',
      open: true,
      draggable: true,
      resizable: true
    });
    const p = document.createElement('p');
    p.textContent = 'Drag the header to move. Drag the edges or corners to resize.';
    modal.appendBody(p);
    document.body.appendChild(modal);
  }
});
return btn;
:::

## Practical Scenarios

:::script label="Draggable settings panel" expected="modal with settings toggles, draggable by its header"
const btn = await slice.build('Button', {
  value: 'Settings',
  onClick: async () => {
    const modal = await slice.build('Modal', {
      title: 'Preferences',
      open: true,
      draggable: true,
      width: '380px'
    });
    const notif = await slice.build('Switch', {
      label: 'Push notifications',
      checked: true,
      labelPlacement: 'left'
    });
    const dark = await slice.build('Switch', {
      label: 'Dark mode',
      checked: false,
      labelPlacement: 'left'
    });
    const email = await slice.build('Switch', {
      label: 'Weekly digest',
      checked: true,
      labelPlacement: 'left'
    });
    const grid = await slice.build('Grid', { columns: 1, gap: '0.5rem' });
    grid.items = [notif, dark, email];
    modal.appendBody(grid);
    document.body.appendChild(modal);
  }
});
return btn;
:::

:::script label="Resizable content editor" expected="modal with textarea, resizable from edges and corners"
const btn = await slice.build('Button', {
  value: 'Edit description',
  onClick: async () => {
    const modal = await slice.build('Modal', {
      title: 'Edit description',
      open: true,
      resizable: true,
      width: '480px'
    });
    const ta = await slice.build('Textarea', {
      value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      rows: 6,
      autoGrow: true
    });
    modal.appendBody(ta);
    const saveBtn = await slice.build('Button', {
      value: 'Save',
      customColor: { background: '#059669', text: '#ffffff' },
      onClick: () => modal.close()
    });
    modal.appendFooter(saveBtn);
    document.body.appendChild(modal);
  }
});
return btn;
:::

:::script label="Draggable modal with tabs" expected="modal with tabbed panels, draggable header"
const btn = await slice.build('Button', {
  value: 'Object properties',
  onClick: async () => {
    const modal = await slice.build('Modal', {
      title: 'Properties',
      open: true,
      draggable: true,
      width: '500px'
    });
    const general = document.createElement('div');
    general.style.padding = '0.5rem 0';
    general.textContent = 'Name: example.pdf\nSize: 2.4 MB\nType: PDF document';
    const security = document.createElement('div');
    security.style.padding = '0.5rem 0';
    security.textContent = 'Owner: you\nPassword protected: no\nSharing: restricted';
    const tabs = await slice.build('Tabs', {
      items: [
        { id: 'general', label: 'General', panel: general },
        { id: 'security', label: 'Security', panel: security }
      ],
      activeTab: 'general'
    });
    modal.appendBody(tabs);
    document.body.appendChild(modal);
  }
});
return btn;
:::

:::script label="Resizable log viewer" expected="modal with log content, resizable to show more lines"
const btn = await slice.build('Button', {
  value: 'View logs',
  onClick: async () => {
    const modal = await slice.build('Modal', {
      title: 'Deployment logs',
      open: true,
      resizable: true,
      width: '600px',
      maxWidth: '800px'
    });
    const pre = document.createElement('pre');
    pre.style.cssText = 'background:#f1f5f9;padding:1rem;border-radius:6px;font-size:13px;line-height:1.5;overflow:auto;margin:0;white-space:pre-wrap';
    pre.textContent = '[2024-01-15 10:30:01] INFO  Starting deployment v2.4.1\n[2024-01-15 10:30:02] INFO  Pulling image from registry...\n[2024-01-15 10:30:05] INFO  Image pulled successfully\n[2024-01-15 10:30:06] WARN  Disk usage at 78%\n[2024-01-15 10:30:08] INFO  Running database migrations...\n[2024-01-15 10:30:12] INFO  Migrations completed\n[2024-01-15 10:30:13] INFO  Starting health checks...\n[2024-01-15 10:30:15] INFO  All health checks passed\n[2024-01-15 10:30:16] INFO  Deployment complete';
    modal.appendBody(pre);
    const closeBtn = await slice.build('Button', {
      value: 'Close',
      onClick: () => modal.close()
    });
    modal.appendFooter(closeBtn);
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
