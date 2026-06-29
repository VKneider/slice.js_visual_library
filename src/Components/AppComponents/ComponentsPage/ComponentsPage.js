import documentationRoutes from './documentationRoutes.generated.js';
import docRoutes from './docRoutes.generated.js';
import docsIndex from './docsIndex.js';
import { buildVisualRoutes, filterNavigationItems, toTreeViewItems, resolveInitialDocsPath } from './visualComponentRoutes.js';


export default class ComponentsPage extends HTMLElement {
   constructor(props) {
      super();
      slice.attachTemplate(this);
      slice.controller.setComponentProps(this, props);
      this.debuggerProps = [];
   }

   async init() {
      // Usar la configuración de rutas centralizada
      const { routes: routesConfig, buildCompactNavigationItems } = buildVisualRoutes(documentationRoutes, docsIndex);

      console.log('Visual Components MultiRoute items:', docRoutes);

      // Crear el MultiRoute con todas las rutas (usa docRoutes.generated.js para
      // que el bundle analyzer pueda detectar estaticamente los componentes)
      const visualComponentsMultiRoute = await slice.build('MultiRoute', {
         routes: docRoutes
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
           const treeView = await slice.build('TreeView', {
              items: treeItems,
              activePath: window.location.pathname,
               onClick: async (item) => {
                  if (item.path) {
                      treeView.setActiveTreeItem(item);
                      await slice.router.navigate(item.path);
                      if (typeof mainMenu.handleCloseMenu === 'function') {
                        mainMenu.handleCloseMenu();
                     }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      document.documentElement.scrollTop = 0;
                  }
               },
           });

          return treeView;
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

      // Agregar componentes al Layout
      layOut.onLayOut(mainMenu);
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
