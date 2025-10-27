// Configuración centralizada de rutas para la documentación de componentes visuales
export const visualComponentsRoutes = {
   // Ruta por defecto
   defaultRoute: {
      path: '/components',
      component: 'VisualComponentsHome',
      title: 'Visual Components Library'
   },

   // Sección de Input Components
   inputComponents: {
      title: 'Input Components',
      path: '/components/input',
      items: [
         { 
            title: 'Button', 
            path: '/components/input/button', 
            component: 'ButtonDocumentation' 
         },
         { 
            title: 'Input', 
            path: '/components/input/input', 
            component: 'InputDocumentation' 
         },
         { 
            title: 'Select', 
            path: '/components/input/select', 
            component: 'SelectDocumentation' 
         },
         { 
            title: 'Checkbox', 
            path: '/components/input/checkbox', 
            component: 'CheckboxDocumentation' 
         },
         { 
            title: 'Switch', 
            path: '/components/input/switch', 
            component: 'SwitchDocumentation' 
         }
      ]
   },

   // Sección de Navigation Components
   navigationComponents: {
      title: 'Navigation',
      path: '/components/navigation',
      items: [
         { 
            title: 'Navbar', 
            path: '/components/navigation/navbar', 
            component: 'NavBarDocumentation' 
         },
         { 
            title: 'TreeView', 
            path: '/components/navigation/treeview', 
            component: 'TreeViewDocumentation' 
         }
      ]
   },

   // Sección de Layout Components
   layoutComponents: {
      title: 'Layout',
      path: '/components/layout',
      items: [
         { 
            title: 'Card', 
            path: '/components/layout/card', 
            component: 'CardDocumentation' 
         },
         { 
            title: 'Grid', 
            path: '/components/layout/grid', 
            component: 'GridDocumentation' 
         },
         { 
            title: 'Layout', 
            path: '/components/layout/layout', 
            component: 'LayoutDocumentation' 
         },
         { 
            title: 'Details', 
            path: '/components/layout/details', 
            component: 'DetailsDocumentation' 
         }
      ]
   },

   // Sección de Display Components
   displayComponents: {
      title: 'Display',
      path: '/components/display',
      items: [
         { 
            title: 'Loading', 
            path: '/components/display/loading', 
            component: 'LoadingDocumentation' 
         },
         { 
            title: 'CodeVisualizer', 
            path: '/components/display/code-visualizer', 
            component: 'CodeVisualizerDocumentation' 
         }
      ]
   },

   // Sección de Routing Components
   routingComponents: {
      title: 'Routing',
      path: '/components/routing',
      items: [
         { 
            title: 'Route', 
            path: '/components/routing/route', 
            component: 'RouteDocumentation' 
         },
         { 
            title: 'MultiRoute', 
            path: '/components/routing/multiroute', 
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