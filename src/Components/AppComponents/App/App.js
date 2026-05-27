export default class App extends HTMLElement {
   constructor() {
      super();
      slice.attachTemplate(this);
   }

   async init() {
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
         buttons: [
            {
               value: 'Change Theme',
               onClickCallback: async () => {
                  const theme = slice.stylesManager.themeManager.currentTheme;
                  if (theme === 'Purple') {
                     await slice.setTheme('PurpleDark');
                  } else {
                     await slice.setTheme('Purple');
                  }
               },
            },
         ],
      });

      // Insertar el Navbar en el contenedor específico
      const navbarContainer = this.querySelector('.app-navbar');
      navbarContainer.appendChild(navbar);

      // Crear el router principal con las vistas
      const mainRouter = await slice.build('MultiRoute', {
         routes: [
            {
               path: '/',
               component: 'VisualLibraryHome',
               title: 'Slice.js - Home'
            },
             {
                path: '/docs',
                component: 'ComponentsPage',
                title: 'Components Library'
             }
         ]
      });

      // Insertar el router en el contenedor de contenido
      const contentContainer = this.querySelector('.app-content');
      contentContainer.appendChild(mainRouter);
   }
}

customElements.define('slice-app', App);
