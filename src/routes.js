const routes = [
   // Rutas principales
   { path: '/', component: 'App' },
   { path: '/docs', component: 'ComponentsPage' },
   { path: '/docs/input/input', component: 'ComponentsPage' },
   { path: '/docs/input/button', component: 'ComponentsPage' },
   { path: '/docs/input/select', component: 'ComponentsPage' },
   { path: '/docs/navigation/navbar', component: 'ComponentsPage' },
   { path: '/docs/layout/card', component: 'ComponentsPage' },
   { path: '/docs/internal/markdown-parser-rules', component: 'ComponentsPage' },
   // Ruta 404
   { path: '/404', component: 'NotFound' }
];

export default routes;
