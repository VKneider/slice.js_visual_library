// A route-aware anchor. Unlike most components in this library there is no
// template and no `setComponentProps`: props arrive once in the constructor
// from whoever built the element, so the whole thing is rendered with DOM APIs
// (setAttribute / textContent) instead of an innerHTML template — a `path`
// like `javascript:...` or text containing markup can't inject into the page.
export default class Link extends HTMLElement {
   constructor(props = {}) {
      super();
      this.props = props;
      this.$icon = null;
      this.render(props);
      this.init();
   }

   init() {
      this.addEventListener('click', this.onClick);
   }

   async onClick(event) {
      event.preventDefault();
      const href = this.querySelector('a')?.getAttribute('href');
      if (!href) return;
      // /page#section: the router gets the page, then the section is scrolled
      // to. #section alone stays on this page.
      const [path, hash] = href.split('#');
      if (path) await slice.router.navigate(path);
      if (!hash) return;
      requestAnimationFrame(() => {
         document.getElementById(decodeURIComponent(hash))?.scrollIntoView({ block: 'start' });
      });
   }

   /** The Icon child is a real component, so the framework will not cascade to it. */
   beforeDestroy() {
      if (this.$icon) {
         slice.controller.destroyComponent(this.$icon);
         this.$icon = null;
      }
   }

   render(props = {}) {
      const {
         path = '#',
         classes = '',
         text = '',
         icon = '',
         iconSize = '',
         iconColor = '',
         sub = '',
      } = props;

      const anchor = document.createElement('a');
      anchor.setAttribute('href', path);
      anchor.setAttribute('data-route', '');
      if (classes) anchor.className = classes;

      if (icon) {
         // Decorative: the link's accessible name is its text, so the glyph is
         // hidden from assistive tech rather than read out as a stray word.
         const holder = document.createElement('span');
         holder.className = 'slice-link-icon';
         holder.setAttribute('aria-hidden', 'true');
         anchor.appendChild(holder);

         slice.build('Icon', {
            name: icon,
            size: iconSize || 'medium',
            color: iconColor || 'currentColor',
         }).then((node) => {
            if (!this.isConnected) {
               // Detached before the build resolved.
               slice.controller.destroyComponent(node);
               return;
            }
            this.$icon = node;
            holder.appendChild(node);
         });
      }

      // With a subtitle the label needs its own block so the two stack.
      if (sub) {
         const title = document.createElement('span');
         title.className = 'slice-link-title';
         title.textContent = text;
         anchor.appendChild(title);

         const subtitle = document.createElement('span');
         subtitle.className = 'slice-link-sub';
         subtitle.textContent = sub;
         anchor.appendChild(subtitle);
      } else {
         anchor.appendChild(document.createTextNode(text));
      }

      this.replaceChildren(anchor);
   }
}

customElements.define('slice-link', Link);