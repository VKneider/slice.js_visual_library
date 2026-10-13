import DOMPurify from 'dompurify';

// Safe-HTML helpers, for the one case `textContent` cannot cover: HTML that
// arrives as a STRING and genuinely has to become markup (a CMS field, a
// markdown renderer, a template imported from another device).
//
// The library's own components never need this — they assign `textContent`, so
// they cannot produce markup injection at all. Reach for this service only at
// the boundary where untrusted HTML enters.
//
// Three layers, in increasing paranoia:
//   esc()             encode one value as you interpolate it (never raw)
//   sanitize()        for HTML *you* built: DOMPurify's default allowlist
//   sanitizeRichText() for HTML *someone else* wrote: a narrow allowlist, no
//                     images, and every link forced to open safely
//
// REQUIRES an npm dependency. `slice get HtmlService` prints a warning naming
// it; install it yourself:
//
//     pnpm add dompurify

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// DOMPurify hooks are global to the module instance, so this one is registered
// once, at construction — not lazily on first use.
let hookInstalled = false;

export default class HtmlService {

   constructor() {
      if (hookInstalled) return;
      hookInstalled = true;
      DOMPurify.addHook('afterSanitizeAttributes', (node) => {
         // Scoped to the call that asked for it. DOMPurify.sanitize() is
         // synchronous, so flipping the flag around the call is safe, and it
         // means sanitize() is never affected by whether sanitizeRichText()
         // happened to run first.
         if (!this._hardenLinks) return;
         if (node.tagName !== 'A' || !node.hasAttribute('href')) return;
         node.setAttribute('target', '_blank');
         node.setAttribute('rel', 'noopener noreferrer nofollow');
      });
   }

   /**
    * Encode a single value for interpolation into an HTML string.
    * Use this for every dynamic token; `sanitize()` is the net underneath, not
    * a replacement for it.
    */
   esc(value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
   }

   /**
    * Sanitize HTML that YOU built, on top of `esc()`-ing every dynamic token.
    * DOMPurify's default allowlist: structure, links, images, tables, forms.
    *
    * @param {string} html
    * @param {object} [options] passed straight to DOMPurify. Reach for this
    *        only when you know why the default is not enough.
    */
   sanitize(html, options) {
      return DOMPurify.sanitize(html == null ? '' : String(html), options);
   }

   /**
    * Sanitize HTML written by SOMEONE ELSE.
    *
    * `sanitize()` is too wide for that. An `<img src="https://tracker/…">` in
    * content you did not write leaks the reader's IP and User-Agent the moment
    * the page renders — with nothing visible to show for it. So this drops to
    * an allowlist of the formatting a rich-text editor actually produces.
    *
    * Links ARE kept, unlike images: an `<a href>` only reaches its destination
    * when the reader deliberately clicks it, and the destination is visible
    * first. Every one is forced to `target="_blank"` with
    * `rel="noopener noreferrer nofollow"`, so shared content cannot reach back
    * into this tab through `window.opener`, nor pass the referrer along.
    */
   sanitizeRichText(html, options = {}) {
      this._hardenLinks = true;
      try {
         return DOMPurify.sanitize(html == null ? '' : String(html), {
            ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'div', 'span', 'a'],
            ALLOWED_ATTR: ['href', 'target', 'rel'],
            ...options,
         });
      } finally {
         // Synchronous, so this is always the right moment to put it back.
         this._hardenLinks = false;
      }
   }

   /**
    * Strip all markup and return plain text.
    *
    * The right answer more often than people expect: a preview that must not
    * execute anything, a plain-text export, or a value going into a `title`.
    */
   toText(html) {
      return DOMPurify.sanitize(html == null ? '' : String(html), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
   }
}
