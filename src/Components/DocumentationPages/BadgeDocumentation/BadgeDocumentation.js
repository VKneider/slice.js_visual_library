export default class BadgeDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Semantic variants","expected":"six pills, each in its semantic theme colour","kind":"script","content":"const meanings = [\r\n  ['neutral', 'Archived'],\r\n  ['accent', 'Live'],\r\n  ['success', 'Healthy'],\r\n  ['warning', 'Degraded'],\r\n  ['danger', 'Down'],\r\n  ['info', 'Beta'],\r\n];\r\n\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;';\r\n\r\nfor (const [variant, label] of meanings) {\r\n  row.appendChild(await slice.build('Badge', { variant, label }));\r\n}\r\nreturn row;"},{"label":"Counts","expected":"a count badge, and a capped one","kind":"script","content":"const row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;';\r\n\r\nrow.appendChild(await slice.build('Badge', { variant: 'accent', value: 3 }));\r\nrow.appendChild(await slice.build('Badge', { variant: 'danger', value: 1200 }));\r\nrow.appendChild(await slice.build('Badge', { variant: 'neutral', label: 'New' }));\r\nreturn row;"},{"label":"Size","expected":"the same pill at two sizes","kind":"script","content":"const row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;';\r\n\r\nrow.appendChild(await slice.build('Badge', { variant: 'success', label: 'Healthy', size: 'md' }));\r\nrow.appendChild(await slice.build('Badge', { variant: 'success', label: 'Healthy', size: 'sm' }));\r\nreturn row;"},{"label":"Dot","expected":"a bare dot with an accessible name","kind":"script","content":"const wrap = document.createElement('div');\r\nwrap.style.cssText = 'display:flex;gap:12px;align-items:center;font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);';\r\n\r\nconst badge = await slice.build('Badge', { variant: 'accent', dot: true, label: 'Unread messages' });\r\nwrap.appendChild(badge);\r\nwrap.appendChild(document.createTextNode('a dot carries no text, so it needs a label for screen readers'));\r\nreturn wrap;"}];
  }

  async init() {
    this.markdownPath = "badge.md";
    this.markdownContent = "---\r\ntitle: Badge\r\nroute: /docs/display/badge\r\nnavLabel: Badge\r\nsection: Display\r\ngroup: Basic\r\norder: 25\r\ndescription: Small status pill or count, with semantic variants that follow the theme.\r\ncomponent: BadgeDocumentation\r\ngenerate: true\r\ntags: [badge, pill, status, count, dot]\r\n---\r\n\r\n# Badge\r\n\r\n## Overview\r\n\r\nA `Badge` is a small status pill: a count, a label, or a bare dot. It answers \"what state is this\r\nthing in\" at a glance, next to a list item, a tab, an avatar or a button.\r\n\r\nVariants are **semantic** (`success`, `danger`, `warning`, `info`, `accent`), not decorative, and\r\neach derives from its own theme token — `--success-color`, `--danger-color`, `--warning-color`,\r\n`--info-color`, `--primary-color` — so a badge means the same thing in light and dark without you\r\npicking a colour.\r\n\r\nThe five coloured variants were separated by measurement, not by eye: all ten pairs clear a CIE\r\nΔE of 36 or more, so none of them reads as another. The hues sit in distinct bands — danger 0°,\r\nwarning 32°, success 161°, info 213°, brand 271°.\r\n\r\nVariants are **tinted**, not solid: a soft wash of the status colour, a hairline border, and text in\r\na readable shade of that same colour. A solid fill was measured at 3.19–3.77:1 for white text on the\r\nlighter status colours, under the 4.5:1 AA bar for 12px text, and five saturated fills in a row read\r\nas a traffic light rather than as badges.\r\n\r\n## API\r\n\r\n- `variant` (`neutral` | `accent` | `success` | `warning` | `danger` | `info`, default `neutral`)\r\n- `label` (string) — the text. Doubles as the accessible name when `dot` is set.\r\n- `value` (number | null) — a count. Wins over `label`, and is capped by `max` (`99` → `99+`).\r\n- `max` (number, default `99`) — the cap for `value`.\r\n- `dot` (boolean) — render a bare dot instead of text.\r\n- `size` (`sm` | `md`, default `md`)\r\n\r\n## Prop Scenarios\r\n\r\n:::script label=\"Semantic variants\" expected=\"six pills, each in its semantic theme colour\"\r\nconst meanings = [\r\n  ['neutral', 'Archived'],\r\n  ['accent', 'Live'],\r\n  ['success', 'Healthy'],\r\n  ['warning', 'Degraded'],\r\n  ['danger', 'Down'],\r\n  ['info', 'Beta'],\r\n];\r\n\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;';\r\n\r\nfor (const [variant, label] of meanings) {\r\n  row.appendChild(await slice.build('Badge', { variant, label }));\r\n}\r\nreturn row;\r\n:::\r\n\r\n:::script label=\"Counts\" expected=\"a count badge, and a capped one\"\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;';\r\n\r\nrow.appendChild(await slice.build('Badge', { variant: 'accent', value: 3 }));\r\nrow.appendChild(await slice.build('Badge', { variant: 'danger', value: 1200 }));\r\nrow.appendChild(await slice.build('Badge', { variant: 'neutral', label: 'New' }));\r\nreturn row;\r\n:::\r\n\r\n:::script label=\"Size\" expected=\"the same pill at two sizes\"\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;';\r\n\r\nrow.appendChild(await slice.build('Badge', { variant: 'success', label: 'Healthy', size: 'md' }));\r\nrow.appendChild(await slice.build('Badge', { variant: 'success', label: 'Healthy', size: 'sm' }));\r\nreturn row;\r\n:::\r\n\r\n:::script label=\"Dot\" expected=\"a bare dot with an accessible name\"\r\nconst wrap = document.createElement('div');\r\nwrap.style.cssText = 'display:flex;gap:12px;align-items:center;font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);';\r\n\r\nconst badge = await slice.build('Badge', { variant: 'accent', dot: true, label: 'Unread messages' });\r\nwrap.appendChild(badge);\r\nwrap.appendChild(document.createTextNode('a dot carries no text, so it needs a label for screen readers'));\r\nreturn wrap;\r\n:::\r\n\r\n## Theming\r\n\r\n`Badge` needs one token per status colour beyond the standard palette: a **readable shade**, the\r\nversion of that colour that clears 4.5:1 against its own tint on the current theme's surface.\r\n\r\nThe shade has to move in opposite directions per theme. Light darkens the status colour toward black;\r\ndark **lightens it toward white**, because a dark theme's status colours are already light and\r\ndarkening them produces a mid-tone with no contrast on a dark surface. Getting this wrong is not\r\nsubtle — measured on the wrong direction, five of six variants land between 3.00:1 and 4.05:1 in\r\ndark mode.\r\n\r\nDeclare the shades on `:root`, derived from the status colours you already have:\r\n\r\n```css\r\n:root {\r\n  /* light theme — toward black */\r\n  --primary-color-readable: color-mix(in srgb, var(--primary-color) 88%, #000);\r\n  --success-color-readable: color-mix(in srgb, var(--success-color) 72%, #000);\r\n  --warning-color-readable: color-mix(in srgb, var(--warning-color) 66%, #000);\r\n  --danger-color-readable: color-mix(in srgb, var(--danger-color) 84%, #000);\r\n  --info-color-readable: color-mix(in srgb, var(--info-color) 64%, #000);\r\n}\r\n\r\n:root[data-theme='DARK'] {\r\n  /* dark theme — toward white. One value covers four; info needs 80% because\r\n     this palette's status colours are already light, so a darker blue has to\r\n     separate from them by lightness as well as by hue. */\r\n  --primary-color-readable: color-mix(in srgb, var(--primary-color) 92%, #fff);\r\n  --success-color-readable: color-mix(in srgb, var(--success-color) 92%, #fff);\r\n  --warning-color-readable: color-mix(in srgb, var(--warning-color) 92%, #fff);\r\n  --danger-color-readable: color-mix(in srgb, var(--danger-color) 92%, #fff);\r\n  --info-color-readable: color-mix(in srgb, var(--info-color) 80%, #fff);\r\n}\r\n```\r\n\r\n:::tip\r\nThe `-readable` tokens are **optional for a light theme**. Each `color` in `Badge.css` carries the\r\nlight-tuned value as a fallback, so a theme with only the standard tokens still renders between\r\n4.89:1 and 5.38:1. They are **effectively required for a dark theme**: without them, dark badges fall\r\nto 3.00–4.05:1.\r\n\r\nThat fallback is not belt-and-braces. `slice init` copies the **framework's** `src/`, themes included,\r\nso a new app's theme is `slicejs-web-framework`'s `Light.css` — 21 tokens, and its only shade is\r\n`--primary-color-shade`, a *border* tone. None of the five above are in it.\r\n:::\r\n\r\n:::warning\r\n**`--primary-color-shade` is a different token.** It is a border/surface tone of the brand, used in\r\n~40 declarations across 15 components and Required by the component standards.\r\n`--primary-color-readable` is the *text* tone, for text sitting on a tint. The `-readable` suffix\r\nexists to keep the two apart.\r\n\r\n**There is no `--accent-color`.** It measured at 3° of hue and 1.52:1 from `--secondary-color` — a\r\nduplicate rather than a third colour — and in the wild \"accent\" already means *the brand*, which is\r\n`--primary-color` here. The `accent` **variant** survives and is purple; only the redundant token is\r\ngone.\r\n:::\r\n## Best Practices\r\n\r\n:::tip\r\nOverlaid on a button or an avatar, keep the badge `absolute` in your own layout — `Badge` only\r\nstyles itself, not its position relative to a sibling.\r\n:::\r\n\r\n## Pitfalls\r\n\r\n:::warning\r\nColour alone is not enough of a signal. A `danger` badge next to a `success` one reads differently to\r\neveryone, but only the text tells a colourblind user which is which — keep `label` or `value` set.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: ":root {\r\n  /* light theme — toward black */\r\n  --primary-color-readable: color-mix(in srgb, var(--primary-color) 88%, #000);\r\n  --success-color-readable: color-mix(in srgb, var(--success-color) 72%, #000);\r\n  --warning-color-readable: color-mix(in srgb, var(--warning-color) 66%, #000);\r\n  --danger-color-readable: color-mix(in srgb, var(--danger-color) 84%, #000);\r\n  --info-color-readable: color-mix(in srgb, var(--info-color) 64%, #000);\r\n}\r\n\r\n:root[data-theme='DARK'] {\r\n  /* dark theme — toward white. One value covers four; info needs 80% because\r\n     this palette's status colours are already light, so a darker blue has to\r\n     separate from them by lightness as well as by hue. */\r\n  --primary-color-readable: color-mix(in srgb, var(--primary-color) 92%, #fff);\r\n  --success-color-readable: color-mix(in srgb, var(--success-color) 92%, #fff);\r\n  --warning-color-readable: color-mix(in srgb, var(--warning-color) 92%, #fff);\r\n  --danger-color-readable: color-mix(in srgb, var(--danger-color) 92%, #fff);\r\n  --info-color-readable: color-mix(in srgb, var(--info-color) 80%, #fff);\r\n}\r",
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
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"neutral\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"max\",\"type\":\"number\",\"required\":false,\"default\":\"99\",\"allowedValues\":[]},{\"path\":\"dot\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"neutral\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"max\",\"type\":\"number\",\"required\":false,\"default\":\"99\",\"allowedValues\":[]},{\"path\":\"dot\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]}]}");
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

customElements.define('slice-badgedocumentation', BadgeDocumentation);
