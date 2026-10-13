export default class ConfirmActionModalDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Yes / no","expected":"the flow stops at the dialog until you answer; try Escape and the backdrop too","kind":"script","content":"const confirm = await slice.build('ConfirmActionModal', { sliceId: 'demo-confirm' });\n\n// It has to be IN the document. The Modal is built inside this element, and\n// showModal() on a detached <dialog> is a silent no-op - nothing appears and\n// the promise still settles, so the failure looks like \"the button is dead\".\ndocument.body.appendChild(confirm);\n\nconst log = document.createElement('p');\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\nlog.textContent = 'Nothing decided yet.';\n\nconst ask = async () => {\n   const ok = await confirm.ask({\n      title: 'Delete “Quarterly report”?',\n      message: 'It moves to trash, where it stays for 30 days.',\n      confirmLabel: 'Delete',\n      danger: true,\n   });\n   log.textContent = ok ? 'Deleted.' : 'Kept.';\n};\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';\n\nrow.appendChild(await slice.build('Button', { value: 'Delete the report', variant: 'danger', onClick: ask }));\nrow.appendChild(await slice.build('Button', {\n   value: 'Rename instead',\n   variant: 'outlined',\n   onClick: async () => {\n      const name = await confirm.prompt({\n         title: 'Rename report',\n         inputLabel: 'New name',\n         inputValue: 'Quarterly report',\n         required: true,\n      });\n      log.textContent = name === null ? 'Renaming cancelled.' : `Renamed to “${name}”.`;\n   },\n}));\n\nconst wrap = document.createElement('div');\nwrap.appendChild(log);\nwrap.appendChild(row);\nmount(wrap);"},{"label":"Through the event manager","expected":"the buttons never touch the component — they just emit on the channel","kind":"script","content":"// A different channel, because the demo above already built a modal on the\n// default one and EVERY instance subscribes. Two on one page, one channel,\n// means one question opens two dialogs — which is exactly the footgun this\n// component has.\nconst confirm = await slice.build('ConfirmActionModal', {\n   sliceId: 'demo-confirm-evt',\n   eventName: 'demo:confirm:request',\n});\ndocument.body.appendChild(confirm);\n\nconst log = document.createElement('p');\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\nlog.textContent = 'Nothing emitted yet.';\n\n// A stand-in for a call site with no reference to the component: a save\n// routine, a store subscriber, a keyboard shortcut.\nconst emitFromAnywhere = (payload) => {\n   log.textContent = 'Asked. Answer in the dialog…';\n   slice.events.emit('demo:confirm:request', payload);\n};\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';\n\nrow.appendChild(await slice.build('Button', {\n   value: 'Emit a question',\n   variant: 'danger',\n   onClick: () => emitFromAnywhere({\n      title: 'Discard 3 unsent responses?',\n      message: 'They will not be recoverable.',\n      danger: true,\n      onConfirm: () => { log.textContent = 'Emitter heard: yes.'; },\n      onCancel: () => { log.textContent = 'Emitter heard: no.'; },\n   }),\n}));\n\nrow.appendChild(await slice.build('Button', {\n   value: 'Emit a prompt',\n   variant: 'outlined',\n   onClick: () => emitFromAnywhere({\n      title: 'Your name',\n      inputLabel: 'Name',\n      inputValue: 'Ana',\n      onConfirm: (name) => { log.textContent = `Emitter heard: “${name}”.`; },\n   }),\n}));\n\nconst wrap = document.createElement('div');\nwrap.appendChild(log);\nwrap.appendChild(row);\nmount(wrap);"}];
  }

  async init() {
    this.markdownPath = "confirm-action-modal.md";
    this.markdownContent = "---\ntitle: ConfirmActionModal\nroute: /docs/display/confirm-action-modal\nnavLabel: ConfirmActionModal\nsection: Display\ngroup: Feedback\norder: 32\ndescription: Promise-based \"are you sure?\" modal and single-value prompt, built on Modal, with an event-manager channel.\ncomponent: ConfirmActionModalDocumentation\ngenerate: true\ntags: [modal, confirm, alert, prompt, danger, confirmation, dialog, events]\n---\n\n# ConfirmActionModal\n\n## Overview\n\nThe \"are you sure?\" modal, and the single-value prompt. Built on\n[`Modal`](/docs/display/modal), so scroll-lock, focus, `Escape` and backdrop\ndismissal are already handled — this only owns the copy, the header mark, the\ntwo buttons and the answer.\n\nBuild it **once**, near your composition root, and recover it anywhere else:\n\n```javascript title=\"Build it once\"\nconst confirm = slice.getComponent('ConfirmActionModal');\n```\n\n:::warning\nBuild exactly one. Unlike a `Service`, a Visual component is **not** a\nsingleton: a second instance would also subscribe to `confirm:request`, so\nevery question would open two dialogs.\n:::\n\n:::warning\nIt must be **in the document**. The Modal is built inside the component, and\n`showModal()` on a detached `<dialog>` is a silent no-op: nothing appears,\nthe promise still settles, and it looks like the button is dead. Append it\nsomewhere real — `document.body` is the usual choice — and the component logs\na warning if you forget.\n:::\n\n## The two ways in\n\n### 1. A promise — when the answer decides what happens next\n\n```javascript\nif (!await confirm.ask({ title: 'Delete project?', danger: true })) return;\nawait deleteProject();\n```\n\nThis is the better default and the one to reach for first. The alternative — a\nbare event plus callbacks — makes every call site juggle two async channels and\na \"did this already fire?\" flag, and a caller that returns early leaves the\nevent unfired. With a promise the control flow is linear and cannot get wrong.\n\n### 2. The event manager — when the emitter cannot hold a reference\n\nSome call sites genuinely cannot reach the component: a deep save routine, a\nstore subscriber, a keyboard shortcut, a third-party callback. Emitting is then\nthe sane move, and `confirm:request` is subscribed for you:\n\n```javascript title=\"No reference needed\"\nslice.events.emit('confirm:request', {\n   title: 'Discard unsaved draft?',\n   message: 'Three responses have not been sent.',\n   danger: true,\n});\n```\n\nNobody is waiting on the answer, so this is fire-and-forget: it opens, the user\nanswers, the modal closes.\n\nAdd `onConfirm` / `onCancel` if the emitter does need the verdict:\n\n```javascript\nslice.events.emit('confirm:request', {\n   title: 'Publish?',\n   onConfirm: () => publish(),\n   onCancel: () => console.log('left it'),\n});\n```\n\nAn `inputLabel` in the payload makes it a **prompt**, and `onConfirm` receives\nthe typed value:\n\n```javascript\nslice.events.emit('confirm:request', {\n   title: 'Your name',\n   inputLabel: 'Name',\n   inputValue: 'Ana',\n   onConfirm: (name) => save({ name }),\n});\n```\n\nIf two independently-built modals would collide, give one of them a different\nchannel:\n\n```javascript\nconst admin = await slice.build('ConfirmActionModal', {\n   sliceId: 'admin-confirm',\n   eventName: 'admin:confirm:request',\n});\n```\n\n## API\n\n- `ask(options) -> Promise<boolean>` — `true` confirmed, `false` cancelled or dismissed.\n- `prompt(options) -> Promise<string|null>` — the value, or `null` if cancelled.\n- `isOpen` (boolean) — whether a question is currently on screen.\n\nOptions for both (all optional):\n\n| Option | Default | Notes |\n| --- | --- | --- |\n| `title` | `''` | |\n| `message` | `''` | hidden when empty |\n| `icon` | by `danger` | any Icon name; `false` hides the mark |\n| `confirmLabel` | `'Confirm'` | |\n| `cancelLabel` | `'Cancel'` | |\n| `danger` | `false` | confirm button becomes the `danger` variant |\n| `confirmVariant` | `'filled'` | used when `danger` is false |\n| `inputLabel` / `inputPlaceholder` / `inputValue` | `''` | `prompt()` only |\n| `inputType` | `'text'` | `'email'` adds native validation |\n| `required` | `false` | `prompt()` only; blocks confirm while empty |\n\nProps set once on the component and overridden per call: `confirmLabel`,\n`cancelLabel`, `confirmVariant`, `eventName`.\n\n## The header mark\n\nThe icon in the header follows `danger` so a destructive question never looks\nlike a routine one: `exclamation-circle` for danger, `question-circle`\notherwise. Override it with any Icon name, or pass `icon: false` to show no\nmark at all.\n\n## The one invariant\n\n**Every `ask()`/`prompt()` resolves exactly once.** A dialog that could be\ndismissed without settling would leave the awaiting caller hanging for the life\nof the page, so `Escape`, the backdrop, the X button, a second question arriving\nwhile one is open, and destroying the component all resolve — as cancellations.\nThere is a spec for each of those.\n\n## Prop Scenarios\n\n:::script label=\"Yes / no\" expected=\"the flow stops at the dialog until you answer; try Escape and the backdrop too\"\nconst confirm = await slice.build('ConfirmActionModal', { sliceId: 'demo-confirm' });\n\n// It has to be IN the document. The Modal is built inside this element, and\n// showModal() on a detached <dialog> is a silent no-op - nothing appears and\n// the promise still settles, so the failure looks like \"the button is dead\".\ndocument.body.appendChild(confirm);\n\nconst log = document.createElement('p');\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\nlog.textContent = 'Nothing decided yet.';\n\nconst ask = async () => {\n   const ok = await confirm.ask({\n      title: 'Delete “Quarterly report”?',\n      message: 'It moves to trash, where it stays for 30 days.',\n      confirmLabel: 'Delete',\n      danger: true,\n   });\n   log.textContent = ok ? 'Deleted.' : 'Kept.';\n};\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';\n\nrow.appendChild(await slice.build('Button', { value: 'Delete the report', variant: 'danger', onClick: ask }));\nrow.appendChild(await slice.build('Button', {\n   value: 'Rename instead',\n   variant: 'outlined',\n   onClick: async () => {\n      const name = await confirm.prompt({\n         title: 'Rename report',\n         inputLabel: 'New name',\n         inputValue: 'Quarterly report',\n         required: true,\n      });\n      log.textContent = name === null ? 'Renaming cancelled.' : `Renamed to “${name}”.`;\n   },\n}));\n\nconst wrap = document.createElement('div');\nwrap.appendChild(log);\nwrap.appendChild(row);\nmount(wrap);\n:::\n\n:::script label=\"Through the event manager\" expected=\"the buttons never touch the component — they just emit on the channel\"\n// A different channel, because the demo above already built a modal on the\n// default one and EVERY instance subscribes. Two on one page, one channel,\n// means one question opens two dialogs — which is exactly the footgun this\n// component has.\nconst confirm = await slice.build('ConfirmActionModal', {\n   sliceId: 'demo-confirm-evt',\n   eventName: 'demo:confirm:request',\n});\ndocument.body.appendChild(confirm);\n\nconst log = document.createElement('p');\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\nlog.textContent = 'Nothing emitted yet.';\n\n// A stand-in for a call site with no reference to the component: a save\n// routine, a store subscriber, a keyboard shortcut.\nconst emitFromAnywhere = (payload) => {\n   log.textContent = 'Asked. Answer in the dialog…';\n   slice.events.emit('demo:confirm:request', payload);\n};\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';\n\nrow.appendChild(await slice.build('Button', {\n   value: 'Emit a question',\n   variant: 'danger',\n   onClick: () => emitFromAnywhere({\n      title: 'Discard 3 unsent responses?',\n      message: 'They will not be recoverable.',\n      danger: true,\n      onConfirm: () => { log.textContent = 'Emitter heard: yes.'; },\n      onCancel: () => { log.textContent = 'Emitter heard: no.'; },\n   }),\n}));\n\nrow.appendChild(await slice.build('Button', {\n   value: 'Emit a prompt',\n   variant: 'outlined',\n   onClick: () => emitFromAnywhere({\n      title: 'Your name',\n      inputLabel: 'Name',\n      inputValue: 'Ana',\n      onConfirm: (name) => { log.textContent = `Emitter heard: “${name}”.`; },\n   }),\n}));\n\nconst wrap = document.createElement('div');\nwrap.appendChild(log);\nwrap.appendChild(row);\nmount(wrap);\n:::\n\n## Best Practices\n\n:::tip\nPut the consequence in `message`, not in the title. The title says what is being asked; the\nmessage says what happens if the answer is yes. \"This cannot be undone\" is worth more than\n\"Confirm\".\n:::\n\n:::tip\nUse `danger: true` for anything irreversible. It swaps the confirm button, the header mark and\nthe badge behind it in one property.\n:::\n\n:::tip\nPrefer the promise over the event. Reach for the event when the emitter genuinely has no\nreference to the component, not because callbacks read nicely at the call site.\n:::\n\n## Pitfalls\n\n:::warning\n`required` blocks the confirm button and paints an error, but it does not disable it. That is\ndeliberate: a permanently greyed-out button tells the user nothing about why. If the empty case\nshould not even be reachable, validate before opening the modal.\n:::\n\n:::warning\nDo not pass `singleton: true`. That flag is only for components registered as `\"Service\"`, and\n`slice.build` returns **`null`** for a Visual component built with it — so `confirm.ask` is then\n\"not a function\". Build the modal once and share it with `slice.getComponent`.\n:::\n\n:::warning\nA prompt's field is focused when it opens, so `Enter` confirms. If the answer is not something a\nuser should be able to submit with a single keystroke, do not put a prompt on that action.\n:::\n\n:::warning\n`ask()` cannot prevent the modal from being dismissed — `Escape` and the backdrop always count as\n\"no\". If the answer must be explicit, do not make it cancellable: leave `dismissable` on and accept\nthat a stray Escape reads as a refusal.\n:::\n\n:::warning\nEvery instance subscribes to `confirm:request`. Two instances means two dialogs for one question,\nso build exactly one, or give the second a different `eventName`.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const confirm = slice.getComponent('ConfirmActionModal');",
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
               value: "if (!await confirm.ask({ title: 'Delete project?', danger: true })) return;\nawait deleteProject();",
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
               value: "slice.events.emit('confirm:request', {\n   title: 'Discard unsaved draft?',\n   message: 'Three responses have not been sent.',\n   danger: true,\n});",
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
               value: "slice.events.emit('confirm:request', {\n   title: 'Publish?',\n   onConfirm: () => publish(),\n   onCancel: () => console.log('left it'),\n});",
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
               value: "slice.events.emit('confirm:request', {\n   title: 'Your name',\n   inputLabel: 'Name',\n   inputValue: 'Ana',\n   onConfirm: (name) => save({ name }),\n});",
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
               value: "const admin = await slice.build('ConfirmActionModal', {\n   sliceId: 'admin-confirm',\n   eventName: 'admin:confirm:request',\n});",
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
            const lines = ["| Option | Default | Notes |","| --- | --- | --- |","| `title` | `''` | |","| `message` | `''` | hidden when empty |","| `icon` | by `danger` | any Icon name; `false` hides the mark |","| `confirmLabel` | `'Confirm'` | |","| `cancelLabel` | `'Cancel'` | |","| `danger` | `false` | confirm button becomes the `danger` variant |","| `confirmVariant` | `'filled'` | used when `danger` is false |","| `inputLabel` / `inputPlaceholder` / `inputValue` | `''` | `prompt()` only |","| `inputType` | `'text'` | `'email'` adds native validation |","| `required` | `false` | `prompt()` only; blocks confirm while empty |"];
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

    const section = document.createElement('section');
    section.classList.add('doc-script-scenarios');

    const title = document.createElement('h2');
    title.textContent = 'Prop Scenarios';
    section.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.classList.add('doc-script-subtitle');
    subtitle.textContent = 'Interactive demos validating component behavior.';
    section.appendChild(subtitle);

    for (const scenario of this.scriptScenarios) {
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

      section.appendChild(demobox);
      demobox.appendCode(code);
      section.appendChild(errorMessage);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-confirmactionmodaldocumentation', ConfirmActionModalDocumentation);
