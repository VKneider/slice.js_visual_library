/**
 * ExternalDepsProbe — e2e fixture for the external-dependencies feature (bare
 * imports from node_modules). It imports two real, widely-used frontend
 * packages and renders their output so a Playwright test can assert, in a REAL
 * browser, that:
 *   - dayjs  (default import, CommonJS interop) loaded and formatted a date;
 *   - marked (named import, ESM) loaded and rendered markdown to HTML.
 *
 * Used only by ExternalDepsProbe.spec.js — not a public library component.
 */
import dayjs from 'dayjs';
import { marked } from 'marked';

export default class ExternalDepsProbe extends HTMLElement {
   static props = {
      date: { type: 'string', default: '2020-01-15' },
      markdown: { type: 'string', default: '# Hello **world**' }
   };

   constructor(props) {
      super();
      this.innerHTML =
         '<div class="edp">' +
         '<time class="edp-date"></time>' +
         '<div class="edp-md"></div>' +
         '<span class="edp-status"></span>' +
         '</div>';
      this.$date = this.querySelector('.edp-date');
      this.$md = this.querySelector('.edp-md');
      this.$status = this.querySelector('.edp-status');
      slice.controller.setComponentProps(this, props);
   }

   init() {
      // dayjs: default import — resolves the CommonJS module's export.
      this.$date.textContent = dayjs(this._date).format('YYYY/MM/DD');
      // marked: named import from an ESM package.
      this.$md.innerHTML = marked.parse(this._markdown);

      const ok = typeof dayjs === 'function' && typeof marked.parse === 'function';
      this.$status.textContent = ok ? 'ok' : 'fail';
      this.$status.dataset.dayjs = typeof dayjs;
      this.$status.dataset.marked = typeof marked.parse;
   }

   get date() { return this._date; }
   set date(v) { this._date = v; }

   get markdown() { return this._markdown; }
   set markdown(v) { this._markdown = v; }
}

customElements.define('slice-external-deps-probe', ExternalDepsProbe);
