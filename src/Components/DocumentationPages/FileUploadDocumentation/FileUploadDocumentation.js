export default class FileUploadDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Images only","expected":"a drop zone that says PNG or JPG","kind":"script","content":"return await slice.build('FileUpload', {\r\n  accept: 'image/*',\r\n  prompt: 'Drag images here, or click to choose',\r\n  hint: 'PNG or JPG, up to 5 MB each',\r\n});"},{"label":"Multiple documents","expected":"a wider zone for a document drop","kind":"script","content":"return await slice.build('FileUpload', {\r\n  accept: '.pdf,.docx,.xlsx',\r\n  multiple: true,\r\n  prompt: 'Drop your documents',\r\n  hint: 'PDF, DOCX or XLSX',\r\n  icon: 'file-lines',\r\n});"},{"label":"Disabled","expected":"a dimmed zone that accepts nothing","kind":"script","content":"return await slice.build('FileUpload', {\r\n  disabled: true,\r\n  prompt: 'Uploads are closed for this project',\r\n});"}];
  }

  async init() {
    this.markdownPath = "file-upload.md";
    this.markdownContent = "---\r\ntitle: FileUpload\r\nroute: /docs/input/file-upload\r\nnavLabel: FileUpload\r\nsection: Input Components\r\ngroup: Basic\r\norder: 12\r\ndescription: Drag-and-drop zone that is also a real, keyboard-operable file input.\r\ncomponent: FileUploadDocumentation\r\ngenerate: true\r\ntags: [file, upload, dropzone, drop, input]\r\n---\r\n\r\n# FileUpload\r\n\r\n## Overview\r\n\r\nA drop zone for files that works with a mouse, a finger and a keyboard. The zone is a `<label>`\r\nwrapping a real `<input type=\"file\">`, so the browser gives you click-to-open, focus and\r\nEnter/Space for free — none of which a clickable `<div>` would have.\r\n\r\n## API\r\n\r\n- `accept` (string) — extensions or MIME types, e.g. `'image/*,.png'`. Empty means anything.\r\n- `multiple` (boolean) — allow more than one file.\r\n- `disabled` (boolean)\r\n- `prompt` (string, default `'Drag files here, or click to choose'`)\r\n- `hint` (string) — small print under the prompt, e.g. the size limit.\r\n- `icon` (string, default `'upload'`) — an `Icon` name; empty renders no glyph.\r\n- `list` (boolean) — show the picked files under the zone.\r\n- `onFiles` (function) — called as `onFiles(filesArray, fileList)`\r\n\r\nThe input is cleared after every pick, so choosing the **same** file twice still fires `onFiles`\r\ninstead of silently doing nothing.\r\n\r\n## Prop Scenarios\r\n\r\n:::script label=\"Images only\" expected=\"a drop zone that says PNG or JPG\"\r\nreturn await slice.build('FileUpload', {\r\n  accept: 'image/*',\r\n  prompt: 'Drag images here, or click to choose',\r\n  hint: 'PNG or JPG, up to 5 MB each',\r\n});\r\n:::\r\n\r\n:::script label=\"Multiple documents\" expected=\"a wider zone for a document drop\"\r\nreturn await slice.build('FileUpload', {\r\n  accept: '.pdf,.docx,.xlsx',\r\n  multiple: true,\r\n  prompt: 'Drop your documents',\r\n  hint: 'PDF, DOCX or XLSX',\r\n  icon: 'file-lines',\r\n});\r\n:::\r\n\r\n:::script label=\"Disabled\" expected=\"a dimmed zone that accepts nothing\"\r\nreturn await slice.build('FileUpload', {\r\n  disabled: true,\r\n  prompt: 'Uploads are closed for this project',\r\n});\r\n:::\r\n\r\n## Best Practices\r\n\r\n:::tip\r\nValidate the files in `onFiles` rather than relying on `accept`: it is only a picker hint, and a user\r\ncan still drop anything. Check type and size there, and tell them what you rejected.\r\n:::\r\n\r\n## Pitfalls\r\n\r\n:::warning\r\n`accept` filters the picker, not the drop handler. A file dragged onto the zone is **not** filtered\r\nby it — always re-check `files` yourself.\r\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"accept\",\"type\":\"string\",\"required\":false,\"default\":\"ACCEPT_ALL\",\"allowedValues\":[]},{\"path\":\"multiple\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"prompt\",\"type\":\"string\",\"required\":false,\"default\":\"Drag files here, or click to choose\",\"allowedValues\":[]},{\"path\":\"hint\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"string\",\"required\":false,\"default\":\"upload\",\"allowedValues\":[]},{\"path\":\"list\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"onFiles\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"accept\",\"type\":\"string\",\"required\":false,\"default\":\"ACCEPT_ALL\",\"allowedValues\":[]},{\"path\":\"multiple\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"prompt\",\"type\":\"string\",\"required\":false,\"default\":\"Drag files here, or click to choose\",\"allowedValues\":[]},{\"path\":\"hint\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"string\",\"required\":false,\"default\":\"upload\",\"allowedValues\":[]},{\"path\":\"list\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"onFiles\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-fileuploaddocumentation', FileUploadDocumentation);
