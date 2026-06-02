import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// CodeVisualizer takes a `value` (code string) + `language` and renders syntax-
// highlighted markup into `.codevisualizer` as:
//   <pre><code class="language-<lang>">...highlighted...</code></pre>
// It has a built-in "Copy" button (.copy-button) wired to the Clipboard API.

test.describe('CodeVisualizer', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('CodeVisualizer', { value: 'const a = 1;', language: 'javascript' });
      await expect(c.component).toBeVisible();
      await expect(c.locator('.codevisualizer_container')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('renders highlighted code in a language-tagged <code> block', async ({ mount }) => {
      const c = await mount('CodeVisualizer', { value: 'const a = 1;', language: 'javascript' });
      await expect(c.locator('.codevisualizer code')).toHaveClass('language-javascript');
      // The code text survives highlighting (spans are added around tokens).
      await expect(c.locator('.codevisualizer code')).toContainText('const a = 1;');
   });

   test('javascript keywords are wrapped in highlight spans', async ({ mount }) => {
      const c = await mount('CodeVisualizer', { value: 'const x = 2;', language: 'javascript' });
      await expect(c.locator('.codevisualizer .code-keyword').first()).toHaveText('const');
   });

   test('html language produces a language-html code block', async ({ mount }) => {
      const c = await mount('CodeVisualizer', { value: '<div class="a">hi</div>', language: 'html' });
      await expect(c.locator('.codevisualizer code')).toHaveClass('language-html');
      await expect(c.locator('.codevisualizer code')).toContainText('hi');
   });

   test('html tags are highlighted with code-tag spans (no template-literal leak)', async ({ mount }) => {
      const c = await mount('CodeVisualizer', { value: '<div class="a">hi</div>', language: 'html' });
      const code = c.locator('.codevisualizer code');
      // The HTML highlighter actually runs now: tags are wrapped in code-tag spans.
      await expect(code.locator('.code-tag').first()).toContainText('div');
      // Regression: the old extractTokens misuse stringified a builder function into
      // the class attribute, leaking `${tag}` / arrow-function source into the output.
      const html = await code.innerHTML();
      expect(html).not.toContain('${tag}');
      expect(html).not.toContain('=>');
   });

   test('escapes HTML so raw markup is not injected as live elements', async ({ mount }) => {
      // highlightCode() escapes &, <, >, " before producing highlight spans, so a
      // hostile <script>/<img> payload must NOT become a real executable element.
      const c = await mount('CodeVisualizer', {
         value: '<img src=x onerror=alert(1)>',
         language: 'html',
      });
      const code = c.locator('.codevisualizer code');
      // No live element was created from the payload (input is escaped to text).
      expect(await code.locator('img').count()).toBe(0);
      // The source angle-bracket characters survive as text content.
      await expect(code).toContainText('onerror');
   });

   test('copy button is present with its accessible title', async ({ mount }) => {
      const c = await mount('CodeVisualizer', { value: 'const a = 1;', language: 'javascript' });
      await expect(c.locator('.copy-button')).toHaveText('Copy');
      await expect(c.locator('.copy-button')).toHaveAttribute('title', 'Copy to clipboard');
   });

   test('visual: highlighted javascript @visual', async ({ mount }) => {
      const c = await mount('CodeVisualizer', {
         value: 'const greeting = "hola";\nconsole.log(greeting);',
         language: 'javascript',
      });
      await expect(c.component).toHaveScreenshot('codevisualizer-js.png');
   });
});
