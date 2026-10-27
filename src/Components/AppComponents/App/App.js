import ThemeOverride from '../ThemeCreator/ThemeOverride.js';

export default class App extends HTMLElement {
   constructor() {
      super();
      slice.attachTemplate(this);
      this._mainRouter = null;
      // Titles are not handled here: each route carries `metadata.title` in
      // routes.js and the Router applies it on every navigation (including the
      // first). That map used to live in this component, which meant a route
      // added to routes.js but forgotten here silently degraded to "Slice.js".
   }

   async init() {
      // Re-apply a custom theme saved by a previous visit to the Theme Creator.
      // It has to happen HERE rather than only inside ThemeCreator: this is the
      // shell for `/` and every `/docs*` route, so without it a saved theme
      // would silently vanish on reload everywhere except the editor itself.
      // Runs before the Navbar is built, so the navbar is themed too.
      ThemeOverride.shared().restore();

      // Crear el Navbar persistente (fuera del router)
      const navbar = await slice.build('Navbar', {
         position: 'fixed',
         logo: {
            src: '/images/Slice.js-logo.png',
            path: '/',
         },
          items: [
             { text: 'Home', path: '/' },
             { text: 'Components', path: '/docs' },
             // Top-level route (parser/lib/routesSync.js): it renders outside
             // this shell, so without an entry here nothing on the site links
             // to it and it is effectively unreachable.
             { text: 'Theme Creator', path: '/theme-creator' }
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
