export default class ToolTipDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Placement directions","expected":"four tooltips with different placements","kind":"script","content":"const row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;align-items:center;padding:40px 0;';\n\nfor (const placement of ['top', 'bottom', 'left', 'right']) {\n  const tt = await slice.build('ToolTip', {\n    text: `${placement} tooltip`,\n    placement\n  });\n  tt.textContent = placement;\n  row.appendChild(tt);\n}\n\nreturn row;"},{"label":"Show delay (200ms)","expected":"tooltip appears after a short wait","kind":"script","content":"const tt = await slice.build('ToolTip', {\n  text: 'Appears after 200ms',\n  showDelay: 200\n});\ntt.textContent = 'Hover me slowly';\n\nconst note = document.createElement('p');\nnote.textContent = 'Move cursor over the text and hold — the tooltip waits 200ms before appearing.';\nnote.style.marginTop = '0';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(tt);\nreturn wrapper;"},{"label":"Hide delay (400ms)","expected":"tooltip stays visible briefly after cursor leaves","kind":"script","content":"const tt = await slice.build('ToolTip', {\n  text: 'Stays 400ms after you leave',\n  hideDelay: 400\n});\ntt.textContent = 'Hover then move away quickly';\n\nconst hint = document.createElement('p');\nhint.textContent = 'The bubble fades out slowly — good for reading longer hints.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(hint);\nwrapper.appendChild(tt);\nreturn wrapper;"},{"label":"Auto fallback near edge","expected":"tooltip flips above or below when side has no space","kind":"script","content":"const trigger = await slice.build('ToolTip', {\n  text: 'Flipped to fit in viewport — the tooltip avoids clipping automatically.',\n  placement: 'left'\n});\ntrigger.textContent = 'Hover (near edge)';\n\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:flex;justify-content:flex-end;padding:20px;';\ncontainer.appendChild(trigger);\n\nconst note = document.createElement('p');\nnote.textContent = 'This tooltip requests placement=left but since there is no room it falls back to a visible side.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(container);\nreturn wrapper;"},{"label":"Focus trigger (keyboard)","expected":"tooltip appears when trigger receives focus","kind":"script","content":"const tt = await slice.build('ToolTip', {\n  text: 'Appears on focus — try tabbing to this element.'\n});\ntt.textContent = 'Focus me (tab key)';\n\nconst note = document.createElement('p');\nnote.textContent = 'The tooltip activates on focusin (keyboard) just like mouseenter. Press Escape or click outside to close.';\nnote.style.marginTop = '0';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(tt);\nreturn wrapper;"},{"label":"Long text with maxWidth","expected":"tooltip wraps text within 180px","kind":"script","content":"const tt = await slice.build('ToolTip', {\n  text: 'This is a longer description that wraps to multiple lines at 180px',\n  maxWidth: 180\n});\ntt.textContent = 'Narrow tooltip';\n\nconst note = document.createElement('p');\nnote.textContent = 'The bubble is capped at 180px wide so long text wraps.';\nnote.style.marginTop = '0';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(tt);\nreturn wrapper;"},{"label":"Tight offset (4px)","expected":"bubble appears close to trigger","kind":"script","content":"const tt = await slice.build('ToolTip', {\n  text: 'Tight spacing',\n  offset: 4\n});\ntt.textContent = 'Hover (4px gap)';\n\nconst note = document.createElement('p');\nnote.textContent = 'Offset of 4px places the bubble very close to the trigger.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(tt);\nreturn wrapper;"},{"label":"Hover tooltip","expected":"tooltip appears on hover over trigger text","kind":"script","content":"const tooltip = await slice.build('ToolTip', {\n  text: 'This is a tooltip'\n});\n\ntooltip.textContent = 'Hover over this text';\n\nreturn tooltip;"},{"label":"Tooltip with button trigger","expected":"tooltip wraps a button element","kind":"script","content":"const tooltip = await slice.build('ToolTip', {\n  text: 'Click to confirm'\n});\n\nconst button = await slice.build('Button', {\n  value: 'Submit'\n});\n\ntooltip.appendChild(button);\n\nconst host = document.createElement('div');\nhost.appendChild(tooltip);\nreturn host;"},{"label":"Empty text suppresses tooltip","expected":"no bubble appears on hover","kind":"script","content":"const tooltip = await slice.build('ToolTip', {\n  text: ''\n});\n\ntooltip.textContent = 'Hover me (no tooltip)';\n\nreturn tooltip;"},{"label":"Toolbar with icon buttons","expected":"multiple tooltips in a toolbar row","kind":"script","content":"const icons = [\n  { name: 'search', label: 'Search documents' },\n  { name: 'download', label: 'Download report' },\n  { name: 'share-nodes', label: 'Share with team' },\n  { name: 'trash-bin', label: 'Delete item' }\n];\n\nconst toolbar = document.createElement('div');\ntoolbar.style.cssText = 'display:flex;gap:6px;padding:8px 12px;border:1px solid var(--outline-primary);border-radius:8px;width:fit-content;';\n\nfor (const item of icons) {\n  const icon = await slice.build('Icon', { name: item.name, iconStyle: 'filled', size: '18px' });\n  const tt = await slice.build('ToolTip', {\n    text: item.label,\n    placement: 'bottom',\n    hideDelay: 200\n  });\n  tt.appendChild(icon);\n  toolbar.appendChild(tt);\n}\n\nconst label = document.createElement('p');\nlabel.textContent = 'Common UI pattern: icon toolbar with bottom tooltips and a short hideDelay for smooth transitions.';\nlabel.style.marginTop = '0';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(label);\nwrapper.appendChild(toolbar);\nreturn wrapper;"},{"label":"Custom color tooltip","expected":"tooltip with purple background and white text","kind":"script","content":"const tt = await slice.build('ToolTip', {\n  text: 'Branded tooltip',\n  customColor: { background: '#7c3aed', text: '#ffffff' }\n});\ntt.textContent = 'Hover for purple tooltip';\n\nconst note = document.createElement('p');\nnote.textContent = 'Use customColor to match your brand palette.';\nnote.style.marginTop = '0';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(tt);\nreturn wrapper;"}];
  }

  async init() {
    this.markdownPath = "tooltip.md";
    this.markdownContent = "---\ntitle: ToolTip\nroute: /docs/display/tooltip\nnavLabel: ToolTip\nsection: Display\ngroup: Overlay\norder: 10\ndescription: ToolTip documentation with hover, focus, placement, and delay scenarios.\ncomponent: ToolTipDocumentation\ngenerate: true\ntags: [tooltip, overlay, display]\n---\n\n# ToolTip\n\n## Overview\n`ToolTip` displays a floating text label when the user hovers or focuses the wrapped content. The tooltip repositions itself to stay within the viewport and falls back to alternative placements when space is limited.\n\n## Core Behavior\n- `text` sets the tooltip string. Empty text suppresses the tooltip entirely.\n- Triggered by `mouseenter` / `mouseleave` and `focusin` / `focusout` (keyboard accessible).\n- `placement` controls preferred direction (`top`, `bottom`, `left`, `right`); the tooltip auto-falls back to other sides if the viewport doesn't fit.\n- `showDelay` / `hideDelay` add an intent delay for smoother hover experience.\n- `offset` controls gap between trigger and bubble (min `4px`).\n- `maxWidth` limits the bubble width (min `120px`).\n- `customColor` accepts `{ background, text }` to override the default theme tokens.\n- `Escape` key or clicking outside dismisses the bubble.\n- Bubble is appended to `document.body` for accurate positioning.\n- Sets `aria-describedby` on the host pointing to the bubble `id` when visible.\n\n## Live Preview\n:::component name=\"ToolTip\"\n{\n  \"text\": \"Save your work before leaving\"\n}\n:::\n\n## Placement Variants\nUse `placement` to control where the bubble appears. The component automatically tries fallback positions when the preferred side has no room.\n\n:::script label=\"Placement directions\" expected=\"four tooltips with different placements\"\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;align-items:center;padding:40px 0;';\n\nfor (const placement of ['top', 'bottom', 'left', 'right']) {\n  const tt = await slice.build('ToolTip', {\n    text: `${placement} tooltip`,\n    placement\n  });\n  tt.textContent = placement;\n  row.appendChild(tt);\n}\n\nreturn row;\n:::\n\n## Delay for Intent\nUse `showDelay` to prevent flicker when the cursor passes over a trigger briefly. `hideDelay` keeps the bubble visible while moving between related triggers.\n\n:::script label=\"Show delay (200ms)\" expected=\"tooltip appears after a short wait\"\nconst tt = await slice.build('ToolTip', {\n  text: 'Appears after 200ms',\n  showDelay: 200\n});\ntt.textContent = 'Hover me slowly';\n\nconst note = document.createElement('p');\nnote.textContent = 'Move cursor over the text and hold — the tooltip waits 200ms before appearing.';\nnote.style.marginTop = '0';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(tt);\nreturn wrapper;\n:::\n\n:::script label=\"Hide delay (400ms)\" expected=\"tooltip stays visible briefly after cursor leaves\"\nconst tt = await slice.build('ToolTip', {\n  text: 'Stays 400ms after you leave',\n  hideDelay: 400\n});\ntt.textContent = 'Hover then move away quickly';\n\nconst hint = document.createElement('p');\nhint.textContent = 'The bubble fades out slowly — good for reading longer hints.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(hint);\nwrapper.appendChild(tt);\nreturn wrapper;\n:::\n\n## Auto-Placement Fallback\nWhen the preferred `placement` has no room, the tooltip automatically falls back to the next available side.\n\n:::script label=\"Auto fallback near edge\" expected=\"tooltip flips above or below when side has no space\"\nconst trigger = await slice.build('ToolTip', {\n  text: 'Flipped to fit in viewport — the tooltip avoids clipping automatically.',\n  placement: 'left'\n});\ntrigger.textContent = 'Hover (near edge)';\n\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:flex;justify-content:flex-end;padding:20px;';\ncontainer.appendChild(trigger);\n\nconst note = document.createElement('p');\nnote.textContent = 'This tooltip requests placement=left but since there is no room it falls back to a visible side.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(container);\nreturn wrapper;\n:::\n\n## Keyboard & Dismiss\nThe tooltip is fully keyboard accessible and respects common dismiss patterns.\n\n:::script label=\"Focus trigger (keyboard)\" expected=\"tooltip appears when trigger receives focus\"\nconst tt = await slice.build('ToolTip', {\n  text: 'Appears on focus — try tabbing to this element.'\n});\ntt.textContent = 'Focus me (tab key)';\n\nconst note = document.createElement('p');\nnote.textContent = 'The tooltip activates on focusin (keyboard) just like mouseenter. Press Escape or click outside to close.';\nnote.style.marginTop = '0';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(tt);\nreturn wrapper;\n:::\n\n## Custom Width and Offset\n`maxWidth` controls how wide the bubble can grow (default `300px`). `offset` tightens or increases the gap between trigger and bubble (minimum `4px`).\n\n:::script label=\"Long text with maxWidth\" expected=\"tooltip wraps text within 180px\"\nconst tt = await slice.build('ToolTip', {\n  text: 'This is a longer description that wraps to multiple lines at 180px',\n  maxWidth: 180\n});\ntt.textContent = 'Narrow tooltip';\n\nconst note = document.createElement('p');\nnote.textContent = 'The bubble is capped at 180px wide so long text wraps.';\nnote.style.marginTop = '0';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(tt);\nreturn wrapper;\n:::\n\n:::script label=\"Tight offset (4px)\" expected=\"bubble appears close to trigger\"\nconst tt = await slice.build('ToolTip', {\n  text: 'Tight spacing',\n  offset: 4\n});\ntt.textContent = 'Hover (4px gap)';\n\nconst note = document.createElement('p');\nnote.textContent = 'Offset of 4px places the bubble very close to the trigger.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(tt);\nreturn wrapper;\n:::\n\n## Prop Scenarios\n:::script label=\"Hover tooltip\" expected=\"tooltip appears on hover over trigger text\"\nconst tooltip = await slice.build('ToolTip', {\n  text: 'This is a tooltip'\n});\n\ntooltip.textContent = 'Hover over this text';\n\nreturn tooltip;\n:::\n\n:::script label=\"Tooltip with button trigger\" expected=\"tooltip wraps a button element\"\nconst tooltip = await slice.build('ToolTip', {\n  text: 'Click to confirm'\n});\n\nconst button = await slice.build('Button', {\n  value: 'Submit'\n});\n\ntooltip.appendChild(button);\n\nconst host = document.createElement('div');\nhost.appendChild(tooltip);\nreturn host;\n:::\n\n:::script label=\"Empty text suppresses tooltip\" expected=\"no bubble appears on hover\"\nconst tooltip = await slice.build('ToolTip', {\n  text: ''\n});\n\ntooltip.textContent = 'Hover me (no tooltip)';\n\nreturn tooltip;\n:::\n\n:::script label=\"Toolbar with icon buttons\" expected=\"multiple tooltips in a toolbar row\"\nconst icons = [\n  { name: 'search', label: 'Search documents' },\n  { name: 'download', label: 'Download report' },\n  { name: 'share-nodes', label: 'Share with team' },\n  { name: 'trash-bin', label: 'Delete item' }\n];\n\nconst toolbar = document.createElement('div');\ntoolbar.style.cssText = 'display:flex;gap:6px;padding:8px 12px;border:1px solid var(--outline-primary);border-radius:8px;width:fit-content;';\n\nfor (const item of icons) {\n  const icon = await slice.build('Icon', { name: item.name, iconStyle: 'filled', size: '18px' });\n  const tt = await slice.build('ToolTip', {\n    text: item.label,\n    placement: 'bottom',\n    hideDelay: 200\n  });\n  tt.appendChild(icon);\n  toolbar.appendChild(tt);\n}\n\nconst label = document.createElement('p');\nlabel.textContent = 'Common UI pattern: icon toolbar with bottom tooltips and a short hideDelay for smooth transitions.';\nlabel.style.marginTop = '0';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(label);\nwrapper.appendChild(toolbar);\nreturn wrapper;\n:::\n\n:::script label=\"Custom color tooltip\" expected=\"tooltip with purple background and white text\"\nconst tt = await slice.build('ToolTip', {\n  text: 'Branded tooltip',\n  customColor: { background: '#7c3aed', text: '#ffffff' }\n});\ntt.textContent = 'Hover for purple tooltip';\n\nconst note = document.createElement('p');\nnote.textContent = 'Use customColor to match your brand palette.';\nnote.style.marginTop = '0';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(tt);\nreturn wrapper;\n:::\n\n## Best Practices\n:::tip\nPair tooltips with interactive elements (icon buttons, truncated text, input labels) to provide contextual hints without cluttering the UI. Use `hideDelay` (300–500ms) when tooltips contain multi-line content so users have time to read.\n:::\n\n## ToolTipProvider\nFor pages with many tooltips (toolbars, data tables, icon grids), use [`ToolTipProvider`](/docs/services/tooltip-provider) — a singleton Service that shares one bubble and one set of listeners across all triggers via a programmatic or `data-tooltip` API.\n\n## Pitfalls\n:::warning\nThe tooltip bubble is appended to `document.body` — ensure `z-index: 10000` does not conflict with other overlays. For critical information, prefer visible labels instead of tooltips.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"text\": \"Save your work before leaving\"\n}") {
               try {
                  props = JSON.parse("{\n  \"text\": \"Save your work before leaving\"\n}");
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

customElements.define('slice-tooltipdocumentation', ToolTipDocumentation);
