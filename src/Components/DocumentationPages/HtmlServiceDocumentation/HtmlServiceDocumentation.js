export default class HtmlServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"What each layer keeps","expected":"three renderings of the same hostile input; the tracker pixel and the onerror handler do not survive","kind":"script","content":"const html = await slice.build('HtmlService', { singleton: true });\n\n// Deliberately hostile input: a tracking pixel, an event handler, and a\n// javascript: link — the three things that actually show up in real payloads.\nconst hostile = '<p>Hi <b>there</b></p>'\n   + '<img src=\"https://tracker.example/pixel.gif\">'\n   + '<span onclick=\"alert(1)\">click</span>'\n   + '<a href=\"javascript:alert(2)\">link</a>';\n\nconst render = (label, value) => {\n   const box = document.createElement('div');\n   box.style.cssText = 'font-family:system-ui,sans-serif;margin-bottom:14px;';\n\n   const h = document.createElement('strong');\n   h.textContent = label;\n   box.appendChild(h);\n\n   const out = document.createElement('div');\n   out.style.cssText = 'padding:8px;border:1px dashed var(--medium-color);border-radius:6px;margin-top:4px;font-size:.85rem;';\n   out.innerHTML = value;\n   box.appendChild(out);\n\n   const raw = document.createElement('code');\n   raw.style.cssText = 'display:block;margin-top:4px;font-size:.7rem;color:var(--font-secondary-color);word-break:break-all;';\n   raw.textContent = value;\n   box.appendChild(raw);\n\n   return box;\n};\n\nconst wrap = document.createElement('div');\nwrap.appendChild(render('sanitize() — HTML you built', html.sanitize(hostile)));\nwrap.appendChild(render('sanitizeRichText() — HTML someone else wrote', html.sanitizeRichText(hostile)));\nwrap.appendChild(render('toText() — just the words', html.toText(hostile)));\nmount(wrap);"},{"label":"Links in foreign content are forced open safely","expected":"the link opens in a new tab with rel=noopener, so shared content cannot reach back into this tab","kind":"script","content":"const html = await slice.build('HtmlService', { singleton: true });\n\nconst out = document.createElement('div');\nout.innerHTML = html.sanitizeRichText('<p>Read the <a href=\"https://example.com\">docs</a>.</p>');\n\nconst note = document.createElement('p');\nnote.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);margin-top:10px;';\nnote.textContent = 'Every anchor gets target=\"_blank\" and rel=\"noopener noreferrer nofollow\".';\n\nconst wrap = document.createElement('div');\nwrap.appendChild(out);\nwrap.appendChild(note);\nmount(wrap);"}];
  }

  async init() {
    this.markdownPath = "html-service.md";
    this.markdownContent = "---\ntitle: HtmlService\nroute: /docs/services/html-service\nnavLabel: HtmlService\nsection: Services\ngroup: Security\norder: 12\ndescription: Escape, sanitize and strip HTML at the boundary where untrusted markup becomes real DOM.\ncomponent: HtmlServiceDocumentation\ngenerate: true\ntags: [service, html, sanitize, xss, security, dompurify, escape]\n---\n\n# HtmlService\n\n## Overview\n\n`HtmlService` is a **Service** component: a plain logic class (no DOM, no template) that makes it\nsafe to turn an HTML **string** into real markup.\n\nMost of the library never needs it, and that is the point — every visual component here assigns\n`textContent`, so it cannot produce markup injection at all. Reach for this service only at the\n**boundary where HTML you did not write enters your app**: a CMS field, a markdown renderer, a\ntemplate someone imports, a comment left by another user.\n\n## Requires an npm dependency\n\nThis is the one component in the library that is not dependency-free:\n\n```bash\npnpm add dompurify\n```\n\n`slice get HtmlService` prints a warning naming the package if it is missing.\n\n## Three layers, in increasing paranoia\n\n| Method | Use for | Allowlist |\n| --- | --- | --- |\n| `esc(value)` | each dynamic token as you interpolate it | encodes 5 characters |\n| `sanitize(html, options?)` | HTML **you** built | DOMPurify's defaults: structure, links, images, tables, forms |\n| `sanitizeRichText(html, options?)` | HTML **someone else** wrote | bold/italic/lists/paragraphs/links only. No images. |\n| `toText(html)` | you want the words, not the markup | none — tags stripped, text kept |\n\n`sanitize()` is the net *underneath* `esc()`, not a replacement for it. Encode as you interpolate,\nsanitize as the final gate before the `innerHTML` assignment.\n\n## Usage\n\n```javascript title=\"Sanitizing HTML you built\"\nconst html = slice.getComponent('HtmlService');\nthis.$root.innerHTML = html.sanitize(`<p>${html.esc(user.bio)}</p>`);\n```\n\n```javascript title=\"Sanitizing HTML someone else wrote\"\nconst html = slice.getComponent('HtmlService');\nthis.$banner.innerHTML = html.sanitizeRichText(importedTemplate.bienvenida);\n```\n\n## Prop Scenarios\n\n:::script label=\"What each layer keeps\" expected=\"three renderings of the same hostile input; the tracker pixel and the onerror handler do not survive\"\nconst html = await slice.build('HtmlService', { singleton: true });\n\n// Deliberately hostile input: a tracking pixel, an event handler, and a\n// javascript: link — the three things that actually show up in real payloads.\nconst hostile = '<p>Hi <b>there</b></p>'\n   + '<img src=\"https://tracker.example/pixel.gif\">'\n   + '<span onclick=\"alert(1)\">click</span>'\n   + '<a href=\"javascript:alert(2)\">link</a>';\n\nconst render = (label, value) => {\n   const box = document.createElement('div');\n   box.style.cssText = 'font-family:system-ui,sans-serif;margin-bottom:14px;';\n\n   const h = document.createElement('strong');\n   h.textContent = label;\n   box.appendChild(h);\n\n   const out = document.createElement('div');\n   out.style.cssText = 'padding:8px;border:1px dashed var(--medium-color);border-radius:6px;margin-top:4px;font-size:.85rem;';\n   out.innerHTML = value;\n   box.appendChild(out);\n\n   const raw = document.createElement('code');\n   raw.style.cssText = 'display:block;margin-top:4px;font-size:.7rem;color:var(--font-secondary-color);word-break:break-all;';\n   raw.textContent = value;\n   box.appendChild(raw);\n\n   return box;\n};\n\nconst wrap = document.createElement('div');\nwrap.appendChild(render('sanitize() — HTML you built', html.sanitize(hostile)));\nwrap.appendChild(render('sanitizeRichText() — HTML someone else wrote', html.sanitizeRichText(hostile)));\nwrap.appendChild(render('toText() — just the words', html.toText(hostile)));\nmount(wrap);\n:::\n\n:::script label=\"Links in foreign content are forced open safely\" expected=\"the link opens in a new tab with rel=noopener, so shared content cannot reach back into this tab\"\nconst html = await slice.build('HtmlService', { singleton: true });\n\nconst out = document.createElement('div');\nout.innerHTML = html.sanitizeRichText('<p>Read the <a href=\"https://example.com\">docs</a>.</p>');\n\nconst note = document.createElement('p');\nnote.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);margin-top:10px;';\nnote.textContent = 'Every anchor gets target=\"_blank\" and rel=\"noopener noreferrer nofollow\".';\n\nconst wrap = document.createElement('div');\nwrap.appendChild(out);\nwrap.appendChild(note);\nmount(wrap);\n:::\n\n## Best Practices\n\n:::tip\nSanitize at the boundary, once, when the value enters — not at every render site. Then the value is\njust data for the rest of its life, and a new render path cannot forget to sanitize.\n:::\n\n:::tip\n`sanitize()` already passes inline SVG through unchanged, including `viewBox` and `path`. There is\nno need to widen the tag or attribute allowlist to make icons work — doing so only widens the\nattack surface.\n:::\n\n## Pitfalls\n\n:::warning\n`innerHTML = value` with an unsanitized `value` is an XSS hole even when the value \"only\" comes\nfrom your own database: anything that writes to it — a form field, an import, a support tool — turns\nit into a hole too. `sanitize()` at the boundary closes all of them at once.\n\n:::warning\nDo not use `sanitize()` on content written by someone else. It allows `<img>`, so\n`<img src=\"https://tracker.example/pixel.gif\">` survives — and that leaks the reader's IP address\nand User-Agent the moment the page renders, with nothing visible on screen. Use\n`sanitizeRichText()`, which drops images entirely. Links are kept on purpose: an `<a href>` only\nreaches its destination when the reader deliberately clicks it, and the destination is visible\nfirst.\n\n:::warning\n`sanitizeRichText()` drops tags but **keeps their text**, so a stripped `<img>` simply disappears\nwhile `<script>alert(1)</script>` leaves `alert(1)` as visible text. That is DOMPurify's\n`KEEP_CONTENT` behaviour, not a bug — but if you are rendering user comments, use `toText()`.\n\n:::warning\nSanitizing is not the same as validating. `sanitize()` guarantees the string is safe to become\nmarkup; it says nothing about whether the content is *correct*. Check the shape of the data too.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "pnpm add dompurify",
               language: "bash"
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
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const lines = ["| Method | Use for | Allowlist |","| --- | --- | --- |","| `esc(value)` | each dynamic token as you interpolate it | encodes 5 characters |","| `sanitize(html, options?)` | HTML **you** built | DOMPurify's defaults: structure, links, images, tables, forms |","| `sanitizeRichText(html, options?)` | HTML **someone else** wrote | bold/italic/lists/paragraphs/links only. No images. |","| `toText(html)` | you want the words, not the markup | none — tags stripped, text kept |"];
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
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const html = slice.getComponent('HtmlService');\nthis.$root.innerHTML = html.sanitize(`<p>${html.esc(user.bio)}</p>`);",
               language: "javascript"
            });
            if ("Sanitizing HTML you built") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Sanitizing HTML you built";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const html = slice.getComponent('HtmlService');\nthis.$banner.innerHTML = html.sanitizeRichText(importedTemplate.bienvenida);",
               language: "javascript"
            });
            if ("Sanitizing HTML someone else wrote") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Sanitizing HTML someone else wrote";
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

customElements.define('slice-htmlservicedocumentation', HtmlServiceDocumentation);
