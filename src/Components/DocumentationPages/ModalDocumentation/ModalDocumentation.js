export default class ModalDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Open and close","expected":"modal opens and closes via close button","kind":"script","content":"const btn = await slice.build('Button', {\r\n  value: 'Open modal',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', { title: 'Hello', open: true });\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;"},{"label":"Custom title and body","expected":"modal with custom title and body content","kind":"script","content":"const btn = await slice.build('Button', {\r\n  value: 'Open with custom content',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', { title: 'Confirm action', open: true });\r\n    const p = document.createElement('p');\r\n    p.textContent = 'Are you sure you want to proceed?';\r\nmodal.appendBody(p);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;"},{"label":"Confirm action","expected":"modal with two action buttons","kind":"script","content":"const btn = await slice.build('Button', {\r\n  value: 'Delete item',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Confirm delete',\r\n      open: true\r\n    });\r\n    const p = document.createElement('p');\r\n    p.textContent = 'Are you sure you want to delete this item? This action cannot be undone.';\r\n    modal.appendBody(p);\r\n    const cancelBtn = await slice.build('Button', {\r\n      value: 'Cancel',\r\n      onClick: () => modal.close()\r\n    });\r\n    const confirmBtn = await slice.build('Button', {\r\n      value: 'Delete',\r\n      customColor: { background: '#dc2626', text: '#ffffff' },\r\n      onClick: () => { modal.close('confirmed'); }\r\n    });\r\n    modal.appendFooter(cancelBtn);\r\n    modal.appendFooter(confirmBtn);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;"},{"label":"Form demo","expected":"modal with form inputs inside Grid component","kind":"script","content":"const btn = await slice.build('Button', {\r\n  value: 'New User',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'New User',\r\n      open: true,\r\n      width: '520px'\r\n    });\r\n    const grid = await slice.build('Grid', {\r\n      columns: 2, gap: '0.75rem'\r\n    });\r\n    const firstName = await slice.build('Input', { placeholder: 'First name' });\r\n    const lastName = await slice.build('Input', { placeholder: 'Last name' });\r\n    const email = await slice.build('Input', { placeholder: 'Email', type: 'email' });\r\n    const role = await slice.build('Input', { placeholder: 'Role' });\r\n    const dept = await slice.build('Input', { placeholder: 'Department' });\r\n    grid.items = [firstName, lastName, email, role, dept];\r\n    email.style.gridColumn = '1 / -1';\r\n    modal.appendBody(grid);\r\n    const cancelBtn = await slice.build('Button', {\r\n      value: 'Cancel',\r\n      onClick: () => modal.close()\r\n    });\r\n    const saveBtn = await slice.build('Button', {\r\n      value: 'Save',\r\n      customColor: { background: '#059669', text: '#ffffff' },\r\n      onClick: () => modal.close('saved')\r\n    });\r\n    modal.appendFooter(cancelBtn);\r\n    modal.appendFooter(saveBtn);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;"},{"label":"Non-dismissable","expected":"modal without close button, backdrop click or Escape","kind":"script","content":"const btn = await slice.build('Button', {\r\n  value: 'Non-dismissable',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Attention',\r\n      open: true,\r\n      dismissable: false\r\n    });\r\n    const p = document.createElement('p');\r\n    p.textContent = 'This modal can only be closed programmatically.';\r\n    modal.appendBody(p);\r\n    const closeBtn = await slice.build('Button', {\r\n      value: 'Close me',\r\n      onClick: () => modal.close()\r\n    });\r\n    modal.appendFooter(closeBtn);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;"},{"label":"Draggable + resizable","expected":"modal can be moved by its header and resized from its edges/corners","kind":"script","content":"const btn = await slice.build('Button', {\r\n  value: 'Draggable + resizable',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Move me / resize me',\r\n      open: true,\r\n      draggable: true,\r\n      resizable: true\r\n    });\r\n    const p = document.createElement('p');\r\n    p.textContent = 'Drag the header to move. Drag the edges or corners to resize.';\r\n    modal.appendBody(p);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;"},{"label":"Draggable settings panel","expected":"modal with settings toggles, draggable by its header","kind":"script","content":"const btn = await slice.build('Button', {\r\n  value: 'Settings',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Preferences',\r\n      open: true,\r\n      draggable: true,\r\n      width: '380px'\r\n    });\r\n    const notif = await slice.build('Switch', {\r\n      label: 'Push notifications',\r\n      checked: true,\r\n      labelPlacement: 'left'\r\n    });\r\n    const dark = await slice.build('Switch', {\r\n      label: 'Dark mode',\r\n      checked: false,\r\n      labelPlacement: 'left'\r\n    });\r\n    const email = await slice.build('Switch', {\r\n      label: 'Weekly digest',\r\n      checked: true,\r\n      labelPlacement: 'left'\r\n    });\r\n    const grid = await slice.build('Grid', { columns: 1, gap: '0.5rem' });\r\n    grid.items = [notif, dark, email];\r\n    modal.appendBody(grid);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;"},{"label":"Resizable content editor","expected":"modal with textarea, resizable from edges and corners","kind":"script","content":"const btn = await slice.build('Button', {\r\n  value: 'Edit description',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Edit description',\r\n      open: true,\r\n      resizable: true,\r\n      width: '480px'\r\n    });\r\n    const ta = await slice.build('Textarea', {\r\n      value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',\r\n      rows: 6,\r\n      autoGrow: true\r\n    });\r\n    modal.appendBody(ta);\r\n    const saveBtn = await slice.build('Button', {\r\n      value: 'Save',\r\n      customColor: { background: '#059669', text: '#ffffff' },\r\n      onClick: () => modal.close()\r\n    });\r\n    modal.appendFooter(saveBtn);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;"},{"label":"Draggable modal with tabs","expected":"modal with tabbed panels, draggable header","kind":"script","content":"const btn = await slice.build('Button', {\r\n  value: 'Object properties',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Properties',\r\n      open: true,\r\n      draggable: true,\r\n      width: '500px'\r\n    });\r\n    const general = document.createElement('div');\r\n    general.style.padding = '0.5rem 0';\r\n    general.textContent = 'Name: example.pdf\\nSize: 2.4 MB\\nType: PDF document';\r\n    const security = document.createElement('div');\r\n    security.style.padding = '0.5rem 0';\r\n    security.textContent = 'Owner: you\\nPassword protected: no\\nSharing: restricted';\r\n    const tabs = await slice.build('Tabs', {\r\n      items: [\r\n        { id: 'general', label: 'General', panel: general },\r\n        { id: 'security', label: 'Security', panel: security }\r\n      ],\r\n      activeTab: 'general'\r\n    });\r\n    modal.appendBody(tabs);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;"},{"label":"Resizable log viewer","expected":"modal with log content, resizable to show more lines","kind":"script","content":"const btn = await slice.build('Button', {\r\n  value: 'View logs',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Deployment logs',\r\n      open: true,\r\n      resizable: true,\r\n      width: '600px',\r\n      maxWidth: '800px'\r\n    });\r\n    const pre = document.createElement('pre');\r\n    pre.style.cssText = 'background:#f1f5f9;padding:1rem;border-radius:6px;font-size:13px;line-height:1.5;overflow:auto;margin:0;white-space:pre-wrap';\r\n    pre.textContent = '[2024-01-15 10:30:01] INFO  Starting deployment v2.4.1\\n[2024-01-15 10:30:02] INFO  Pulling image from registry...\\n[2024-01-15 10:30:05] INFO  Image pulled successfully\\n[2024-01-15 10:30:06] WARN  Disk usage at 78%\\n[2024-01-15 10:30:08] INFO  Running database migrations...\\n[2024-01-15 10:30:12] INFO  Migrations completed\\n[2024-01-15 10:30:13] INFO  Starting health checks...\\n[2024-01-15 10:30:15] INFO  All health checks passed\\n[2024-01-15 10:30:16] INFO  Deployment complete';\r\n    modal.appendBody(pre);\r\n    const closeBtn = await slice.build('Button', {\r\n      value: 'Close',\r\n      onClick: () => modal.close()\r\n    });\r\n    modal.appendFooter(closeBtn);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;"}];
  }

  async init() {
    this.markdownPath = "modal.md";
    this.markdownContent = "---\r\ntitle: Modal\r\nroute: /docs/feedback/modal\r\nnavLabel: Modal\r\nsection: Feedback\r\ngroup: Overlay\r\norder: 10\r\ndescription: Modal dialog component built on native <dialog> with composition via slots, focus trap, and backdrop dismiss.\r\ncomponent: ModalDocumentation\r\ngenerate: true\r\ntags: [modal, dialog, overlay, feedback]\r\n---\r\n\r\n# Modal\r\n\r\n## Overview\r\nThe `Modal` component wraps the native `<dialog>` element to provide a focused overlay for confirmations, forms, alerts, and custom content. It uses `showModal()` for built-in focus trapping, Escape key handling, and backdrop styling.\r\n\r\n## Core Behavior\r\n- Built on `<dialog>` — focus trap, Escape dismiss, and `::backdrop` are handled natively.\r\n- `open` prop controls visibility. Set `true` to call `showModal()`.\r\n- `title` renders into a dedicated header slot.\r\n- `dismissable` controls the close button and backdrop click to dismiss.\r\n- `customColor` overrides the background, text, and accent colors.\r\n- The close button has `aria-label=\"Cerrar\"`; the dialog has `role=\"dialog\"` and `aria-modal=\"true\"` (native).\r\n- Use `appendBody(node)` and `appendFooter(node)` to compose custom content after mounting.\r\n\r\n## Props\r\n\r\n| Prop           | Type              | Default     | Description                             |\r\n|----------------|-------------------|-------------|-----------------------------------------|\r\n| `open`         | `boolean`         | `false`     | Show the modal via `showModal()`        |\r\n| `title`        | `string`          | `''`        | Header text                             |\r\n| `dismissable`  | `boolean`         | `true`      | Show close button + backdrop dismiss    |\r\n| `width`        | `string`          | `''`        | CSS width override (e.g. `400px`)       |\r\n| `maxWidth`     | `string`          | `''`        | CSS max-width override                  |\r\n| `draggable`    | `boolean`         | `false`     | Move the modal by dragging its header   |\r\n| `resizable`    | `boolean`         | `false`     | Resize the modal from its edges/corners |\r\n| `customColor`  | `object \\| null`  | `null`      | `{ background, text, accent }`          |\r\n| `onClose`      | `function`        | `null`      | Called when the modal is dismissed      |\r\n\r\n## Scrolling\r\n\r\nThe dialog is capped at `min(85vh, 640px)` and clips its own overflow, so `.slice-modal__body`\r\nalways scrolls and the header and footer stay put. The body also sets `overscroll-behavior: contain`,\r\nso a scroll that reaches its end does not chain into the page behind the dialog on touch.\r\n\r\nOverride the cap from CSS when you need a taller dialog:\r\n\r\n```css\r\nslice-modal { --modal-max-height: min(90vh, 900px); }\r\n```\r\n\r\n:::warning\r\n`resizable: true` clears `max-width` **and** `max-height` on the dialog while it is open, so\r\nresizing past the cap works. The cap is restored on the next open.\r\n:::\r\n\r\n## Prop Scenarios\r\n\r\n:::script label=\"Open and close\" expected=\"modal opens and closes via close button\"\r\nconst btn = await slice.build('Button', {\r\n  value: 'Open modal',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', { title: 'Hello', open: true });\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;\r\n:::\r\n\r\n:::script label=\"Custom title and body\" expected=\"modal with custom title and body content\"\r\nconst btn = await slice.build('Button', {\r\n  value: 'Open with custom content',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', { title: 'Confirm action', open: true });\r\n    const p = document.createElement('p');\r\n    p.textContent = 'Are you sure you want to proceed?';\r\nmodal.appendBody(p);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;\r\n:::\r\n\r\n:::script label=\"Confirm action\" expected=\"modal with two action buttons\"\r\nconst btn = await slice.build('Button', {\r\n  value: 'Delete item',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Confirm delete',\r\n      open: true\r\n    });\r\n    const p = document.createElement('p');\r\n    p.textContent = 'Are you sure you want to delete this item? This action cannot be undone.';\r\n    modal.appendBody(p);\r\n    const cancelBtn = await slice.build('Button', {\r\n      value: 'Cancel',\r\n      onClick: () => modal.close()\r\n    });\r\n    const confirmBtn = await slice.build('Button', {\r\n      value: 'Delete',\r\n      customColor: { background: '#dc2626', text: '#ffffff' },\r\n      onClick: () => { modal.close('confirmed'); }\r\n    });\r\n    modal.appendFooter(cancelBtn);\r\n    modal.appendFooter(confirmBtn);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;\r\n:::\r\n\r\n:::script label=\"Form demo\" expected=\"modal with form inputs inside Grid component\"\r\nconst btn = await slice.build('Button', {\r\n  value: 'New User',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'New User',\r\n      open: true,\r\n      width: '520px'\r\n    });\r\n    const grid = await slice.build('Grid', {\r\n      columns: 2, gap: '0.75rem'\r\n    });\r\n    const firstName = await slice.build('Input', { placeholder: 'First name' });\r\n    const lastName = await slice.build('Input', { placeholder: 'Last name' });\r\n    const email = await slice.build('Input', { placeholder: 'Email', type: 'email' });\r\n    const role = await slice.build('Input', { placeholder: 'Role' });\r\n    const dept = await slice.build('Input', { placeholder: 'Department' });\r\n    grid.items = [firstName, lastName, email, role, dept];\r\n    email.style.gridColumn = '1 / -1';\r\n    modal.appendBody(grid);\r\n    const cancelBtn = await slice.build('Button', {\r\n      value: 'Cancel',\r\n      onClick: () => modal.close()\r\n    });\r\n    const saveBtn = await slice.build('Button', {\r\n      value: 'Save',\r\n      customColor: { background: '#059669', text: '#ffffff' },\r\n      onClick: () => modal.close('saved')\r\n    });\r\n    modal.appendFooter(cancelBtn);\r\n    modal.appendFooter(saveBtn);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;\r\n:::\r\n\r\n:::script label=\"Non-dismissable\" expected=\"modal without close button, backdrop click or Escape\"\r\nconst btn = await slice.build('Button', {\r\n  value: 'Non-dismissable',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Attention',\r\n      open: true,\r\n      dismissable: false\r\n    });\r\n    const p = document.createElement('p');\r\n    p.textContent = 'This modal can only be closed programmatically.';\r\n    modal.appendBody(p);\r\n    const closeBtn = await slice.build('Button', {\r\n      value: 'Close me',\r\n      onClick: () => modal.close()\r\n    });\r\n    modal.appendFooter(closeBtn);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;\r\n:::\r\n\r\n:::script label=\"Draggable + resizable\" expected=\"modal can be moved by its header and resized from its edges/corners\"\r\nconst btn = await slice.build('Button', {\r\n  value: 'Draggable + resizable',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Move me / resize me',\r\n      open: true,\r\n      draggable: true,\r\n      resizable: true\r\n    });\r\n    const p = document.createElement('p');\r\n    p.textContent = 'Drag the header to move. Drag the edges or corners to resize.';\r\n    modal.appendBody(p);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;\r\n:::\r\n\r\n## Practical Scenarios\r\n\r\n:::script label=\"Draggable settings panel\" expected=\"modal with settings toggles, draggable by its header\"\r\nconst btn = await slice.build('Button', {\r\n  value: 'Settings',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Preferences',\r\n      open: true,\r\n      draggable: true,\r\n      width: '380px'\r\n    });\r\n    const notif = await slice.build('Switch', {\r\n      label: 'Push notifications',\r\n      checked: true,\r\n      labelPlacement: 'left'\r\n    });\r\n    const dark = await slice.build('Switch', {\r\n      label: 'Dark mode',\r\n      checked: false,\r\n      labelPlacement: 'left'\r\n    });\r\n    const email = await slice.build('Switch', {\r\n      label: 'Weekly digest',\r\n      checked: true,\r\n      labelPlacement: 'left'\r\n    });\r\n    const grid = await slice.build('Grid', { columns: 1, gap: '0.5rem' });\r\n    grid.items = [notif, dark, email];\r\n    modal.appendBody(grid);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;\r\n:::\r\n\r\n:::script label=\"Resizable content editor\" expected=\"modal with textarea, resizable from edges and corners\"\r\nconst btn = await slice.build('Button', {\r\n  value: 'Edit description',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Edit description',\r\n      open: true,\r\n      resizable: true,\r\n      width: '480px'\r\n    });\r\n    const ta = await slice.build('Textarea', {\r\n      value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',\r\n      rows: 6,\r\n      autoGrow: true\r\n    });\r\n    modal.appendBody(ta);\r\n    const saveBtn = await slice.build('Button', {\r\n      value: 'Save',\r\n      customColor: { background: '#059669', text: '#ffffff' },\r\n      onClick: () => modal.close()\r\n    });\r\n    modal.appendFooter(saveBtn);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;\r\n:::\r\n\r\n:::script label=\"Draggable modal with tabs\" expected=\"modal with tabbed panels, draggable header\"\r\nconst btn = await slice.build('Button', {\r\n  value: 'Object properties',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Properties',\r\n      open: true,\r\n      draggable: true,\r\n      width: '500px'\r\n    });\r\n    const general = document.createElement('div');\r\n    general.style.padding = '0.5rem 0';\r\n    general.textContent = 'Name: example.pdf\\nSize: 2.4 MB\\nType: PDF document';\r\n    const security = document.createElement('div');\r\n    security.style.padding = '0.5rem 0';\r\n    security.textContent = 'Owner: you\\nPassword protected: no\\nSharing: restricted';\r\n    const tabs = await slice.build('Tabs', {\r\n      items: [\r\n        { id: 'general', label: 'General', panel: general },\r\n        { id: 'security', label: 'Security', panel: security }\r\n      ],\r\n      activeTab: 'general'\r\n    });\r\n    modal.appendBody(tabs);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;\r\n:::\r\n\r\n:::script label=\"Resizable log viewer\" expected=\"modal with log content, resizable to show more lines\"\r\nconst btn = await slice.build('Button', {\r\n  value: 'View logs',\r\n  onClick: async () => {\r\n    const modal = await slice.build('Modal', {\r\n      title: 'Deployment logs',\r\n      open: true,\r\n      resizable: true,\r\n      width: '600px',\r\n      maxWidth: '800px'\r\n    });\r\n    const pre = document.createElement('pre');\r\n    pre.style.cssText = 'background:#f1f5f9;padding:1rem;border-radius:6px;font-size:13px;line-height:1.5;overflow:auto;margin:0;white-space:pre-wrap';\r\n    pre.textContent = '[2024-01-15 10:30:01] INFO  Starting deployment v2.4.1\\n[2024-01-15 10:30:02] INFO  Pulling image from registry...\\n[2024-01-15 10:30:05] INFO  Image pulled successfully\\n[2024-01-15 10:30:06] WARN  Disk usage at 78%\\n[2024-01-15 10:30:08] INFO  Running database migrations...\\n[2024-01-15 10:30:12] INFO  Migrations completed\\n[2024-01-15 10:30:13] INFO  Starting health checks...\\n[2024-01-15 10:30:15] INFO  All health checks passed\\n[2024-01-15 10:30:16] INFO  Deployment complete';\r\n    modal.appendBody(pre);\r\n    const closeBtn = await slice.build('Button', {\r\n      value: 'Close',\r\n      onClick: () => modal.close()\r\n    });\r\n    modal.appendFooter(closeBtn);\r\n    document.body.appendChild(modal);\r\n  }\r\n});\r\nreturn btn;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nUse modal for focused tasks that require user input or confirmation before continuing. Always provide a clear way to dismiss (close button, cancel action, or Escape key). For simple notifications, prefer `Toast` instead.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nThe modal creates a `<dialog>` in the top layer — ensure no other element interferes with `z-index` handling. Multiple open modals stack but the browser only allows one `<dialog>` in the top layer at a time; close one before opening another.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const lines = ["| Prop           | Type              | Default     | Description                             |\r","|----------------|-------------------|-------------|-----------------------------------------|\r","| `open`         | `boolean`         | `false`     | Show the modal via `showModal()`        |\r","| `title`        | `string`          | `''`        | Header text                             |\r","| `dismissable`  | `boolean`         | `true`      | Show close button + backdrop dismiss    |\r","| `width`        | `string`          | `''`        | CSS width override (e.g. `400px`)       |\r","| `maxWidth`     | `string`          | `''`        | CSS max-width override                  |\r","| `draggable`    | `boolean`         | `false`     | Move the modal by dragging its header   |\r","| `resizable`    | `boolean`         | `false`     | Resize the modal from its edges/corners |\r","| `customColor`  | `object \\| null`  | `null`      | `{ background, text, accent }`          |\r","| `onClose`      | `function`        | `null`      | Called when the modal is dismissed      |\r"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "slice-modal { --modal-max-height: min(90vh, 900px); }\r",
               language: "css"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-13"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"open\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"dismissable\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"width\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"maxWidth\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"draggable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"resizable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClose\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"open\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"dismissable\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"width\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"maxWidth\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"draggable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"resizable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClose\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
      }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

  beforeDestroy() {
    // Cleanup timers, listeners, or pending work here
  }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: '❐'
    });

    container.appendChild(copyMenu);
  }

  async renderScriptScenarios() {
    if (!Array.isArray(this.scriptScenarios) || this.scriptScenarios.length === 0) return;
    const host = this.querySelector('.documentation-content');
    if (!host) return;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

      // Render where the author put the :::script blocks.
      //
      // The markdown parser already emits one <div class="script-block"> at the
      // position of each block, in document order, and those divs come from the same
      // parse as this.scriptScenarios — so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all — the divs
      // were never filled, nothing in the repo reads .script-block — the real demos were
      // exiled below the props table, and 38 of 53 pages showed the heading twice.
      const blocks = [...this.querySelectorAll('.script-block')];
      const inPlace = blocks.length === this.scriptScenarios.length;

      const section = document.createElement('section');
      if (!inPlace) {
         // Fallback, kept so a future parser change that desyncs the two cannot
         // silently drop every demo. An author-placed heading already exists in the
         // in-place case, so only invent one when we are building the section.
         section.classList.add('doc-script-scenarios');

         const title = document.createElement('h2');
         title.textContent = 'Prop Scenarios';
         section.appendChild(title);

         const subtitle = document.createElement('p');
         subtitle.classList.add('doc-script-subtitle');
         subtitle.textContent = 'Interactive demos validating component behavior.';
         section.appendChild(subtitle);
      }
      for (const [index, scenario] of this.scriptScenarios.entries()) {
      const demobox = await slice.build('DemoBox', {
        label: scenario.label,
        expected: scenario.expected || ''
      });

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });

      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        demobox.clear();
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed var(--warning-color)';
          fallback.style.borderRadius = '8px';
          fallback.style.background = 'color-mix(in srgb, var(--primary-background-color) 85%, var(--warning-color))';
          fallback.style.color = 'var(--font-primary-color)';
          fallback.textContent = String(name || '')
            ? 'Component "' + String(name) + '" is not registered in this build yet.'
            : 'Requested component is not registered in this build yet.';
          return fallback;
        };

        const safeSlice = Object.create(slice);
        safeSlice.build = async (name, props) => {
          const built = await slice.build(name, props);
          if (built instanceof Node) {
            return built;
          }
          if (Array.isArray(built)) {
            const fragment = document.createDocumentFragment();
            let hasNode = false;
            built.forEach((item) => {
              if (item instanceof Node) {
                fragment.appendChild(item);
                hasNode = true;
              }
            });
            if (hasNode) {
              return fragment;
            }
          }
          return built ?? createBuildFallbackNode(name);
        };

        const mount = (node) => {
          if (node instanceof Node) {
            demobox.appendDemo(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

          if (result instanceof Node) {
            demobox.appendDemo(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                demobox.appendDemo(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };
      (inPlace ? blocks[index] : section).appendChild(demobox);
      demobox.appendCode(code);
      (inPlace ? blocks[index] : section).appendChild(errorMessage);

      await executeScenario();
    }
      if (!inPlace) host.appendChild(section);
  }
}

customElements.define('slice-modaldocumentation', ModalDocumentation);
