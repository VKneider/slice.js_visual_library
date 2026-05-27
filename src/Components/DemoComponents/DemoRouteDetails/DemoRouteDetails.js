export default class DemoRouteDetails extends HTMLElement {
   constructor(props) {
      super();
      this.props = props || {};
   }

   init() {
      this.render();
   }

   render() {
      this.innerHTML = '';

      const card = document.createElement('article');
      card.style.padding = '14px';
      card.style.borderRadius = '10px';
      card.style.border = '1px solid color-mix(in srgb, var(--primary-color-shade) 65%, transparent)';
      card.style.background = 'color-mix(in srgb, var(--secondary-background-color) 70%, transparent)';

      const title = document.createElement('h4');
      title.textContent = 'DemoRouteDetails';
      title.style.margin = '0 0 8px';

      const text = document.createElement('p');
      text.style.margin = '0';
      text.textContent = 'Details view rendered by Route or MultiRoute demo.';

      card.appendChild(title);
      card.appendChild(text);
      this.appendChild(card);
   }
}

customElements.define('slice-demoroutedetails', DemoRouteDetails);
