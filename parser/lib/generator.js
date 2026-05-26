import fs from 'fs';
import path from 'path';

const pascalCase = (value) => {
  return value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

const safeComponentName = (frontMatter) => {
  if (frontMatter.component) return frontMatter.component;
  return `${pascalCase(frontMatter.title)}Documentation`;
};

const defaultCss = () => {
  return `/* Generated documentation styles */
/* Keep shared styles in src/Styles/DocumentationBase.css */
`;
};

const generateHtml = (componentClass, html) => {
  return `<div class="documentation-content ${componentClass.toLowerCase()}">
${html}
</div>
`;
};

const buildScriptScenario = (attrs, content) => {
  const label = attrs.label || attrs.name || attrs.prop || 'Run scenario';
  const expected = attrs.expected || '';
  const kind = attrs.type || 'script';
  return {
    label,
    expected,
    kind,
    content
  };
};

const generateJs = (componentClass, jsBlocks, tagName, markdownPath = '', markdownContent = '', enableCopy = true) => {
  const scriptScenarios = jsBlocks
    .filter((block) => block.type === 'script')
    .map((block) => buildScriptScenario(block.attrs || {}, block.content));

  const buildCodeBlocks = jsBlocks
    .map((block) => {
      if (block.type === 'code') {
        return `      {
         const container = this.querySelector('[data-block-id="${block.id}"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: ${JSON.stringify(block.value)},
               language: "${block.language}"
            });
            if (${JSON.stringify(block.title)}) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = ${JSON.stringify(block.title)};
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }`;
      }
      if (block.type === 'details') {
        return `      {
         const container = this.querySelector('[data-block-id="${block.id}"]');
         if (container) {
            const details = await slice.build('Details', { title: ${JSON.stringify(block.title)}, text: ${JSON.stringify(block.content)} });
            container.appendChild(details);
         }
      }`;
      }
      if (block.type === 'component') {
        return `      {
         const container = this.querySelector('[data-block-id="${block.id}"]');
         if (container) {
            let props = {};
            if (${JSON.stringify(block.props)}) {
               try {
                  props = JSON.parse(${JSON.stringify(block.props)});
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('${block.component}', props);
            container.appendChild(component);
         }
      }`;
      }
      if (block.type === 'table') {
        return `      {
         const container = this.querySelector('[data-block-id="${block.id}"]');
         if (container) {
            const lines = ${JSON.stringify(block.rows)};
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');

  return `export default class ${componentClass} extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = ${JSON.stringify(scriptScenarios)};
  }

  async init() {
    this.markdownPath = ${enableCopy ? JSON.stringify(markdownPath) : "''"};
    this.markdownContent = ${enableCopy ? JSON.stringify(markdownContent) : "''"};
    if (${enableCopy ? 'true' : 'false'}) {
      await this.setupCopyButton();
    }
${buildCodeBlocks || '    // No dynamic blocks'}
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
    subtitle.textContent = 'Run each scenario to validate behavior and prevent regressions.';
    section.appendChild(subtitle);

    for (const scenario of this.scriptScenarios) {
      const card = document.createElement('article');
      card.classList.add('doc-script-card');

      const header = document.createElement('div');
      header.classList.add('doc-script-header');

      const heading = document.createElement('h3');
      heading.classList.add('doc-script-title');
      heading.textContent = scenario.label;
      header.appendChild(heading);

      card.appendChild(header);

      const preview = document.createElement('div');
      preview.classList.add('doc-script-preview');
      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        preview.innerHTML = '';
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed #f59e0b';
          fallback.style.borderRadius = '8px';
          fallback.style.background = '#fffbeb';
          fallback.style.color = '#92400e';
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
          return createBuildFallbackNode(name);
        };

        const mount = (node) => {
          if (node instanceof Node) {
            preview.appendChild(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

          if (result instanceof Node) {
            preview.appendChild(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                preview.appendChild(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });
      card.appendChild(preview);
      card.appendChild(code);
      card.appendChild(errorMessage);

      section.appendChild(card);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('${tagName}', ${componentClass});
`;
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const writeComponentFiles = ({ frontMatter, html, jsBlocks }, outputDir, markdownPath = '') => {
  const componentClass = safeComponentName(frontMatter);
  const folderName = componentClass;
  const folderPath = path.join(outputDir, folderName);
  const tagName = `slice-${componentClass.toLowerCase()}`;

  ensureDir(folderPath);

  const htmlContent = generateHtml(componentClass, html);
  const generateFlag = frontMatter?.generate;
  const enableCopy = !(generateFlag === false || String(generateFlag).toLowerCase() === 'false');
  const markdownContent = enableCopy ? (frontMatter?.markdownSource || '') : '';
  const jsContent = generateJs(componentClass, jsBlocks, tagName, markdownPath, markdownContent, enableCopy);
  const cssContent = defaultCss(tagName);

  fs.writeFileSync(path.join(folderPath, `${componentClass}.html`), htmlContent, 'utf8');
  fs.writeFileSync(path.join(folderPath, `${componentClass}.js`), jsContent, 'utf8');

  const cssPath = path.join(folderPath, `${componentClass}.css`);
  if (!fs.existsSync(cssPath)) {
    fs.writeFileSync(cssPath, cssContent, 'utf8');
  }

  return { componentClass, tagName, folderPath };
};

export { writeComponentFiles, safeComponentName };
