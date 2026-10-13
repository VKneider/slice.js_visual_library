export default class UnsavedChangesGuardDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Try to leave with pending work","expected":"arm the guard, then use the back button, a link, or reload — each one asks","kind":"script","content":"const guard = await slice.build('UnsavedChangesGuard', { singleton: true });\nguard.setDialog((message, done) => {\n   done(window.confirm(message));\n});\n\nconst log = document.createElement('p');\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\n\nconst draft = document.createElement('textarea');\ndraft.placeholder = 'Type something, then try to leave the page…';\ndraft.style.cssText = 'width:100%;min-height:80px;padding:8px;font-family:system-ui,sans-serif;font-size:.85rem;border:1px solid var(--medium-color);border-radius:6px;box-sizing:border-box;';\n\nconst setLog = () => {\n   const pending = draft.value.trim().length > 0;\n   log.textContent = pending\n      ? 'Armed — the browser will warn you before you leave.'\n      : 'Not armed — nothing to lose.';\n};\n\ndraft.addEventListener('input', () => {\n   // A form component would do this around its own state.\n   if (draft.value.trim()) guard.arm('demo', { message: 'Your draft has not been saved.' });\n   else guard.disarm('demo');\n   setLog();\n});\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;';\n\nrow.appendChild(await slice.build('Button', {\n   value: 'Save (disarms)',\n   onClick: () => { draft.value = ''; guard.disarm('demo'); setLog(); draft.blur(); },\n}));\nrow.appendChild(await slice.build('Button', {\n   value: 'Go to the Button docs',\n   variant: 'outlined',\n   onClick: () => slice.router.navigate('/docs/input/button'),\n}));\n\nconst wrap = document.createElement('div');\nwrap.appendChild(log);\nwrap.appendChild(row);\nwrap.appendChild(draft);\n\nsetLog();\nmount(wrap);"}];
  }

  async init() {
    this.markdownPath = "unsaved-changes-guard.md";
    this.markdownContent = "---\ntitle: UnsavedChangesGuard\nroute: /docs/services/unsaved-changes-guard\nnavLabel: UnsavedChangesGuard\nsection: Services\ngroup: Security\norder: 13\ndescription: Warns before the user throws away work in progress — tab close, in-app navigation, or the back button.\ncomponent: UnsavedChangesGuardDocumentation\ngenerate: true\ntags: [service, unsaved, guard, navigation, beforeunload, confirm, dirty]\n---\n\n# UnsavedChangesGuard\n\n## Overview\n\nThe \"you have unsaved changes\" guard. Any component can declare pending work with a stable key, and\nthe guard covers the three ways a user can walk away from it.\n\n```javascript title=\"Build it once\"\nconst guard = slice.getComponent('UnsavedChangesGuard');\n```\n\n```javascript title=\"Arm while editing, disarm when saved\"\nguard.arm('project-form');          // the user starts typing\n// ... on save success:\nguard.disarm('project-form');\n```\n\n## API\n\n- `arm(key = 'default', { message })` — declare pending work.\n- `disarm(key = 'default')` — the work is saved or deliberately abandoned.\n- `isArmed` / `pendingCount` — what is currently holding the guard.\n- `confirmLeave(message?) -> Promise<boolean>` — ask by hand, for anything the built-in exits miss.\n- `guardFn(to, from, next)` — the router guard body, if you want to compose it yourself.\n- `setDialog(fn)` — replace the browser `confirm` with your own dialog.\n- `destroy()` — release everything and detach the listeners.\n\nArms are **reference-counted by key**: `arm('editor')` twice is still one holder, and two different\nkeys need two `disarm` calls. A component that re-arms on every render therefore cannot lock the\nuser out of the page.\n\n## The three exits, and why they are not equally reliable\n\n| Exit | Mechanism | Reliability |\n| --- | --- | --- |\n| Tab close, reload, leaving the site | `beforeunload` | **Solid.** The browser's own dialog. |\n| In-app navigation (`navigate()`, `<slice-link>`) | Router `beforeEach` | **Solid.** |\n| Back / forward buttons | `popstate`, intercepted | **Best effort.** See below. |\n\n### The back button is best effort, and cannot be otherwise\n\nThe router does **not** run `beforeEach` on `popstate` — `Router.onRouteChange()` goes straight to\nrendering. By the time the event reaches you, the URL has already changed.\n\nSo this service asks anyway, and if the answer is no it calls `history.go(1)` to put the history\nback. Two consequences are worth knowing:\n\n- The route you navigated away from can paint for a frame before being restored.\n- Only a **single step** back is reliably recoverable. Pressing Back three times in a row can\n  outrun the recovery.\n\nThe browser's native `confirm` is used on this path and **your `setDialog` dialog is not**, because\na `popstate` handler has to answer synchronously or the browser moves on without it.\n\n### The browser owns the wording on `beforeunload`\n\nEvery current browser ignores any message you set and shows its own text. That is deliberate: a page\nthat could name the consequence could also use it to trick people into staying. Expect \"Changes you\nmade may not be saved.\"\n\nBrowsers also only honour the prompt after the user has interacted with the page at least once.\n\n## Prop Scenarios\n\n:::script label=\"Try to leave with pending work\" expected=\"arm the guard, then use the back button, a link, or reload — each one asks\"\nconst guard = await slice.build('UnsavedChangesGuard', { singleton: true });\nguard.setDialog((message, done) => {\n   done(window.confirm(message));\n});\n\nconst log = document.createElement('p');\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\n\nconst draft = document.createElement('textarea');\ndraft.placeholder = 'Type something, then try to leave the page…';\ndraft.style.cssText = 'width:100%;min-height:80px;padding:8px;font-family:system-ui,sans-serif;font-size:.85rem;border:1px solid var(--medium-color);border-radius:6px;box-sizing:border-box;';\n\nconst setLog = () => {\n   const pending = draft.value.trim().length > 0;\n   log.textContent = pending\n      ? 'Armed — the browser will warn you before you leave.'\n      : 'Not armed — nothing to lose.';\n};\n\ndraft.addEventListener('input', () => {\n   // A form component would do this around its own state.\n   if (draft.value.trim()) guard.arm('demo', { message: 'Your draft has not been saved.' });\n   else guard.disarm('demo');\n   setLog();\n});\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;';\n\nrow.appendChild(await slice.build('Button', {\n   value: 'Save (disarms)',\n   onClick: () => { draft.value = ''; guard.disarm('demo'); setLog(); draft.blur(); },\n}));\nrow.appendChild(await slice.build('Button', {\n   value: 'Go to the Button docs',\n   variant: 'outlined',\n   onClick: () => slice.router.navigate('/docs/input/button'),\n}));\n\nconst wrap = document.createElement('div');\nwrap.appendChild(log);\nwrap.appendChild(row);\nwrap.appendChild(draft);\n\nsetLog();\nmount(wrap);\n:::\n\n## Composing with your own router guard\n\nThe router keeps guards in a **single slot** (`router._beforeEachGuard`), so registering a second one\nreplaces the first. This service composes with whatever was already there at the moment it was built —\nbut an app that registers a guard *afterwards* replaces this one. If that is you, compose explicitly:\n\n```javascript title=\"Your guard, with the unsaved-changes check\"\nslice.router.beforeEach(async (to, from, next) => {\n   if (to.meta?.public) return next();\n\n   // Ours first: if the user declines, your guard must not run either, because\n   // it may redirect somewhere they did not agree to go.\n   if (!(await guard.confirmLeave())) return next();\n\n   return next();\n});\n```\n\n:::warning\nIn Slice.js 4.x, **`next(false)` does not cancel the navigation.** `Router._executeBeforeEachGuard`\nends with `return redirectPath ? { path: redirectPath, … } : null`, and `false` is falsy, so the\ncancellation branch is unreachable — the router proceeds with a warning-free \"success\". If you need to\ncancel a navigation, throw from the guard instead: the router's `catch` returns `{ path: false }`,\nwhich does cancel. `next('/some/path')` redirects correctly and is unaffected.\n\n## Best Practices\n\n:::\n\n:::tip\nDisarm on **save success**, not on save click. Disarming optimistically loses the user's work if the\nsave fails.\n:::\n\n:::tip\nUse a different key per form. Two forms on one page then warn independently, instead of one saving\nsilently switching the other's guard off.\n:::\n\n## Pitfalls\n\n:::warning\nArming is not the same as validating. The guard warns about leaving; it does not check that what the\nuser typed is worth keeping.\n\n:::\n\n:::warning\nDo not arm for trivial state — a collapsed panel, a ticked checkbox, a search filter. A guard that\nfires on things nobody would mourn is a guard the user learns to dismiss without reading, which\ncosts you the warning you wanted for the one case that mattered.\n\n:::\n\n:::warning\n`beforeunload` cannot be styled or worded. If the confirmation must be your own design, you cannot\ncover page close with it — only in-app navigation, through `confirmLeave()` or `setDialog()`.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const guard = slice.getComponent('UnsavedChangesGuard');",
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
               value: "guard.arm('project-form');          // the user starts typing\n// ... on save success:\nguard.disarm('project-form');",
               language: "javascript"
            });
            if ("Arm while editing, disarm when saved") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Arm while editing, disarm when saved";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const lines = ["| Exit | Mechanism | Reliability |","| --- | --- | --- |","| Tab close, reload, leaving the site | `beforeunload` | **Solid.** The browser's own dialog. |","| In-app navigation (`navigate()`, `<slice-link>`) | Router `beforeEach` | **Solid.** |","| Back / forward buttons | `popstate`, intercepted | **Best effort.** See below. |"];
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
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "slice.router.beforeEach(async (to, from, next) => {\n   if (to.meta?.public) return next();\n\n   // Ours first: if the user declines, your guard must not run either, because\n   // it may redirect somewhere they did not agree to go.\n   if (!(await guard.confirmLeave())) return next();\n\n   return next();\n});",
               language: "javascript"
            });
            if ("Your guard, with the unsaved-changes check") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Your guard, with the unsaved-changes check";
               container.appendChild(label);
            }
            container.appendChild(code);
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

customElements.define('slice-unsavedchangesguarddocumentation', UnsavedChangesGuardDocumentation);
