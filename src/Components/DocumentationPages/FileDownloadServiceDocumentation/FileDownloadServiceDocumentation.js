export default class FileDownloadServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Save a file","expected":"clicking either button saves a file to your device","kind":"script","content":"const downloads = await slice.build('FileDownloadService', { singleton: true });\n\nconst wrap = document.createElement('div');\nwrap.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;font-family:system-ui,sans-serif;';\n\nconst rows = [\n  { id: 1, name: 'Ada' },\n  { id: 2, name: 'Grace' },\n  { id: 3, name: 'Katherine' },\n];\n\nwrap.appendChild(await slice.build('Button', {\n  value: 'Download .json',\n  onClick: () => downloads.download('people.json', JSON.stringify(rows, null, 2), 'application/json'),\n}));\n\nwrap.appendChild(await slice.build('Button', {\n  value: 'Download .csv',\n  variant: 'outlined',\n  onClick: () => downloads.download(\n    'people.csv',\n    ['id,name', ...rows.map((r) => `${r.id},${r.name}`)].join('\\n'),\n    'text/csv'\n  ),\n}));\n\nmount(wrap);"}];
  }

  async init() {
    this.markdownPath = "file-download-service.md";
    this.markdownContent = "---\ntitle: FileDownloadService\nroute: /docs/services/file-download-service\nnavLabel: FileDownloadService\nsection: Services\ngroup: Storage\norder: 11\ndescription: Saves a string or Blob to the user's device, with the object URL lifecycle handled for you.\ncomponent: FileDownloadServiceDocumentation\ngenerate: true\ntags: [service, download, file, blob, export]\n---\n\n# FileDownloadService\n\n## Overview\n\n`FileDownloadService` is a **Service** component: a plain logic class (no DOM, no template) that\nsaves content to the user's device as a file.\n\nIt exists because the \"save a file from JS\" snippet is short, easy to get subtly wrong, and gets\ncopy-pasted into every app. Build it once with a `sliceId` and call it:\n\n```javascript title=\"Build the service\"\nconst downloads = await slice.build('FileDownloadService', { sliceId: 'FileDownloadService' });\n```\n\n## API\n\n- `download(filename, content, mimeType = 'text/plain')` — saves `content` as `filename`.\n- `open(content, mimeType = 'text/plain')` — opens the content in a new tab instead of saving it.\n\n`content` may be a `string` or a ready-made `Blob`. When it is a `Blob`, the `mimeType` argument is\nignored — a `Blob` already carries its own type.\n\n## Usage\n\n```javascript title=\"Export some data\"\nconst downloads = await slice.build('FileDownloadService', { sliceId: 'FileDownloadService' });\n\ndownloads.download(\n  'report.json',\n  JSON.stringify({ rows }, null, 2),\n  'application/json'\n);\n```\n\n```javascript title=\"Download a Blob you already have\"\nconst blob = new Blob([csv], { type: 'text/csv' });\ndownloads.download('export.csv', blob);\n```\n\n```javascript title=\"Preview a PDF instead of saving it\"\ndownloads.open(pdfBlob, 'application/pdf');\n```\n\n:::script label=\"Save a file\" expected=\"clicking either button saves a file to your device\"\nconst downloads = await slice.build('FileDownloadService', { singleton: true });\n\nconst wrap = document.createElement('div');\nwrap.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;font-family:system-ui,sans-serif;';\n\nconst rows = [\n  { id: 1, name: 'Ada' },\n  { id: 2, name: 'Grace' },\n  { id: 3, name: 'Katherine' },\n];\n\nwrap.appendChild(await slice.build('Button', {\n  value: 'Download .json',\n  onClick: () => downloads.download('people.json', JSON.stringify(rows, null, 2), 'application/json'),\n}));\n\nwrap.appendChild(await slice.build('Button', {\n  value: 'Download .csv',\n  variant: 'outlined',\n  onClick: () => downloads.download(\n    'people.csv',\n    ['id,name', ...rows.map((r) => `${r.id},${r.name}`)].join('\\n'),\n    'text/csv'\n  ),\n}));\n\nmount(wrap);\n:::\n\n## Best Practices\n\n:::tip\nPass the `mimeType` even when the browser would guess from the extension. It decides whether the\nsaved file opens in a text editor, a spreadsheet or an image viewer, and a wrong type is confusing\nin a way a wrong name is not.\n:::\n\n## Pitfalls\n\n:::warning\nNever revoke the object URL yourself after calling `download`. The service already revokes it after\na short delay, and revoking it immediately cancels the download in some browsers — the navigation\nhas not started yet.\n\n:::\n\n:::warning\nFor a file larger than a few tens of MB, `Blob` + `URL.createObjectURL` is the only thing that\nworks: a base64 `data:` URL has to fit in a string, and browser string limits are far below what\nthat sounds like. Past that size, stream it from a server instead.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const downloads = await slice.build('FileDownloadService', { sliceId: 'FileDownloadService' });",
               language: "javascript"
            });
            if ("Build the service") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build the service";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const downloads = await slice.build('FileDownloadService', { sliceId: 'FileDownloadService' });\n\ndownloads.download(\n  'report.json',\n  JSON.stringify({ rows }, null, 2),\n  'application/json'\n);",
               language: "javascript"
            });
            if ("Export some data") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Export some data";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const blob = new Blob([csv], { type: 'text/csv' });\ndownloads.download('export.csv', blob);",
               language: "javascript"
            });
            if ("Download a Blob you already have") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Download a Blob you already have";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "downloads.open(pdfBlob, 'application/pdf');",
               language: "javascript"
            });
            if ("Preview a PDF instead of saving it") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Preview a PDF instead of saving it";
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
     for (const link of this._inlineLinks) {
       slice.controller.destroyComponent(link);
     }
     this._inlineLinks = [];
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

customElements.define('slice-filedownloadservicedocumentation', FileDownloadServiceDocumentation);
