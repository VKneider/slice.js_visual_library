// TestHarness — internal, test-only mount point for the Playwright component
// harness. The top-level router renders this component for the `/__test` route
// (declared in parser/lib/routesSync.js, so it survives `docs:generate`).
//
// It deliberately renders NO app chrome (no navbar, no docs shell) so that
// component screenshots and DOM queries are clean. Playwright builds the
// component under test into `[data-test-root]` via `slice.build(...)`.
//
// Not meant to be consumed by Slice apps — it exists only to serve the test
// environment of this repository.
export default class TestHarness extends HTMLElement {
   constructor() {
      super();
      slice.attachTemplate(this);
      this.$root = this.querySelector('[data-test-root]');
   }

   async init() {
      // Expose the mount root globally so the Playwright fixture can resolve it
      // without depending on internal markup beyond the data attribute.
      window.__sliceTestRoot = this.$root;
   }
}

customElements.define('slice-test-harness', TestHarness);
