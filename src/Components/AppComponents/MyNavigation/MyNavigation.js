export default class MyNavigation extends HTMLElement {
   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.$navigation = this.querySelector('.my_navigation');
      this.observer = null;
      this.boundUpdateNavigation = this.updateNavigation.bind(this);

      slice.controller.setComponentProps(this, props);
      this.debuggerProps = ['page'];
   }

   set page(value) {
      // Limpiar listeners y observers anteriores
      if (this._page) {
         this._page.removeEventListener('route-rendered', this.boundUpdateNavigation);
      }
      
      this._page = value;
      
      if (this._page) {
         // Escuchar el evento 'route-rendered' del MultiRoute
         this._page.addEventListener('route-rendered', this.boundUpdateNavigation);
         this.setupObserver();
         this.updateNavigation();
      }
   }

   get page() {
      return this._page;
   }

   init() {
      // El setter page() ya agregó el listener route-rendered, llamó setupObserver
      // y ejecutó updateNavigation. Solo agregamos el listener de popstate aquí.
      window.addEventListener('popstate', this.boundUpdateNavigation);
   }

   // Cuando el MultiRoute padre reusa el componente (innerHTML='' + appendChild),
   // el DOM se desconecta y reconecta. Al reconectar, re-sincronizamos la navegación.
   connectedCallback() {
      this.updateNavigation();
   }

   setupObserver() {
      // Limpiar observer anterior si existe
      if (this.observer) {
         this.observer.disconnect();
      }

      // Crear MutationObserver como fallback para detectar cambios
      if (this.page) {
         this.observer = new MutationObserver(this.boundUpdateNavigation);

         // Observar cambios en el MultiRoute
         this.observer.observe(this.page, {
            childList: true,
            subtree: true
         });
      }
   }

   updateNavigation() {
      if (!this.page) return;

      // Limpiar navegación actual
      this.$navigation.innerHTML = '';
      
      // Buscar elementos con ID en el contenido actual del MultiRoute
      const idElements = this.page.querySelectorAll('[id]');

      if (idElements.length === 0) {
         return;
      }

      this.renderNavigationItems(idElements);
   }

   renderNavigationItems(idElements) {
      this.$navigation.innerHTML = '';
      
      idElements.forEach((element) => {
         // Filtrar elementos que no sean headers
         const tagName = element.tagName.toLowerCase();
         const isHeader = /^h[1-6]$/.test(tagName);
         
         if (!isHeader) return;

         const a = document.createElement('a');
         const titleText = element.querySelector('.doc-title-text')?.textContent
            || element.textContent
            || element.innerHTML;
         a.textContent = titleText;

         // Aplicar clase basada en la jerarquía
         for (let i = 1; i <= 6; i++) {
            if (tagName === `h${i}`) {
               a.classList.add(`nav-h${i}`);
               break;
            }
         }

         if (element.id) {
            a.href = `#${element.id}`;
            a.addEventListener('click', (event) => {
               event.preventDefault();
               const targetElement = document.getElementById(element.id);
               if (targetElement) {
                  targetElement.scrollIntoView({ 
                     behavior: 'smooth', 
                     block: 'center' 
                  });
               }
            });
         }
         
         this.$navigation.appendChild(a);
      });
   }

   // Slice lifecycle: se llama via destroyComponent()
   // NO usamos disconnectedCallback porque el MultiRoute padre hace
   // innerHTML='' + appendChild al reusar componentes cacheados, y eso
   // dispararía disconnectedCallback eliminando listeners que no se
   // recuperarían. La limpieza real solo debe ocurrir via destroyComponent().
   beforeDestroy() {
      if (this.observer) {
         this.observer.disconnect();
      }
      if (this._page) {
         this._page.removeEventListener('route-rendered', this.boundUpdateNavigation);
      }
      window.removeEventListener('popstate', this.boundUpdateNavigation);
   }
   
}

customElements.define('slice-mynavigation', MyNavigation);
