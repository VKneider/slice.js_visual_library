export default class ToolTipDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Placement directions","expected":"four tooltips with different placements","kind":"script","content":"const row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;align-items:center;padding:40px 0;';\r\n\r\nfor (const placement of ['top', 'bottom', 'left', 'right']) {\r\n  const tt = await slice.build('ToolTip', {\r\n    text: `${placement} tooltip`,\r\n    placement\r\n  });\r\n  tt.textContent = placement;\r\n  row.appendChild(tt);\r\n}\r\n\r\nreturn row;"},{"label":"Show delay (200ms)","expected":"tooltip appears after a short wait","kind":"script","content":"const tt = await slice.build('ToolTip', {\r\n  text: 'Appears after 200ms',\r\n  showDelay: 200\r\n});\r\ntt.textContent = 'Hover me slowly';\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Move cursor over the text and hold — the tooltip waits 200ms before appearing.';\r\nnote.style.marginTop = '0';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(tt);\r\nreturn wrapper;"},{"label":"Hide delay (400ms)","expected":"tooltip stays visible briefly after cursor leaves","kind":"script","content":"const tt = await slice.build('ToolTip', {\r\n  text: 'Stays 400ms after you leave',\r\n  hideDelay: 400\r\n});\r\ntt.textContent = 'Hover then move away quickly';\r\n\r\nconst hint = document.createElement('p');\r\nhint.textContent = 'The bubble fades out slowly — good for reading longer hints.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(hint);\r\nwrapper.appendChild(tt);\r\nreturn wrapper;"},{"label":"Auto fallback near edge","expected":"tooltip flips above or below when side has no space","kind":"script","content":"const trigger = await slice.build('ToolTip', {\r\n  text: 'Flipped to fit in viewport — the tooltip avoids clipping automatically.',\r\n  placement: 'left'\r\n});\r\ntrigger.textContent = 'Hover (near edge)';\r\n\r\nconst container = document.createElement('div');\r\ncontainer.style.cssText = 'display:flex;justify-content:flex-end;padding:20px;';\r\ncontainer.appendChild(trigger);\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'This tooltip requests placement=left but since there is no room it falls back to a visible side.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(container);\r\nreturn wrapper;"},{"label":"Focus trigger (keyboard)","expected":"tooltip appears when trigger receives focus","kind":"script","content":"const tt = await slice.build('ToolTip', {\r\n  text: 'Appears on focus — try tabbing to this element.'\r\n});\r\ntt.textContent = 'Focus me (tab key)';\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'The tooltip activates on focusin (keyboard) just like mouseenter. Press Escape or click outside to close.';\r\nnote.style.marginTop = '0';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(tt);\r\nreturn wrapper;"},{"label":"Long text with maxWidth","expected":"tooltip wraps text within 180px","kind":"script","content":"const tt = await slice.build('ToolTip', {\r\n  text: 'This is a longer description that wraps to multiple lines at 180px',\r\n  maxWidth: 180\r\n});\r\ntt.textContent = 'Narrow tooltip';\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'The bubble is capped at 180px wide so long text wraps.';\r\nnote.style.marginTop = '0';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(tt);\r\nreturn wrapper;"},{"label":"Tight offset (4px)","expected":"bubble appears close to trigger","kind":"script","content":"const tt = await slice.build('ToolTip', {\r\n  text: 'Tight spacing',\r\n  offset: 4\r\n});\r\ntt.textContent = 'Hover (4px gap)';\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Offset of 4px places the bubble very close to the trigger.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(tt);\r\nreturn wrapper;"},{"label":"Hover tooltip","expected":"tooltip appears on hover over trigger text","kind":"script","content":"const tooltip = await slice.build('ToolTip', {\r\n  text: 'This is a tooltip'\r\n});\r\n\r\ntooltip.textContent = 'Hover over this text';\r\n\r\nreturn tooltip;"},{"label":"Tooltip with button trigger","expected":"tooltip wraps a button element","kind":"script","content":"const tooltip = await slice.build('ToolTip', {\r\n  text: 'Click to confirm'\r\n});\r\n\r\nconst button = await slice.build('Button', {\r\n  value: 'Submit'\r\n});\r\n\r\ntooltip.appendChild(button);\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(tooltip);\r\nreturn host;"},{"label":"Empty text suppresses tooltip","expected":"no bubble appears on hover","kind":"script","content":"const tooltip = await slice.build('ToolTip', {\r\n  text: ''\r\n});\r\n\r\ntooltip.textContent = 'Hover me (no tooltip)';\r\n\r\nreturn tooltip;"},{"label":"Toolbar with icon buttons","expected":"multiple tooltips in a toolbar row","kind":"script","content":"const icons = [\r\n  { name: 'search', label: 'Search documents' },\r\n  { name: 'download', label: 'Download report' },\r\n  { name: 'share-nodes', label: 'Share with team' },\r\n  { name: 'trash-bin', label: 'Delete item' }\r\n];\r\n\r\nconst toolbar = document.createElement('div');\r\ntoolbar.style.cssText = 'display:flex;gap:6px;padding:8px 12px;border:1px solid var(--outline-primary);border-radius:8px;width:fit-content;';\r\n\r\nfor (const item of icons) {\r\n  const icon = await slice.build('Icon', { name: item.name, iconStyle: 'filled', size: '18px' });\r\n  const tt = await slice.build('ToolTip', {\r\n    text: item.label,\r\n    placement: 'bottom',\r\n    hideDelay: 200\r\n  });\r\n  tt.appendChild(icon);\r\n  toolbar.appendChild(tt);\r\n}\r\n\r\nconst label = document.createElement('p');\r\nlabel.textContent = 'Common UI pattern: icon toolbar with bottom tooltips and a short hideDelay for smooth transitions.';\r\nlabel.style.marginTop = '0';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(label);\r\nwrapper.appendChild(toolbar);\r\nreturn wrapper;"},{"label":"Custom color tooltip","expected":"tooltip with purple background and white text","kind":"script","content":"const tt = await slice.build('ToolTip', {\r\n  text: 'Branded tooltip',\r\n  customColor: { background: '#7c3aed', text: '#ffffff' }\r\n});\r\ntt.textContent = 'Hover for purple tooltip';\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Use customColor to match your brand palette.';\r\nnote.style.marginTop = '0';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(tt);\r\nreturn wrapper;"}];
  }

  async init() {
    this.markdownPath = "tooltip.md";
    this.markdownContent = "---\r\ntitle: ToolTip\r\nroute: /docs/display/tooltip\r\nnavLabel: ToolTip\r\nsection: Display\r\ngroup: Overlay\r\norder: 10\r\ndescription: ToolTip documentation with hover, focus, placement, and delay scenarios.\r\ncomponent: ToolTipDocumentation\r\ngenerate: true\r\ntags: [tooltip, overlay, display]\r\n---\r\n\r\n# ToolTip\r\n\r\n## Overview\r\n`ToolTip` displays a floating text label when the user hovers or focuses the wrapped content. The tooltip repositions itself to stay within the viewport and falls back to alternative placements when space is limited.\r\n\r\n## Core Behavior\r\n- `text` sets the tooltip string. Empty text suppresses the tooltip entirely.\r\n- Triggered by `mouseenter` / `mouseleave` and `focusin` / `focusout` (keyboard accessible).\r\n- `placement` controls preferred direction (`top`, `bottom`, `left`, `right`); the tooltip auto-falls back to other sides if the viewport doesn't fit.\r\n- `showDelay` / `hideDelay` add an intent delay for smoother hover experience.\r\n- `offset` controls gap between trigger and bubble (min `4px`).\r\n- `maxWidth` limits the bubble width (min `120px`).\r\n- `customColor` accepts `{ background, text }` to override the default theme tokens.\r\n- `Escape` key or clicking outside dismisses the bubble.\r\n- Bubble is appended to `document.body` for accurate positioning.\r\n- Sets `aria-describedby` on the host pointing to the bubble `id` when visible.\r\n\r\n## Live Preview\r\n:::component name=\"ToolTip\"\r\n{\r\n  \"text\": \"Save your work before leaving\"\r\n}\r\n:::\r\n\r\n## Placement Variants\r\nUse `placement` to control where the bubble appears. The component automatically tries fallback positions when the preferred side has no room.\r\n\r\n:::script label=\"Placement directions\" expected=\"four tooltips with different placements\"\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;align-items:center;padding:40px 0;';\r\n\r\nfor (const placement of ['top', 'bottom', 'left', 'right']) {\r\n  const tt = await slice.build('ToolTip', {\r\n    text: `${placement} tooltip`,\r\n    placement\r\n  });\r\n  tt.textContent = placement;\r\n  row.appendChild(tt);\r\n}\r\n\r\nreturn row;\r\n:::\r\n\r\n## Delay for Intent\r\nUse `showDelay` to prevent flicker when the cursor passes over a trigger briefly. `hideDelay` keeps the bubble visible while moving between related triggers.\r\n\r\n:::script label=\"Show delay (200ms)\" expected=\"tooltip appears after a short wait\"\r\nconst tt = await slice.build('ToolTip', {\r\n  text: 'Appears after 200ms',\r\n  showDelay: 200\r\n});\r\ntt.textContent = 'Hover me slowly';\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Move cursor over the text and hold — the tooltip waits 200ms before appearing.';\r\nnote.style.marginTop = '0';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(tt);\r\nreturn wrapper;\r\n:::\r\n\r\n:::script label=\"Hide delay (400ms)\" expected=\"tooltip stays visible briefly after cursor leaves\"\r\nconst tt = await slice.build('ToolTip', {\r\n  text: 'Stays 400ms after you leave',\r\n  hideDelay: 400\r\n});\r\ntt.textContent = 'Hover then move away quickly';\r\n\r\nconst hint = document.createElement('p');\r\nhint.textContent = 'The bubble fades out slowly — good for reading longer hints.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(hint);\r\nwrapper.appendChild(tt);\r\nreturn wrapper;\r\n:::\r\n\r\n## Auto-Placement Fallback\r\nWhen the preferred `placement` has no room, the tooltip automatically falls back to the next available side.\r\n\r\n:::script label=\"Auto fallback near edge\" expected=\"tooltip flips above or below when side has no space\"\r\nconst trigger = await slice.build('ToolTip', {\r\n  text: 'Flipped to fit in viewport — the tooltip avoids clipping automatically.',\r\n  placement: 'left'\r\n});\r\ntrigger.textContent = 'Hover (near edge)';\r\n\r\nconst container = document.createElement('div');\r\ncontainer.style.cssText = 'display:flex;justify-content:flex-end;padding:20px;';\r\ncontainer.appendChild(trigger);\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'This tooltip requests placement=left but since there is no room it falls back to a visible side.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(container);\r\nreturn wrapper;\r\n:::\r\n\r\n## Keyboard & Dismiss\r\nThe tooltip is fully keyboard accessible and respects common dismiss patterns.\r\n\r\n:::script label=\"Focus trigger (keyboard)\" expected=\"tooltip appears when trigger receives focus\"\r\nconst tt = await slice.build('ToolTip', {\r\n  text: 'Appears on focus — try tabbing to this element.'\r\n});\r\ntt.textContent = 'Focus me (tab key)';\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'The tooltip activates on focusin (keyboard) just like mouseenter. Press Escape or click outside to close.';\r\nnote.style.marginTop = '0';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(tt);\r\nreturn wrapper;\r\n:::\r\n\r\n## Custom Width and Offset\r\n`maxWidth` controls how wide the bubble can grow (default `300px`). `offset` tightens or increases the gap between trigger and bubble (minimum `4px`).\r\n\r\n:::script label=\"Long text with maxWidth\" expected=\"tooltip wraps text within 180px\"\r\nconst tt = await slice.build('ToolTip', {\r\n  text: 'This is a longer description that wraps to multiple lines at 180px',\r\n  maxWidth: 180\r\n});\r\ntt.textContent = 'Narrow tooltip';\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'The bubble is capped at 180px wide so long text wraps.';\r\nnote.style.marginTop = '0';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(tt);\r\nreturn wrapper;\r\n:::\r\n\r\n:::script label=\"Tight offset (4px)\" expected=\"bubble appears close to trigger\"\r\nconst tt = await slice.build('ToolTip', {\r\n  text: 'Tight spacing',\r\n  offset: 4\r\n});\r\ntt.textContent = 'Hover (4px gap)';\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Offset of 4px places the bubble very close to the trigger.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(tt);\r\nreturn wrapper;\r\n:::\r\n\r\n## Prop Scenarios\r\n:::script label=\"Hover tooltip\" expected=\"tooltip appears on hover over trigger text\"\r\nconst tooltip = await slice.build('ToolTip', {\r\n  text: 'This is a tooltip'\r\n});\r\n\r\ntooltip.textContent = 'Hover over this text';\r\n\r\nreturn tooltip;\r\n:::\r\n\r\n:::script label=\"Tooltip with button trigger\" expected=\"tooltip wraps a button element\"\r\nconst tooltip = await slice.build('ToolTip', {\r\n  text: 'Click to confirm'\r\n});\r\n\r\nconst button = await slice.build('Button', {\r\n  value: 'Submit'\r\n});\r\n\r\ntooltip.appendChild(button);\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(tooltip);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"Empty text suppresses tooltip\" expected=\"no bubble appears on hover\"\r\nconst tooltip = await slice.build('ToolTip', {\r\n  text: ''\r\n});\r\n\r\ntooltip.textContent = 'Hover me (no tooltip)';\r\n\r\nreturn tooltip;\r\n:::\r\n\r\n:::script label=\"Toolbar with icon buttons\" expected=\"multiple tooltips in a toolbar row\"\r\nconst icons = [\r\n  { name: 'search', label: 'Search documents' },\r\n  { name: 'download', label: 'Download report' },\r\n  { name: 'share-nodes', label: 'Share with team' },\r\n  { name: 'trash-bin', label: 'Delete item' }\r\n];\r\n\r\nconst toolbar = document.createElement('div');\r\ntoolbar.style.cssText = 'display:flex;gap:6px;padding:8px 12px;border:1px solid var(--outline-primary);border-radius:8px;width:fit-content;';\r\n\r\nfor (const item of icons) {\r\n  const icon = await slice.build('Icon', { name: item.name, iconStyle: 'filled', size: '18px' });\r\n  const tt = await slice.build('ToolTip', {\r\n    text: item.label,\r\n    placement: 'bottom',\r\n    hideDelay: 200\r\n  });\r\n  tt.appendChild(icon);\r\n  toolbar.appendChild(tt);\r\n}\r\n\r\nconst label = document.createElement('p');\r\nlabel.textContent = 'Common UI pattern: icon toolbar with bottom tooltips and a short hideDelay for smooth transitions.';\r\nlabel.style.marginTop = '0';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(label);\r\nwrapper.appendChild(toolbar);\r\nreturn wrapper;\r\n:::\r\n\r\n:::script label=\"Custom color tooltip\" expected=\"tooltip with purple background and white text\"\r\nconst tt = await slice.build('ToolTip', {\r\n  text: 'Branded tooltip',\r\n  customColor: { background: '#7c3aed', text: '#ffffff' }\r\n});\r\ntt.textContent = 'Hover for purple tooltip';\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Use customColor to match your brand palette.';\r\nnote.style.marginTop = '0';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(tt);\r\nreturn wrapper;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nPair tooltips with interactive elements (icon buttons, truncated text, input labels) to provide contextual hints without cluttering the UI. Use `hideDelay` (300–500ms) when tooltips contain multi-line content so users have time to read.\r\n:::\r\n\r\n## ToolTipProvider\r\nFor pages with many tooltips (toolbars, data tables, icon grids), use [`ToolTipProvider`](/docs/services/tooltip-provider) — a singleton Service that shares one bubble and one set of listeners across all triggers via a programmatic or `data-tooltip` API.\r\n\r\n## Pitfalls\r\n:::warning\r\nThe tooltip bubble is appended to `document.body` — ensure `z-index: 10000` does not conflict with other overlays. For critical information, prefer visible labels instead of tooltips.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"text\": \"Save your work before leaving\"\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"text\": \"Save your work before leaving\"\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('ToolTip', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-14"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"text\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"placement\",\"type\":\"string\",\"required\":false,\"default\":\"top\",\"allowedValues\":[]},{\"path\":\"offset\",\"type\":\"number\",\"required\":false,\"default\":\"10\",\"allowedValues\":[]},{\"path\":\"maxWidth\",\"type\":\"number\",\"required\":false,\"default\":\"300\",\"allowedValues\":[]},{\"path\":\"showDelay\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"hideDelay\",\"type\":\"number\",\"required\":false,\"default\":\"120\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"text\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"placement\",\"type\":\"string\",\"required\":false,\"default\":\"top\",\"allowedValues\":[]},{\"path\":\"offset\",\"type\":\"number\",\"required\":false,\"default\":\"10\",\"allowedValues\":[]},{\"path\":\"maxWidth\",\"type\":\"number\",\"required\":false,\"default\":\"300\",\"allowedValues\":[]},{\"path\":\"showDelay\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"hideDelay\",\"type\":\"number\",\"required\":false,\"default\":\"120\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-tooltipdocumentation', ToolTipDocumentation);
