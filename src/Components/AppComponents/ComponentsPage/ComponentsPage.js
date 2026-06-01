import {
   visualComponentsRoutes,
   getAllRoutes,
   buildCompactNavigationItems,
   filterNavigationItems,
   toTreeViewItems,
   resolveInitialDocsPath
} from './visualComponentRoutes.js';


export default class ComponentsPage extends HTMLElement {
   constructor(props) {
      super();
      slice.attachTemplate(this);
      slice.controller.setComponentProps(this, props);
      this.debuggerProps = [];
   }

   async init() {
      const docsIndex = slice.context.getState('docsIndex') || [];
      const titleByRoute = new Map(docsIndex.map(d => [d.route, d.title]));
      slice.router.afterEach((to) => {
        const title = titleByRoute.get(to.path) || 'Components Library';
        document.title = `${title} | Slice.js`;
      });

      // Usar la configuración de rutas centralizada
      const routesConfig = visualComponentsRoutes;

      const themeSelector = await slice.build('ThemeSelector');

      // Crear la barra de navegación
      const navBar = await slice.build('Navbar', {
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

      // Obtener todas las rutas planas para el MultiRoute
      const multiRouteItems = getAllRoutes(routesConfig);

      // Asegurarse que la ruta por defecto esté incluida (sin duplicar por path)
      if (!multiRouteItems.some(route => route.path === routesConfig.defaultRoute.path)) {
         multiRouteItems.push(routesConfig.defaultRoute);
      }

      // Evitar rutas duplicadas para prevenir dobles builds
      const seenPaths = new Set();
      const uniqueMultiRouteItems = multiRouteItems.filter((route) => {
         if (!route?.path || !route?.component) return false;
         if (seenPaths.has(route.path)) return false;
         seenPaths.add(route.path);
         return true;
      });

      console.log('Visual Components MultiRoute items:', uniqueMultiRouteItems);

      // Crear el MultiRoute con todas las rutas
      const visualComponentsMultiRoute = await slice.build('MultiRoute', {
         routes: uniqueMultiRouteItems
      });

      // Crear el MainMenu que contendrá el TreeView
      const mainMenu = await slice.build('MainMenu', {});

      const baseNavigationItems = buildCompactNavigationItems(routesConfig);

      const buildTreeView = async (query = '') => {
         const filteredItems = filterNavigationItems(baseNavigationItems, query);
         if (!filteredItems.length) {
            return null;
         }

         const treeItems = toTreeViewItems(filteredItems);
         return slice.build('TreeView', {
            items: treeItems,
            onClick: async (item) => {
               if (item.path) {
                   await slice.router.navigate(item.path);
                   window.scrollTo(0, 0);
                   if (typeof mainMenu.handleCloseMenu === 'function') {
                     mainMenu.handleCloseMenu();
                  }
               }
            },
         });
      };

      const initialTreeView = await buildTreeView('');
      if (initialTreeView) {
         mainMenu.add(initialTreeView);
      } else {
         mainMenu.setEmptyState('No components found');
      }

      mainMenu.addEventListener('docs-menu-search', async (event) => {
         const query = event?.detail?.query || '';
         const nextTreeView = await buildTreeView(query);

         if (nextTreeView) {
            mainMenu.setMenuTree(nextTreeView);
            return;
         }

         mainMenu.setEmptyState('No components found');
      });

      // Crear MyNavigation
      const myNavigation = await slice.build('MyNavigation', {
         page: visualComponentsMultiRoute,
      });

      // Crear el Layout
      const layOut = await slice.build('Layout', {
         view: visualComponentsMultiRoute,
      });

      navBar.querySelector('.nav_bar_buttons')?.appendChild(themeSelector);

      // Agregar componentes al Layout
      layOut.onLayOut(mainMenu);
      layOut.onLayOut(navBar);
      layOut.onLayOut(myNavigation);

      // Añadir el Layout al componente
      this.appendChild(layOut);

      const defaultDocsPath = routesConfig?.defaultRoute?.path || '/docs';
      const initialPath = resolveInitialDocsPath(window.location.pathname, defaultDocsPath);

      if (window.location.pathname !== initialPath) {
         await slice.router.navigate(initialPath);
      }

      if (typeof visualComponentsMultiRoute.renderIfCurrentRoute === 'function') {
         await visualComponentsMultiRoute.renderIfCurrentRoute();
      }
   }
}

customElements.define('slice-components-page', ComponentsPage);
