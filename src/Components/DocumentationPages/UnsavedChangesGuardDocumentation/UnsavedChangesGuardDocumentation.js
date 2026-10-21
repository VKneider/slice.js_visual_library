export default class UnsavedChangesGuardDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Try to leave with pending work","expected":"arm the guard, then use the back button, a link, or reload — each one asks","kind":"script","content":"const guard = await slice.build('UnsavedChangesGuard', { singleton: true });\r\nguard.setDialog((message, done) => {\r\n   done(window.confirm(message));\r\n});\r\n\r\nconst log = document.createElement('p');\r\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\r\n\r\nconst draft = document.createElement('textarea');\r\ndraft.placeholder = 'Type something, then try to leave the page…';\r\ndraft.style.cssText = 'width:100%;min-height:80px;padding:8px;font-family:system-ui,sans-serif;font-size:.85rem;border:1px solid var(--medium-color);border-radius:6px;box-sizing:border-box;';\r\n\r\nconst setLog = () => {\r\n   const pending = draft.value.trim().length > 0;\r\n   log.textContent = pending\r\n      ? 'Armed — the browser will warn you before you leave.'\r\n      : 'Not armed — nothing to lose.';\r\n};\r\n\r\ndraft.addEventListener('input', () => {\r\n   // A form component would do this around its own state.\r\n   if (draft.value.trim()) guard.arm('demo', { message: 'Your draft has not been saved.' });\r\n   else guard.disarm('demo');\r\n   setLog();\r\n});\r\n\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;';\r\n\r\nrow.appendChild(await slice.build('Button', {\r\n   value: 'Save (disarms)',\r\n   onClick: () => { draft.value = ''; guard.disarm('demo'); setLog(); draft.blur(); },\r\n}));\r\nrow.appendChild(await slice.build('Button', {\r\n   value: 'Go to the Button docs',\r\n   variant: 'outlined',\r\n   onClick: () => slice.router.navigate('/docs/input/button'),\r\n}));\r\n\r\nconst wrap = document.createElement('div');\r\nwrap.appendChild(log);\r\nwrap.appendChild(row);\r\nwrap.appendChild(draft);\r\n\r\nsetLog();\r\nmount(wrap);"}];
  }

  async init() {
    this.markdownPath = "unsaved-changes-guard.md";
    this.markdownContent = "---\r\ntitle: UnsavedChangesGuard\r\nroute: /docs/services/unsaved-changes-guard\r\nnavLabel: UnsavedChangesGuard\r\nsection: Services\r\ngroup: Security\r\norder: 13\r\ndescription: Warns before the user throws away work in progress — tab close, in-app navigation, or the back button.\r\ncomponent: UnsavedChangesGuardDocumentation\r\ngenerate: true\r\ntags: [service, unsaved, guard, navigation, beforeunload, confirm, dirty]\r\n---\r\n\r\n# UnsavedChangesGuard\r\n\r\n## Overview\r\n\r\nThe \"you have unsaved changes\" guard. Any component can declare pending work with a stable key, and\r\nthe guard covers the three ways a user can walk away from it.\r\n\r\n```javascript title=\"Build it once\"\r\nconst guard = slice.getComponent('UnsavedChangesGuard');\r\n```\r\n\r\n```javascript title=\"Arm while editing, disarm when saved\"\r\nguard.arm('project-form');          // the user starts typing\r\n// ... on save success:\r\nguard.disarm('project-form');\r\n```\r\n\r\n## API\r\n\r\n- `arm(key = 'default', { message })` — declare pending work.\r\n- `disarm(key = 'default')` — the work is saved or deliberately abandoned.\r\n- `isArmed` / `pendingCount` — what is currently holding the guard.\r\n- `confirmLeave(message?) -> Promise<boolean>` — ask by hand, for anything the built-in exits miss.\r\n- `guardFn(to, from, next)` — the router guard body, if you want to compose it yourself.\r\n- `setDialog(fn)` — replace the browser `confirm` with your own dialog.\r\n- `destroy()` — release everything and detach the listeners.\r\n\r\nArms are **reference-counted by key**: `arm('editor')` twice is still one holder, and two different\r\nkeys need two `disarm` calls. A component that re-arms on every render therefore cannot lock the\r\nuser out of the page.\r\n\r\n## The three exits, and why they are not equally reliable\r\n\r\n| Exit | Mechanism | Reliability |\r\n| --- | --- | --- |\r\n| Tab close, reload, leaving the site | `beforeunload` | **Solid.** The browser's own dialog. |\r\n| In-app navigation (`navigate()`, `<slice-link>`) | Router `beforeEach` | **Solid.** |\r\n| Back / forward buttons | `popstate`, intercepted | **Best effort.** See below. |\r\n\r\n### The back button is best effort, and cannot be otherwise\r\n\r\nThe router does **not** run `beforeEach` on `popstate` — `Router.onRouteChange()` goes straight to\r\nrendering. By the time the event reaches you, the URL has already changed.\r\n\r\nSo this service asks anyway, and if the answer is no it calls `history.go(1)` to put the history\r\nback. Two consequences are worth knowing:\r\n\r\n- The route you navigated away from can paint for a frame before being restored.\r\n- Only a **single step** back is reliably recoverable. Pressing Back three times in a row can\r\n  outrun the recovery.\r\n\r\nThe browser's native `confirm` is used on this path and **your `setDialog` dialog is not**, because\r\na `popstate` handler has to answer synchronously or the browser moves on without it.\r\n\r\n### The browser owns the wording on `beforeunload`\r\n\r\nEvery current browser ignores any message you set and shows its own text. That is deliberate: a page\r\nthat could name the consequence could also use it to trick people into staying. Expect \"Changes you\r\nmade may not be saved.\"\r\n\r\nBrowsers also only honour the prompt after the user has interacted with the page at least once.\r\n\r\n## Prop Scenarios\r\n\r\n:::script label=\"Try to leave with pending work\" expected=\"arm the guard, then use the back button, a link, or reload — each one asks\"\r\nconst guard = await slice.build('UnsavedChangesGuard', { singleton: true });\r\nguard.setDialog((message, done) => {\r\n   done(window.confirm(message));\r\n});\r\n\r\nconst log = document.createElement('p');\r\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.85rem;color:var(--font-secondary-color);margin:0 0 10px;';\r\n\r\nconst draft = document.createElement('textarea');\r\ndraft.placeholder = 'Type something, then try to leave the page…';\r\ndraft.style.cssText = 'width:100%;min-height:80px;padding:8px;font-family:system-ui,sans-serif;font-size:.85rem;border:1px solid var(--medium-color);border-radius:6px;box-sizing:border-box;';\r\n\r\nconst setLog = () => {\r\n   const pending = draft.value.trim().length > 0;\r\n   log.textContent = pending\r\n      ? 'Armed — the browser will warn you before you leave.'\r\n      : 'Not armed — nothing to lose.';\r\n};\r\n\r\ndraft.addEventListener('input', () => {\r\n   // A form component would do this around its own state.\r\n   if (draft.value.trim()) guard.arm('demo', { message: 'Your draft has not been saved.' });\r\n   else guard.disarm('demo');\r\n   setLog();\r\n});\r\n\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;';\r\n\r\nrow.appendChild(await slice.build('Button', {\r\n   value: 'Save (disarms)',\r\n   onClick: () => { draft.value = ''; guard.disarm('demo'); setLog(); draft.blur(); },\r\n}));\r\nrow.appendChild(await slice.build('Button', {\r\n   value: 'Go to the Button docs',\r\n   variant: 'outlined',\r\n   onClick: () => slice.router.navigate('/docs/input/button'),\r\n}));\r\n\r\nconst wrap = document.createElement('div');\r\nwrap.appendChild(log);\r\nwrap.appendChild(row);\r\nwrap.appendChild(draft);\r\n\r\nsetLog();\r\nmount(wrap);\r\n:::\r\n\r\n## Composing with your own router guard\r\n\r\nThe router keeps guards in a **single slot** (`router._beforeEachGuard`), so registering a second one\r\nreplaces the first. This service composes with whatever was already there at the moment it was built —\r\nbut an app that registers a guard *afterwards* replaces this one. If that is you, compose explicitly:\r\n\r\n```javascript title=\"Your guard, with the unsaved-changes check\"\r\nslice.router.beforeEach(async (to, from, next) => {\r\n   if (to.meta?.public) return next();\r\n\r\n   // Ours first: if the user declines, your guard must not run either, because\r\n   // it may redirect somewhere they did not agree to go.\r\n   if (!(await guard.confirmLeave())) return next();\r\n\r\n   return next();\r\n});\r\n```\r\n\r\n:::warning\r\nIn Slice.js 4.x, **`next(false)` does not cancel the navigation.** `Router._executeBeforeEachGuard`\r\nends with `return redirectPath ? { path: redirectPath, … } : null`, and `false` is falsy, so the\r\ncancellation branch is unreachable — the router proceeds with a warning-free \"success\". If you need to\r\ncancel a navigation, throw from the guard instead: the router's `catch` returns `{ path: false }`,\r\nwhich does cancel. `next('/some/path')` redirects correctly and is unaffected.\r\n\r\n## Best Practices\r\n\r\n:::\r\n\r\n:::tip\r\nDisarm on **save success**, not on save click. Disarming optimistically loses the user's work if the\r\nsave fails.\r\n:::\r\n\r\n:::tip\r\nUse a different key per form. Two forms on one page then warn independently, instead of one saving\r\nsilently switching the other's guard off.\r\n:::\r\n\r\n## Pitfalls\r\n\r\n:::warning\r\nArming is not the same as validating. The guard warns about leaving; it does not check that what the\r\nuser typed is worth keeping.\r\n\r\n:::\r\n\r\n:::warning\r\nDo not arm for trivial state — a collapsed panel, a ticked checkbox, a search filter. A guard that\r\nfires on things nobody would mourn is a guard the user learns to dismiss without reading, which\r\ncosts you the warning you wanted for the one case that mattered.\r\n\r\n:::\r\n\r\n:::warning\r\n`beforeunload` cannot be styled or worded. If the confirmation must be your own design, you cannot\r\ncover page close with it — only in-app navigation, through `confirmLeave()` or `setDialog()`.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const guard = slice.getComponent('UnsavedChangesGuard');\r",
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
               value: "guard.arm('project-form');          // the user starts typing\r\n// ... on save success:\r\nguard.disarm('project-form');\r",
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
            const lines = ["| Exit | Mechanism | Reliability |\r","| --- | --- | --- |\r","| Tab close, reload, leaving the site | `beforeunload` | **Solid.** The browser's own dialog. |\r","| In-app navigation (`navigate()`, `<slice-link>`) | Router `beforeEach` | **Solid.** |\r","| Back / forward buttons | `popstate`, intercepted | **Best effort.** See below. |\r"];
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
               value: "slice.router.beforeEach(async (to, from, next) => {\r\n   if (to.meta?.public) return next();\r\n\r\n   // Ours first: if the user declines, your guard must not run either, because\r\n   // it may redirect somewhere they did not agree to go.\r\n   if (!(await guard.confirmLeave())) return next();\r\n\r\n   return next();\r\n});\r",
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

customElements.define('slice-unsavedchangesguarddocumentation', UnsavedChangesGuardDocumentation);
