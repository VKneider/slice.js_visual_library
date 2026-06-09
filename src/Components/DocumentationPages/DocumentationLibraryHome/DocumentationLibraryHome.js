import documentationRoutes from '../../AppComponents/ComponentsPage/documentationRoutes.generated.js';

function buildSections() {
  return Object.entries(documentationRoutes)
    .filter(([key]) => key !== 'defaultRoute')
    .reduce((acc, [, section]) => {
      const sectionKey = section.title.replace(/\s+/g, '');
      acc[sectionKey] = section.items.map(item => ({
        title: item.title,
        path: item.path || `/docs/${sectionKey.toLowerCase()}/${item.title.toLowerCase()}`
      }));
      return acc;
    }, {});
}

export default class DocumentationLibraryHome extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
  }

  async init() {
    await this.renderLinks();
  }

  async renderLinks() {
    const sections = this.querySelectorAll('[data-section]');
    const sectionsMap = buildSections();

    for (const list of sections) {
      const sectionName = list.dataset.section;
      const sectionData = sectionsMap[sectionName];
      if (!sectionData) continue;

      for (const item of sectionData) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.path;
        a.textContent = item.title;
        a.addEventListener('click', async (e) => {
          e.preventDefault();
          if (slice.router && slice.router.navigate) {
            await slice.router.navigate(item.path);
          }
        });
        li.appendChild(a);
        list.appendChild(li);
      }
    }
  }
}

customElements.define('slice-documentationlibraryhome', DocumentationLibraryHome);
