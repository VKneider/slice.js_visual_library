const routes = [
   // Rutas principales
   { path: '/', component: 'App' },
   { 
      path: '/library', 
      component: 'ComponentsPage',
      children: [] // El MultiRoute manejará las rutas hijas dinámicamente
   },
   // Ruta 404
   { path: '/404', component: 'NotFound' }
];

export default routes;