export default class EmptyState extends HTMLElement {

   static props = {
      // An Icon name. Empty renders no icon at all, which is a legitimate
      // choice for a list that simply has nothing in it.
      icon: { type: 'string', default: 'inbox-full' },
      title: { type: 'string', default: '' },
      description: { type: 'string', default: '' },
      // The action is a real Button, so its label and destination live here.
      // `buttonOnClick` rather than `onClick` because the click belongs to the
      // child Button, not to the empty state itself.
      buttonLabel: { type: 'string', default: '' },
      buttonRoute: { type: 'string', default: '' },
      buttonOnClick: { type: 'function', default: null },
      iconSize: { type: 'string', default: 'large' },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.$iconSlot = this.querySelector('[data-el="icon"]');
      this.$title = this.querySelector('[data-el="title"]');
      this.$description = this.querySelector('[data-el="description"]');
      this.$action = this.querySelector('[data-el="action"]');
      this._button = null;

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      // setComponentProps runs the setters in the constructor, before the element
      // is connected. Building a child then would leave one orphan behind when
      // init() builds the real one, so the setters only record and init() renders.
      this._inited = true;
      await this._renderIcon();
      this._applyText();
      await this._renderButton();
   }

   // A child built with slice.build is not auto-cascaded, so rebuilds have to
   // tear the previous one down by hand.
   beforeDestroy() {
      this._destroyIcon();
      this._destroyButton();
   }

   async _renderIcon() {
      if (!this._inited) return;
      this._destroyIcon();
      if (!this._icon) return;
      this._iconEl = await slice.build('Icon', {
         name: this._icon,
         size: this._iconSize,
         color: 'currentColor',
      });
      this.$iconSlot.replaceChildren(this._iconEl);
   }

   _destroyIcon() {
      if (this._iconEl) {
         slice.controller.destroyComponent(this._iconEl);
         this._iconEl = null;
      }
      if (this.$iconSlot) this.$iconSlot.replaceChildren();
   }

   _applyText() {
      this.$title.textContent = this._title;
      this.$title.hidden = !this._title;
      this.$description.textContent = this._description;
      this.$description.hidden = !this._description;
   }

   async _renderButton() {
      if (!this._inited) return;
      this._destroyButton();
      if (!this._buttonLabel) return;

      const onClick =
         this._buttonOnClick ||
         (this._buttonRoute ? () => slice.router.navigate(this._buttonRoute) : null);
      if (!onClick) return;

      this._button = await slice.build('Button', {
         value: this._buttonLabel,
         onClick,
      });
      this.$action.appendChild(this._button);
   }

   _destroyButton() {
      if (this._button) {
         slice.controller.destroyComponent(this._button);
         this._button = null;
      }
      if (this.$action) this.$action.replaceChildren();
   }

   get icon() { return this._icon; }
   set icon(v) {
      this._icon = v || '';
      this._renderIcon();
   }

   get iconSize() { return this._iconSize; }
   set iconSize(v) {
      this._iconSize = v || 'large';
      this._renderIcon();
   }

   get title() { return this._title; }
   set title(v) { this._title = v || ''; this._applyText(); }

   get description() { return this._description; }
   set description(v) { this._description = v || ''; this._applyText(); }

   get buttonLabel() { return this._buttonLabel; }
   set buttonLabel(v) { this._buttonLabel = v || ''; this._renderButton(); }

   get buttonRoute() { return this._buttonRoute; }
   set buttonRoute(v) { this._buttonRoute = v || ''; this._renderButton(); }

   get buttonOnClick() { return this._buttonOnClick; }
   set buttonOnClick(v) { this._buttonOnClick = typeof v === 'function' ? v : null; this._renderButton(); }
}

customElements.define('slice-emptystate', EmptyState);