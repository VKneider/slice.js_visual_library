export default class ConfirmDialogDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Yes / no","expected":"the flow stops at the dialog until you answer; try Escape and the backdrop too","kind":"script","content":"const confirm = await slice.build('ConfirmDialog', { singleton: true });\n\nconst log = document.createElement('p');\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\nlog.textContent = 'Nothing decided yet.';\n\nconst ask = async () => {\n   const ok = await confirm.ask({\n      title: 'Delete “Quarterly report”?',\n      message: 'It moves to trash, where it stays for 30 days.',\n      confirmLabel: 'Delete',\n      danger: true,\n   });\n   log.textContent = ok ? 'Deleted.' : 'Kept.';\n};\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';\n\nrow.appendChild(await slice.build('Button', { value: 'Delete the report', variant: 'danger', onClick: ask }));\nrow.appendChild(await slice.build('Button', {\n   value: 'Rename instead',\n   variant: 'outlined',\n   onClick: async () => {\n      const name = await confirm.prompt({\n         title: 'Rename report',\n         inputLabel: 'New name',\n         inputValue: 'Quarterly report',\n         required: true,\n      });\n      log.textContent = name === null ? 'Renaming cancelled.' : `Renamed to “${name}”.`;\n   },\n}));\n\nconst wrap = document.createElement('div');\nwrap.appendChild(log);\nwrap.appendChild(row);\nmount(wrap);"}];
  }

  async init() {
    this.markdownPath = "confirm-dialog.md";
    this.markdownContent = "---\ntitle: ConfirmDialog\nroute: /docs/display/confirm-dialog\nnavLabel: ConfirmDialog\nsection: Display\ngroup: Feedback\norder: 32\ndescription: Promise-based \"are you sure?\" dialog and single-value prompt, built on Modal.\ncomponent: ConfirmDialogDocumentation\ngenerate: true\ntags: [dialog, confirm, alert, prompt, modal, danger, confirmation]\n---\n\n# ConfirmDialog\n\n## Overview\n\nThe \"are you sure?\" dialog, and the single-value prompt. Built on [`Modal`](/docs/display/modal), so\nscroll-lock, focus, `Escape` and backdrop dismissal are already handled — this only owns the copy,\nthe two buttons and the promise.\n\n```javascript title=\"Build it once, anywhere in your composition root\"\nconst confirm = slice.getComponent('ConfirmDialog');\n```\n\n## Why a promise and not an event\n\nThe obvious alternative is a global `confirm:request` event plus callbacks. With that, every call\nsite has to juggle two async channels plus a \"did this already fire?\" flag, and a caller that\nreturns early leaves the event unfired.\n\nWith a promise the control flow is linear and cannot get wrong:\n\n```javascript\nif (!await confirm.ask({ title: 'Delete project?' })) return;\nawait deleteProject();\n```\n\n## API\n\n- `ask(options) -> Promise<boolean>` — `true` confirmed, `false` cancelled or dismissed.\n- `prompt(options) -> Promise<string|null>` — the value, or `null` if cancelled.\n- `isOpen` (boolean) — whether a question is currently on screen.\n\nOptions for both (all optional):\n\n| Option | Default | Notes |\n| --- | --- | --- |\n| `title` | `''` | |\n| `message` | `''` | hidden when empty |\n| `confirmLabel` | `'Confirm'` | |\n| `cancelLabel` | `'Cancel'` | |\n| `danger` | `false` | confirm button becomes the `danger` variant |\n| `confirmVariant` | `'filled'` | used when `danger` is false |\n| `inputLabel` / `inputPlaceholder` / `inputValue` | `''` | `prompt()` only |\n| `inputType` | `'text'` | `'email'` adds native validation |\n| `required` | `false` | `prompt()` only; blocks confirm while empty |\n\nDefaults can be set once on the component (`confirmLabel`, `cancelLabel`, `confirmVariant` props)\nand overridden per call.\n\n## The one invariant\n\n**Every `ask()`/`prompt()` resolves exactly once.** A dialog that could be dismissed without\nsettling would leave the awaiting caller hanging for the life of the page, so `Escape`, the\nbackdrop, the X button, a second question arriving while one is open, and destroying the component\nall resolve — as cancellations. There is a spec for each of those.\n\n## Prop Scenarios\n\n:::script label=\"Yes / no\" expected=\"the flow stops at the dialog until you answer; try Escape and the backdrop too\"\nconst confirm = await slice.build('ConfirmDialog', { singleton: true });\n\nconst log = document.createElement('p');\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\nlog.textContent = 'Nothing decided yet.';\n\nconst ask = async () => {\n   const ok = await confirm.ask({\n      title: 'Delete “Quarterly report”?',\n      message: 'It moves to trash, where it stays for 30 days.',\n      confirmLabel: 'Delete',\n      danger: true,\n   });\n   log.textContent = ok ? 'Deleted.' : 'Kept.';\n};\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';\n\nrow.appendChild(await slice.build('Button', { value: 'Delete the report', variant: 'danger', onClick: ask }));\nrow.appendChild(await slice.build('Button', {\n   value: 'Rename instead',\n   variant: 'outlined',\n   onClick: async () => {\n      const name = await confirm.prompt({\n         title: 'Rename report',\n         inputLabel: 'New name',\n         inputValue: 'Quarterly report',\n         required: true,\n      });\n      log.textContent = name === null ? 'Renaming cancelled.' : `Renamed to “${name}”.`;\n   },\n}));\n\nconst wrap = document.createElement('div');\nwrap.appendChild(log);\nwrap.appendChild(row);\nmount(wrap);\n:::\n\n## Best Practices\n\n:::tip\nPut the consequence in `message`, not in the title. The title says what is being asked; the\nmessage says what happens if the answer is yes. \"This cannot be undone\" is worth more than\n\"Confirm\".\n:::\n\n:::tip\nUse `danger: true` for anything irreversible. It is the only thing that distinguishes \"shall I\npublish this?\" from \"shall I delete this?\", and it is one property.\n:::\n\n## Pitfalls\n\n:::warning\n`required` blocks the confirm button and paints an error, but it does not disable it. That is\ndeliberate: a permanently greyed-out button tells the user nothing about why. If the empty case\nshould not even be reachable, validate before opening the dialog.\n\n:::warning\nA prompt's field is focused when it opens, so `Enter` confirms. If the answer is not something a\nuser should be able to submit with a single keystroke, do not put a prompt on that action.\n\n:::warning\n`ask()` cannot prevent the dialog from being dismissed — `Escape` and the backdrop always count as\n\"no\". If the answer must be explicit, do not make it cancellable: leave `dismissable` on and accept\nthat a stray Escape reads as a refusal.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const confirm = slice.getComponent('ConfirmDialog');",
               language: "javascript"
            });
            if ("Build it once, anywhere in your composition root") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build it once, anywhere in your composition root";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "if (!await confirm.ask({ title: 'Delete project?' })) return;\nawait deleteProject();",
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
            const lines = ["| Option | Default | Notes |","| --- | --- | --- |","| `title` | `''` | |","| `message` | `''` | hidden when empty |","| `confirmLabel` | `'Confirm'` | |","| `cancelLabel` | `'Cancel'` | |","| `danger` | `false` | confirm button becomes the `danger` variant |","| `confirmVariant` | `'filled'` | used when `danger` is false |","| `inputLabel` / `inputPlaceholder` / `inputValue` | `''` | `prompt()` only |","| `inputType` | `'text'` | `'email'` adds native validation |","| `required` | `false` | `prompt()` only; blocks confirm while empty |"];
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

customElements.define('slice-confirmdialogdocumentation', ConfirmDialogDocumentation);
