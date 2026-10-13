import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// These specs pin the *actual* DOMPurify behaviour rather than a guess at it,
// because the allowlist is the whole security contract: if a future DOMPurify
// version widens a default, one of these assertions is what catches it.

test.describe('HtmlService — esc', () => {
   test('smoke: builds without errors', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const ok = await h.page.evaluate(() => typeof window.__sliceServices.HtmlService.esc === 'function');
      expect(ok).toBe(true);
      expect(h.pageErrors()).toEqual([]);
   });

   test('encodes all five dangerous characters', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => window.__sliceServices.HtmlService.esc(`&<>"'`));
      expect(out).toBe('&amp;&lt;&gt;&quot;&#39;');
   });

   test('nullish and non-strings are coerced, never throw', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => {
         const esc = window.__sliceServices.HtmlService.esc;
         return { nul: esc(null), und: esc(undefined), num: esc(42), bool: esc(false), obj: esc({ toString: () => '<x>' }) };
      });
      expect(out).toEqual({ nul: '', und: '', num: '42', bool: 'false', obj: '&lt;x&gt;' });
   });

   test('esc then assign produces text, never an element', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => {
         const host = document.createElement('div');
         const esc = window.__sliceServices.HtmlService.esc;
         host.innerHTML = `<span>${esc('<img src=x onerror=alert(1)>')}</span>`;
         return { imgs: host.querySelectorAll('img').length, text: host.textContent };
      });
      expect(out.imgs).toBe(0);
      expect(out.text).toBe('<img src=x onerror=alert(1)>');
   });
});

test.describe('HtmlService — sanitize (your own HTML)', () => {
   test('removes scripts and every event handler', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => window.__sliceServices.HtmlService.sanitize(
         '<p onclick="alert(1)">hi</p><script>alert(2)</script><img src=x onerror=alert(3)><svg onload=alert(4)></svg>'
      ));
      expect(out).not.toMatch(/script|onclick|onerror|onload/i);
   });

   test('keeps the structure you are entitled to', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => window.__sliceServices.HtmlService.sanitize(
         '<table><tr><td>a</td></tr></table><ul><li>b</li></ul><a href="/x">c</a><img src="/y.png">'
      ));
      expect(out).toContain('<table>');
      expect(out).toContain('<li>b</li>');
      expect(out).toContain('href="/x"');
      expect(out).toContain('src="/y.png"');
   });

   test('inline SVG already passes, so no allowlist widening is needed', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => window.__sliceServices.HtmlService.sanitize(
         '<svg viewBox="0 0 24 24" width="24"><path d="M4 4h16v16H4z" fill="red"/></svg>'
      ));
      // Worth pinning explicitly: it is tempting to "fix" this by widening the
      // tag/attr allowlist, which would only widen the attack surface.
      expect(out).toContain('<svg');
      expect(out).toContain('viewBox="0 0 24 24"');
      expect(out).toContain('<path');
   });

   test('javascript: URLs do not survive', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => window.__sliceServices.HtmlService.sanitize(
         '<a href="javascript:alert(1)">x</a>'
      ));
      expect(out).not.toContain('javascript:');
   });

   test('options are passed through to DOMPurify', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => window.__sliceServices.HtmlService.sanitize(
         '<b>bold</b><i>italic</i>', { ALLOWED_TAGS: ['b'] }
      ));
      // The tag is dropped but its text stays — DOMPurify keeps content by
      // default, so narrowing the allowlist never silently eats a sentence.
      expect(out).toBe('<b>bold</b>italic');
   });
});

test.describe('HtmlService — sanitizeRichText (someone else\'s HTML)', () => {
   test('drops the tracking pixel that sanitize() would keep', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => {
         const s = window.__sliceServices.HtmlService;
         const foreign = '<p>hi</p><img src="https://tracker.example/pixel.gif">';
         return { wide: s.sanitize(foreign), narrow: s.sanitizeRichText(foreign) };
      });
      // The whole reason this method exists: an <img> in content you did not
      // write leaks the reader's IP and User-Agent the moment it renders.
      expect(out.wide).toContain('tracker.example');
      expect(out.narrow).not.toContain('tracker.example');
      expect(out.narrow).not.toContain('<img');
   });

   test('keeps the formatting a rich-text editor actually produces', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => window.__sliceServices.HtmlService.sanitizeRichText(
         '<p>a <b>b</b> <i>i</i> <u>u</u></p><ul><li>x</li></ul><ol><li>y</li></ol><br><div>d</div><span>s</span>'
      ));
      for (const tag of ['<p>', '<b>', '<i>', '<u>', '<ul>', '<li>', '<ol>', '<br>', '<div>', '<span>']) {
         expect(out).toContain(tag);
      }
   });

   test('strips scripts, handlers and javascript: URLs', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => window.__sliceServices.HtmlService.sanitizeRichText(
         '<script>alert(1)</script><p onclick="alert(2)">x</p><a href="javascript:alert(3)">y</a>'
      ));
      expect(out).not.toMatch(/script|onclick/i);
      expect(out).not.toContain('javascript:');
   });

   test('forces every link to open safely', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => window.__sliceServices.HtmlService.sanitizeRichText(
         '<a href="https://example.com">go</a>'
      ));
      expect(out).toContain('target="_blank"');
      expect(out).toContain('rel="noopener noreferrer nofollow"');
   });

   test('does NOT touch sanitize() — hardening is scoped to its own call', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => {
         const s = window.__sliceServices.HtmlService;
         // Run the hardening path FIRST: if the hook leaked out of its call,
         // this in-app link would be rewritten and stop navigating the SPA.
         s.sanitizeRichText('<a href="https://example.com">foreign</a>');
         return s.sanitize('<a href="/local">mine</a>');
      });
      expect(out).toBe('<a href="/local">mine</a>');
      expect(out).not.toContain('target');
   });

   test('and sanitize() still does not touch a later sanitizeRichText()', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => {
         const s = window.__sliceServices.HtmlService;
         s.sanitize('<a href="/local">mine</a>');
         return s.sanitizeRichText('<a href="https://example.com">foreign</a>');
      });
      expect(out).toContain('target="_blank"');
   });

   test('the hardening flag is reset even when the sanitizer throws', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });

      // DOMPurify itself is too defensive to be made to throw: a non-array,
      // numeric or null ALLOWED_TAGS are all tolerated. What does throw is the
      // `String(html)` coercion, and it sits inside the `try`, so this really
      // does exercise the `finally`.
      const out = await h.page.evaluate(() => {
         const s = window.__sliceServices.HtmlService;
         const exploding = new Proxy({}, {
            get(target, key) {
               if (key === Symbol.toPrimitive) throw new Error('boom');
               return '';
            },
         });

         let threw = false;
         try {
            s.sanitizeRichText(exploding);
         } catch {
            threw = true;
         }

         // If the flag leaked past the throw, this in-app link would wrongly
         // get target="_blank" and stop navigating the SPA.
         return { threw, after: s.sanitize('<a href="/local">mine</a>') };
      });

      expect(out.threw).toBe(true);
      expect(out.after).toBe('<a href="/local">mine</a>');
   });

   test('the hardening flag is off after a normal call too', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => {
         const s = window.__sliceServices.HtmlService;
         s.sanitizeRichText('<a href="https://example.com">x</a>');
         return s._hardenLinks;
      });
      expect(out).toBe(false);
   });
});

test.describe('HtmlService — toText', () => {
   test('strips all markup and keeps the words', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => window.__sliceServices.HtmlService.toText(
         '<p>hi <b>bold</b> <a href="/x">link</a></p><script>alert(1)</script>'
      ));
      expect(out).toBe('hi bold link');
   });

   test('nullish becomes an empty string', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['HtmlService'] });
      const out = await h.page.evaluate(() => {
         const s = window.__sliceServices.HtmlService;
         return { nul: s.toText(null), und: s.toText(undefined), escNul: s.esc(null), sanNul: s.sanitize(null), richNul: s.sanitizeRichText(null) };
      });
      expect(out).toEqual({ nul: '', und: '', escNul: '', sanNul: '', richNul: '' });
   });
});
