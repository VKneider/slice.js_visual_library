import { visualComponentsRoutes, getAllRoutes, createTreeViewItems } from './visualComponentRoutes.js';

export default class ComponentsPage extends HTMLElement {
   constructor(props) {
      super();
      slice.attachTemplate(this);
      slice.controller.setComponentProps(this, props);
      this.debuggerProps = [];
   }

   async init() {
      // Usar la configuración de rutas centralizada
      const routesConfig = visualComponentsRoutes;

      // Crear la barra de navegación
      const navBar = await slice.build('Navbar', {
         position: 'fixed',
         logo: {
            src: '/images/Slice.js-logo.png',
            path: '/',
         },
         items: [
            { text: 'Home', path: '/' },
            { text: 'Components', path: '/library' }
         ],
         buttons: [
            {
               value: 'Change Theme',
               onClickCallback: async () => {
                  let theme = slice.stylesManager.themeManager.currentTheme;
                  if (theme === 'Slice') {
                     await slice.setTheme('Light');
                  } else if (theme === 'Light') {
                     await slice.setTheme('Dark');
                  } else if (theme === 'Dark') {
                     await slice.setTheme('Slice');
                  }
               },
            },
         ],
      });

      // Obtener todas las rutas planas para el MultiRoute
      const multiRouteItems = getAllRoutes(routesConfig);

      // Asegurarse que la ruta por defecto esté incluida
      if (!multiRouteItems.some(route => route.path === routesConfig.defaultRoute.path)) {
         multiRouteItems.push(routesConfig.defaultRoute);
      }

      console.log('Visual Components MultiRoute items:', multiRouteItems);

      // Crear el MultiRoute con todas las rutas
      const visualComponentsMultiRoute = await slice.build('MultiRoute', {
         routes: multiRouteItems
      });

      // Crear el TreeView con la estructura jerárquica
      const treeviewItems = createTreeViewItems(routesConfig);
      const treeview = await slice.build('TreeView', {
         items: treeviewItems,
         onClickCallback: async (item) => {
            if (item.path) {
               await slice.router.navigate(item.path);
            }
         },
      });

      // Crear el MainMenu que contendrá el TreeView
      const mainMenu = await slice.build('MainMenu', {});
      mainMenu.add(treeview);

      // Crear MyNavigation
      const myNavigation = await slice.build('MyNavigation', {
         page: visualComponentsMultiRoute,
      });

      // Crear el Layout
      const layOut = await slice.build('Layout', {
         view: visualComponentsMultiRoute,
      });

      // Agregar componentes al Layout
      layOut.onLayOut(mainMenu);
      layOut.onLayOut(navBar);
      layOut.onLayOut(myNavigation);

      // Renderizar si estamos en la ruta /library
      if (window.location.pathname === '/library' || window.location.pathname.startsWith('/library/')) {
         await visualComponentsMultiRoute.renderIfCurrentRoute();
      }

      // Añadir el Layout al componente
      this.appendChild(layOut);
   }
}

customElements.define('slice-components-page', ComponentsPage);