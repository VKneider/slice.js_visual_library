import docsIndex from '../ComponentsPage/docsIndex.js';

export default class App extends HTMLElement {
   constructor() {
      super();
      slice.attachTemplate(this);
      this._mainRouter = null;
      this._titleGuardRegistered = false;
      this._titleByRoute = new Map(docsIndex.map((doc) => [doc.route, doc.title]));
      this._titleByRoute.set('/', 'Slice.js Components');
      this._titleByRoute.set('/docs', 'Components Library');
   }

   _resolveDocumentTitle(pathname) {
      const exactTitle = this._titleByRoute.get(pathname);
      if (exactTitle) {
         return `${exactTitle} | Slice.js`;
      }

      if (pathname.startsWith('/docs/')) {
         return 'Components Library | Slice.js';
      }

      return 'Slice.js';
   }

   async init() {
      if (!this._titleGuardRegistered && typeof slice.router?.beforeEach === 'function') {
         this._titleGuardRegistered = true;
         slice.router.beforeEach((to, from, next) => {
            document.title = this._resolveDocumentTitle(to?.path || '/');
            return next();
         });
      }

      document.title = this._resolveDocumentTitle(window.location.pathname || '/');

      // Crear el Navbar persistente (fuera del router)
      const navbar = await slice.build('Navbar', {
         position: 'fixed',
         logo: {
            src: '/images/Slice.js-logo.png',
            path: '/',
         },
          items: [
             { text: 'Home', path: '/' },
             { text: 'Components', path: '/docs' }
         ],
          buttons: [],
      });

      const themeSelector = await slice.build('ThemeSelector');

      // Insertar el Navbar en el contenedor específico
      const navbarContainer = this.querySelector('.app-navbar');
      navbar.querySelector('.nav_bar_buttons')?.appendChild(themeSelector);
      navbarContainer.appendChild(navbar);

      // Crear el router principal con las vistas
      this._mainRouter = await slice.build('MultiRoute', {
         routes: [
            { path: '/', component: 'VisualLibraryHome', title: 'Slice.js - Home' },
            { path: '/docs', component: 'ComponentsPage', title: 'Components Library' },
            { path: '/docs/${section}', component: 'ComponentsPage' },
            { path: '/docs/${section}/${page}', component: 'ComponentsPage' },
            { path: '/docs/${section}/${page}/${detail}', component: 'ComponentsPage' }
         ]
      });

      // Insertar el router en el contenedor de contenido
      const contentContainer = this.querySelector('.app-content');
      contentContainer.appendChild(this._mainRouter);
   }

   update() {
     if (this._mainRouter && typeof this._mainRouter.renderIfCurrentRoute === 'function') {
       this._mainRouter.renderIfCurrentRoute();
     }
   }
}

customElements.define('slice-app', App);
