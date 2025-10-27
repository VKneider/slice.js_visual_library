// Configuración centralizada de rutas para la documentación de componentes visuales
export const visualComponentsRoutes = {
   // Ruta por defecto
   defaultRoute: {
      path: '/library',
      component: 'ComponentsHome',
      title: 'Visual Library'
   },

   // Sección de Input Components
   inputComponents: {
      title: 'Input Components',
      path: '/library/input',
      items: [
         { 
            title: 'Button', 
            path: '/library/input/button', 
            component: 'ButtonDocumentation' 
         },
         { 
            title: 'Input', 
            path: '/library/input/input', 
            component: 'InputDocumentation' 
         },
         { 
            title: 'Select', 
            path: '/library/input/select', 
            component: 'SelectDocumentation' 
         },
         { 
            title: 'Checkbox', 
            path: '/library/input/checkbox', 
            component: 'CheckboxDocumentation' 
         },
         { 
            title: 'Switch', 
            path: '/library/input/switch', 
            component: 'SwitchDocumentation' 
         }
      ]
   },

   // Sección de Navigation Components
   navigationComponents: {
      title: 'Navigation',
      path: '/library/navigation',
      items: [
         { 
            title: 'Navbar', 
            path: '/library/navigation/navbar', 
            component: 'NavBarDocumentation' 
         },
         { 
            title: 'TreeView', 
            path: '/library/navigation/treeview', 
            component: 'TreeViewDocumentation' 
         }
      ]
   },

   // Sección de Layout Components
   layoutComponents: {
      title: 'Layout',
      path: '/library/layout',
      items: [
         { 
            title: 'Card', 
            path: '/library/layout/card', 
            component: 'CardDocumentation' 
         },
         { 
            title: 'Grid', 
            path: '/library/layout/grid', 
            component: 'GridDocumentation' 
         },
         { 
            title: 'Layout', 
            path: '/library/layout/layout', 
            component: 'LayoutDocumentation' 
         },
         { 
            title: 'Details', 
            path: '/library/layout/details', 
            component: 'DetailsDocumentation' 
         }
      ]
   },

   // Sección de Display Components
   displayComponents: {
      title: 'Display',
      path: '/library/display',
      items: [
         { 
            title: 'Loading', 
            path: '/library/display/loading', 
            component: 'LoadingDocumentation' 
         },
         { 
            title: 'CodeVisualizer', 
            path: '/library/display/code-visualizer', 
            component: 'CodeVisualizerDocumentation' 
         }
      ]
   },

   // Sección de Routing Components
   routingComponents: {
      title: 'Routing',
      path: '/library/routing',
      items: [
         { 
            title: 'Route', 
            path: '/library/routing/route', 
            component: 'RouteDocumentation' 
         },
         { 
            title: 'MultiRoute', 
            path: '/library/routing/multiroute', 
            component: 'MultiRouteDocumentation' 
         }
      ]
   }
};

// Función para extraer todas las rutas planas para MultiRoute
export const getAllRoutes = (routesObj) => {
   const allRoutes = [];

   const processItems = (items) => {
      if (!items) return;

      items.forEach(item => {
         if (item.path && item.component) {
            allRoutes.push({
               path: item.path,
               component: item.component
            });
         }

         if (item.items) {
            processItems(item.items);
         }
      });
   };

   // Procesar cada sección principal
   Object.values(routesObj).forEach(section => {
      if (section.path && section.component) {
         allRoutes.push({
            path: section.path,
            component: section.component
         });
      }

      if (section.items) {
         processItems(section.items);
      }
   });

   return allRoutes;
};

// Función para convertir el config de rutas al formato del TreeView
export const createTreeViewItems = (routesConfig) => {
   return [
      {
         value: routesConfig.inputComponents.title,
         items: routesConfig.inputComponents.items.map(item => ({
            value: item.title,
            path: item.path,
            component: item.component
         }))
      },
      {
         value: routesConfig.navigationComponents.title,
         items: routesConfig.navigationComponents.items.map(item => ({
            value: item.title,
            path: item.path,
            component: item.component
         }))
      },
      {
         value: routesConfig.layoutComponents.title,
         items: routesConfig.layoutComponents.items.map(item => ({
            value: item.title,
            path: item.path,
            component: item.component
         }))
      },
      {
         value: routesConfig.displayComponents.title,
         items: routesConfig.displayComponents.items.map(item => ({
            value: item.title,
            path: item.path,
            component: item.component
         }))
      },
      {
         value: routesConfig.routingComponents.title,
         items: routesConfig.routingComponents.items.map(item => ({
            value: item.title,
            path: item.path,
            component: item.component
         }))
      }
   ];
};