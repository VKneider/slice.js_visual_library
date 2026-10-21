export default class ConfirmActionModalDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Yes / no","expected":"the flow stops at the dialog until you answer; try Escape and the backdrop too","kind":"script","content":"const confirm = await slice.build('ConfirmActionModal', { sliceId: 'demo-confirm' });\r\n\r\n// It has to be IN the document. The Modal is built inside this element, and\r\n// showModal() on a detached <dialog> is a silent no-op - nothing appears and\r\n// the promise still settles, so the failure looks like \"the button is dead\".\r\ndocument.body.appendChild(confirm);\r\n\r\nconst log = document.createElement('p');\r\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\r\nlog.textContent = 'Nothing decided yet.';\r\n\r\nconst ask = async () => {\r\n   const ok = await confirm.ask({\r\n      title: 'Delete “Quarterly report”?',\r\n      message: 'It moves to trash, where it stays for 30 days.',\r\n      confirmLabel: 'Delete',\r\n      danger: true,\r\n   });\r\n   log.textContent = ok ? 'Deleted.' : 'Kept.';\r\n};\r\n\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';\r\n\r\nrow.appendChild(await slice.build('Button', { value: 'Delete the report', variant: 'danger', onClick: ask }));\r\nrow.appendChild(await slice.build('Button', {\r\n   value: 'Rename instead',\r\n   variant: 'outlined',\r\n   onClick: async () => {\r\n      const name = await confirm.prompt({\r\n         title: 'Rename report',\r\n         inputLabel: 'New name',\r\n         inputValue: 'Quarterly report',\r\n         required: true,\r\n      });\r\n      log.textContent = name === null ? 'Renaming cancelled.' : `Renamed to “${name}”.`;\r\n   },\r\n}));\r\n\r\nconst wrap = document.createElement('div');\r\nwrap.appendChild(log);\r\nwrap.appendChild(row);\r\nmount(wrap);"},{"label":"Through the event manager","expected":"the buttons never touch the component — they just emit on the channel","kind":"script","content":"// A different channel, because the demo above already built a modal on the\r\n// default one and EVERY instance subscribes. Two on one page, one channel,\r\n// means one question opens two dialogs — which is exactly the footgun this\r\n// component has.\r\nconst confirm = await slice.build('ConfirmActionModal', {\r\n   sliceId: 'demo-confirm-evt',\r\n   eventName: 'demo:confirm:request',\r\n});\r\ndocument.body.appendChild(confirm);\r\n\r\nconst log = document.createElement('p');\r\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\r\nlog.textContent = 'Nothing emitted yet.';\r\n\r\n// A stand-in for a call site with no reference to the component: a save\r\n// routine, a store subscriber, a keyboard shortcut.\r\nconst emitFromAnywhere = (payload) => {\r\n   log.textContent = 'Asked. Answer in the dialog…';\r\n   slice.events.emit('demo:confirm:request', payload);\r\n};\r\n\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';\r\n\r\nrow.appendChild(await slice.build('Button', {\r\n   value: 'Emit a question',\r\n   variant: 'danger',\r\n   onClick: () => emitFromAnywhere({\r\n      title: 'Discard 3 unsent responses?',\r\n      message: 'They will not be recoverable.',\r\n      danger: true,\r\n      onConfirm: () => { log.textContent = 'Emitter heard: yes.'; },\r\n      onCancel: () => { log.textContent = 'Emitter heard: no.'; },\r\n   }),\r\n}));\r\n\r\nrow.appendChild(await slice.build('Button', {\r\n   value: 'Emit a prompt',\r\n   variant: 'outlined',\r\n   onClick: () => emitFromAnywhere({\r\n      title: 'Your name',\r\n      inputLabel: 'Name',\r\n      inputValue: 'Ana',\r\n      onConfirm: (name) => { log.textContent = `Emitter heard: “${name}”.`; },\r\n   }),\r\n}));\r\n\r\nconst wrap = document.createElement('div');\r\nwrap.appendChild(log);\r\nwrap.appendChild(row);\r\nmount(wrap);"}];
  }

  async init() {
    this.markdownPath = "confirm-action-modal.md";
    this.markdownContent = "---\r\ntitle: ConfirmActionModal\r\nroute: /docs/display/confirm-action-modal\r\nnavLabel: ConfirmActionModal\r\nsection: Display\r\ngroup: Feedback\r\norder: 32\r\ndescription: Promise-based \"are you sure?\" modal and single-value prompt, built on Modal, with an event-manager channel.\r\ncomponent: ConfirmActionModalDocumentation\r\ngenerate: true\r\ntags: [modal, confirm, alert, prompt, danger, confirmation, dialog, events]\r\n---\r\n\r\n# ConfirmActionModal\r\n\r\n## Overview\r\n\r\nThe \"are you sure?\" modal, and the single-value prompt. Built on\r\n[`Modal`](/docs/display/modal), so scroll-lock, focus, `Escape` and backdrop\r\ndismissal are already handled — this only owns the copy, the header mark, the\r\ntwo buttons and the answer.\r\n\r\nBuild it **once**, near your composition root, and recover it anywhere else:\r\n\r\n```javascript title=\"Build it once\"\r\nconst confirm = slice.getComponent('ConfirmActionModal');\r\n```\r\n\r\n:::warning\r\nBuild exactly one. Unlike a `Service`, a Visual component is **not** a\r\nsingleton: a second instance would also subscribe to `confirm:request`, so\r\nevery question would open two dialogs.\r\n:::\r\n\r\n:::warning\r\nIt must be **in the document**. The Modal is built inside the component, and\r\n`showModal()` on a detached `<dialog>` is a silent no-op: nothing appears,\r\nthe promise still settles, and it looks like the button is dead. Append it\r\nsomewhere real — `document.body` is the usual choice — and the component logs\r\na warning if you forget.\r\n:::\r\n\r\n## The two ways in\r\n\r\n### 1. A promise — when the answer decides what happens next\r\n\r\n```javascript\r\nif (!await confirm.ask({ title: 'Delete project?', danger: true })) return;\r\nawait deleteProject();\r\n```\r\n\r\nThis is the better default and the one to reach for first. The alternative — a\r\nbare event plus callbacks — makes every call site juggle two async channels and\r\na \"did this already fire?\" flag, and a caller that returns early leaves the\r\nevent unfired. With a promise the control flow is linear and cannot get wrong.\r\n\r\n### 2. The event manager — when the emitter cannot hold a reference\r\n\r\nSome call sites genuinely cannot reach the component: a deep save routine, a\r\nstore subscriber, a keyboard shortcut, a third-party callback. Emitting is then\r\nthe sane move, and `confirm:request` is subscribed for you:\r\n\r\n```javascript title=\"No reference needed\"\r\nslice.events.emit('confirm:request', {\r\n   title: 'Discard unsaved draft?',\r\n   message: 'Three responses have not been sent.',\r\n   danger: true,\r\n});\r\n```\r\n\r\nNobody is waiting on the answer, so this is fire-and-forget: it opens, the user\r\nanswers, the modal closes.\r\n\r\nAdd `onConfirm` / `onCancel` if the emitter does need the verdict:\r\n\r\n```javascript\r\nslice.events.emit('confirm:request', {\r\n   title: 'Publish?',\r\n   onConfirm: () => publish(),\r\n   onCancel: () => console.log('left it'),\r\n});\r\n```\r\n\r\nAn `inputLabel` in the payload makes it a **prompt**, and `onConfirm` receives\r\nthe typed value:\r\n\r\n```javascript\r\nslice.events.emit('confirm:request', {\r\n   title: 'Your name',\r\n   inputLabel: 'Name',\r\n   inputValue: 'Ana',\r\n   onConfirm: (name) => save({ name }),\r\n});\r\n```\r\n\r\nIf two independently-built modals would collide, give one of them a different\r\nchannel:\r\n\r\n```javascript\r\nconst admin = await slice.build('ConfirmActionModal', {\r\n   sliceId: 'admin-confirm',\r\n   eventName: 'admin:confirm:request',\r\n});\r\n```\r\n\r\n## API\r\n\r\n- `ask(options) -> Promise<boolean>` — `true` confirmed, `false` cancelled or dismissed.\r\n- `prompt(options) -> Promise<string|null>` — the value, or `null` if cancelled.\r\n- `isOpen` (boolean) — whether a question is currently on screen.\r\n\r\nOptions for both (all optional):\r\n\r\n| Option | Default | Notes |\r\n| --- | --- | --- |\r\n| `title` | `''` | |\r\n| `message` | `''` | hidden when empty |\r\n| `icon` | by `danger` | any Icon name; `false` hides the mark |\r\n| `confirmLabel` | `'Confirm'` | |\r\n| `cancelLabel` | `'Cancel'` | |\r\n| `danger` | `false` | confirm button becomes the `danger` variant |\r\n| `confirmVariant` | `'filled'` | used when `danger` is false |\r\n| `inputLabel` / `inputPlaceholder` / `inputValue` | `''` | `prompt()` only |\r\n| `inputType` | `'text'` | `'email'` adds native validation |\r\n| `required` | `false` | `prompt()` only; blocks confirm while empty |\r\n\r\nProps set once on the component and overridden per call: `confirmLabel`,\r\n`cancelLabel`, `confirmVariant`, `eventName`.\r\n\r\n## The header mark\r\n\r\nThe icon in the header follows `danger` so a destructive question never looks\r\nlike a routine one: `exclamation-circle` for danger, `question-circle`\r\notherwise. Override it with any Icon name, or pass `icon: false` to show no\r\nmark at all.\r\n\r\n## The one invariant\r\n\r\n**Every `ask()`/`prompt()` resolves exactly once.** A dialog that could be\r\ndismissed without settling would leave the awaiting caller hanging for the life\r\nof the page, so `Escape`, the backdrop, the X button, a second question arriving\r\nwhile one is open, and destroying the component all resolve — as cancellations.\r\nThere is a spec for each of those.\r\n\r\n## Prop Scenarios\r\n\r\n:::script label=\"Yes / no\" expected=\"the flow stops at the dialog until you answer; try Escape and the backdrop too\"\r\nconst confirm = await slice.build('ConfirmActionModal', { sliceId: 'demo-confirm' });\r\n\r\n// It has to be IN the document. The Modal is built inside this element, and\r\n// showModal() on a detached <dialog> is a silent no-op - nothing appears and\r\n// the promise still settles, so the failure looks like \"the button is dead\".\r\ndocument.body.appendChild(confirm);\r\n\r\nconst log = document.createElement('p');\r\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\r\nlog.textContent = 'Nothing decided yet.';\r\n\r\nconst ask = async () => {\r\n   const ok = await confirm.ask({\r\n      title: 'Delete “Quarterly report”?',\r\n      message: 'It moves to trash, where it stays for 30 days.',\r\n      confirmLabel: 'Delete',\r\n      danger: true,\r\n   });\r\n   log.textContent = ok ? 'Deleted.' : 'Kept.';\r\n};\r\n\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';\r\n\r\nrow.appendChild(await slice.build('Button', { value: 'Delete the report', variant: 'danger', onClick: ask }));\r\nrow.appendChild(await slice.build('Button', {\r\n   value: 'Rename instead',\r\n   variant: 'outlined',\r\n   onClick: async () => {\r\n      const name = await confirm.prompt({\r\n         title: 'Rename report',\r\n         inputLabel: 'New name',\r\n         inputValue: 'Quarterly report',\r\n         required: true,\r\n      });\r\n      log.textContent = name === null ? 'Renaming cancelled.' : `Renamed to “${name}”.`;\r\n   },\r\n}));\r\n\r\nconst wrap = document.createElement('div');\r\nwrap.appendChild(log);\r\nwrap.appendChild(row);\r\nmount(wrap);\r\n:::\r\n\r\n:::script label=\"Through the event manager\" expected=\"the buttons never touch the component — they just emit on the channel\"\r\n// A different channel, because the demo above already built a modal on the\r\n// default one and EVERY instance subscribes. Two on one page, one channel,\r\n// means one question opens two dialogs — which is exactly the footgun this\r\n// component has.\r\nconst confirm = await slice.build('ConfirmActionModal', {\r\n   sliceId: 'demo-confirm-evt',\r\n   eventName: 'demo:confirm:request',\r\n});\r\ndocument.body.appendChild(confirm);\r\n\r\nconst log = document.createElement('p');\r\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\r\nlog.textContent = 'Nothing emitted yet.';\r\n\r\n// A stand-in for a call site with no reference to the component: a save\r\n// routine, a store subscriber, a keyboard shortcut.\r\nconst emitFromAnywhere = (payload) => {\r\n   log.textContent = 'Asked. Answer in the dialog…';\r\n   slice.events.emit('demo:confirm:request', payload);\r\n};\r\n\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';\r\n\r\nrow.appendChild(await slice.build('Button', {\r\n   value: 'Emit a question',\r\n   variant: 'danger',\r\n   onClick: () => emitFromAnywhere({\r\n      title: 'Discard 3 unsent responses?',\r\n      message: 'They will not be recoverable.',\r\n      danger: true,\r\n      onConfirm: () => { log.textContent = 'Emitter heard: yes.'; },\r\n      onCancel: () => { log.textContent = 'Emitter heard: no.'; },\r\n   }),\r\n}));\r\n\r\nrow.appendChild(await slice.build('Button', {\r\n   value: 'Emit a prompt',\r\n   variant: 'outlined',\r\n   onClick: () => emitFromAnywhere({\r\n      title: 'Your name',\r\n      inputLabel: 'Name',\r\n      inputValue: 'Ana',\r\n      onConfirm: (name) => { log.textContent = `Emitter heard: “${name}”.`; },\r\n   }),\r\n}));\r\n\r\nconst wrap = document.createElement('div');\r\nwrap.appendChild(log);\r\nwrap.appendChild(row);\r\nmount(wrap);\r\n:::\r\n\r\n## Best Practices\r\n\r\n:::tip\r\nPut the consequence in `message`, not in the title. The title says what is being asked; the\r\nmessage says what happens if the answer is yes. \"This cannot be undone\" is worth more than\r\n\"Confirm\".\r\n:::\r\n\r\n:::tip\r\nUse `danger: true` for anything irreversible. It swaps the confirm button, the header mark and\r\nthe badge behind it in one property.\r\n:::\r\n\r\n:::tip\r\nPrefer the promise over the event. Reach for the event when the emitter genuinely has no\r\nreference to the component, not because callbacks read nicely at the call site.\r\n:::\r\n\r\n## Pitfalls\r\n\r\n:::warning\r\n`required` blocks the confirm button and paints an error, but it does not disable it. That is\r\ndeliberate: a permanently greyed-out button tells the user nothing about why. If the empty case\r\nshould not even be reachable, validate before opening the modal.\r\n:::\r\n\r\n:::warning\r\nDo not pass `singleton: true`. That flag is only for components registered as `\"Service\"`, and\r\n`slice.build` returns **`null`** for a Visual component built with it — so `confirm.ask` is then\r\n\"not a function\". Build the modal once and share it with `slice.getComponent`.\r\n:::\r\n\r\n:::warning\r\nA prompt's field is focused when it opens, so `Enter` confirms. If the answer is not something a\r\nuser should be able to submit with a single keystroke, do not put a prompt on that action.\r\n:::\r\n\r\n:::warning\r\n`ask()` cannot prevent the modal from being dismissed — `Escape` and the backdrop always count as\r\n\"no\". If the answer must be explicit, do not make it cancellable: leave `dismissable` on and accept\r\nthat a stray Escape reads as a refusal.\r\n:::\r\n\r\n:::warning\r\nEvery instance subscribes to `confirm:request`. Two instances means two dialogs for one question,\r\nso build exactly one, or give the second a different `eventName`.\r\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const confirm = slice.getComponent('ConfirmActionModal');\r",
               language: "javascript"
            });
            if ("Build it once") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build it once";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "if (!await confirm.ask({ title: 'Delete project?', danger: true })) return;\r\nawait deleteProject();\r",
               language: "javascript"
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
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "slice.events.emit('confirm:request', {\r\n   title: 'Discard unsaved draft?',\r\n   message: 'Three responses have not been sent.',\r\n   danger: true,\r\n});\r",
               language: "javascript"
            });
            if ("No reference needed") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "No reference needed";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "slice.events.emit('confirm:request', {\r\n   title: 'Publish?',\r\n   onConfirm: () => publish(),\r\n   onCancel: () => console.log('left it'),\r\n});\r",
               language: "javascript"
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
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "slice.events.emit('confirm:request', {\r\n   title: 'Your name',\r\n   inputLabel: 'Name',\r\n   inputValue: 'Ana',\r\n   onConfirm: (name) => save({ name }),\r\n});\r",
               language: "javascript"
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
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const admin = await slice.build('ConfirmActionModal', {\r\n   sliceId: 'admin-confirm',\r\n   eventName: 'admin:confirm:request',\r\n});\r",
               language: "javascript"
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
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            const lines = ["| Option | Default | Notes |\r","| --- | --- | --- |\r","| `title` | `''` | |\r","| `message` | `''` | hidden when empty |\r","| `icon` | by `danger` | any Icon name; `false` hides the mark |\r","| `confirmLabel` | `'Confirm'` | |\r","| `cancelLabel` | `'Cancel'` | |\r","| `danger` | `false` | confirm button becomes the `danger` variant |\r","| `confirmVariant` | `'filled'` | used when `danger` is false |\r","| `inputLabel` / `inputPlaceholder` / `inputValue` | `''` | `prompt()` only |\r","| `inputType` | `'text'` | `'email'` adds native validation |\r","| `required` | `false` | `prompt()` only; blocks confirm while empty |\r"];
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

customElements.define('slice-confirmactionmodaldocumentation', ConfirmActionModalDocumentation);
