import { texts } from '../../shared/text/texts.js';

// Defaults, lowest priority: the app's dictionary and any prop override them.
const t = texts('slice.notFound', {
   en: {
      title: 'Page Not Found',
      message: "The page you are looking for doesn't exist or has been moved.",
      home: 'Go Home'
   },
   es: {
      title: 'Página no encontrada',
      message: 'La página que buscas no existe o se ha movido.',
      home: 'Ir al inicio'
   }
});

export default class NotFound extends HTMLElement {

   static props = {};

   constructor(props) {
      super();
      slice.attachTemplate(this);

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      document.title = slice.translator?.enabled ? t('title') : '404 - Not Found';

      const container = this.querySelector('.home-btn-container');
      if (container) {
         const homeBtn = await slice.build('Button', {
            // A marker: the framework re-assigns it on a locale change.
            value: slice.translator?.enabled ? slice.translator.key('slice.notFound.home') : t('home'),
            customColor: { background: 'var(--primary-color-contrast)', text: 'var(--primary-color)' },
            onClick: () => slice.router.navigate('/'),
         });
         container.appendChild(homeBtn);
      }
   }
}

customElements.define('slice-notfound', NotFound);
