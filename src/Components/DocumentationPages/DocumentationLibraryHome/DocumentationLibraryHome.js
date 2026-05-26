export default class DocumentationLibraryHome extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
  }

  async init() {
    // Static landing page: no markdown copy menu or inline script scenarios.
  }

  async update() {
    // Refresh dynamic content here if needed
  }

  beforeDestroy() {
    // Cleanup timers, listeners, or pending work here
  }
}

customElements.define('slice-documentationlibraryhome', DocumentationLibraryHome);
