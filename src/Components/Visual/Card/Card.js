// Warns once per deprecated prop name (kept module-scoped so each component
// reports a given alias only once per session).
const _sliceDeprecated = new Set();
function deprecate(oldName, newName) {
   if (_sliceDeprecated.has(oldName)) return;
   _sliceDeprecated.add(oldName);
   console.warn(`[Slice] "${oldName}" is deprecated; use "${newName}" instead.`);
}

export default class Card extends HTMLElement {

   static props = {
      title: {
         type: 'string',
         default: null
      },
      text: {
         type: 'string',
         default: null
      },
      // null, NOT { name: 'sliceJs' }: init() tests `if (this._icon ||
      // this._image)`, so a truthy default made every Card reserve a media
      // strip and render the SliceJS logo whether or not one was asked for.
      // `iconStyle` inside the object is accepted and ignored — it has been a
      // no-op since Lucide has no filled/outlined variants.
      //
      // `icon` is the BANNER: an image or a big mark above the content.
      headerIcon: {
         type: ['string', 'object'],
         default: null
      },
      icon: {
         type: ['string', 'object'],
         default: null
      },
      customColor: {
         type: 'object',
         default: null
      },
      image: {
         type: 'string',
         default: null
      },
      actions: {
         type: 'array',
         default: []
      },
      variant: {
         type: 'string',
         default: 'default',
         allowedValues: ['default', 'elevated', 'outlined', 'minimal']
      },
      interactive: {
         type: 'boolean',
         default: true
      },
      onClick: {
         type: 'function',
         default: null
      },
      // Canonical expanded-state flag. `isOpen` is kept as a deprecated alias.
      // Default is null (not false) so the canonical setter can ignore the
      // default and let the deprecated alias fill the shared field (§7).
      open: {
         type: 'boolean',
         default: null
      },
      isOpen: {
         type: 'boolean',
         default: null
      },
      details: {
         type: 'string',
         default: null
      },
      badge: {
         type: 'string',
         default: null
      },
      disabled: {
         type: 'boolean',
         default: false
      }
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.classList.add('slice-card');

      this.$card = this;
      this.$title = this.querySelector('.card-title');
      this.$headerIcon = this.querySelector('.card-header-icon');
      this.$text = this.querySelector('.card-text');
      this.$textTooltip = this.querySelector('.card-text-tooltip');
      this.$media = this.querySelector('.card-media');
      this.$details = this.querySelector('.card-details');
      this.$detailsContent = this.querySelector('.card-details-content');
      this.$badge = this.querySelector('.card-badge');
      this.$toggle = this.querySelector('.card-toggle');
      this.$mediaContent = this.querySelector('.card-media-content');
      this.$actions = this.querySelector('.card-actions');

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      this.setupVariant();
      this.setupContent();

      // setupMedia() both fills the strip AND hides it when there is nothing
      // to show. Calling it only when there is media therefore left the strip
      // at whatever display the CSS defaults to — a bare card kept an empty
      // band across the top.
      const mediaName = typeof this._icon === 'string' ? this._icon : this._icon?.name;
      const hasMedia = !!this._image || !!mediaName;
      if (hasMedia) {
         await this.setupMedia();
      } else if (this.$media) {
         this.$media.style.display = 'none';
      }

      await this.setupActions();
      await this.setupToggle();
      await this.setupHeaderIcon();
      this.setupEventListeners();
      this.applyCustomStyling();
      this.updateState();

      this._initialized = true;
   }

   setupVariant() {
      this.$card.classList.remove('card-default', 'card-elevated', 'card-outlined', 'card-minimal');
      if (this.variant) {
         this.$card.classList.add(`card-${this.variant}`);
      } else {
         this.$card.classList.add('card-default');
      }
   }

   setupContent() {
      if (this.$title) {
         if (this.title) {
            this.$title.textContent = this.title;
            this.$title.style.display = 'block';
         } else {
            this.$title.style.display = 'none';
         }
      }

      if (this.$text) {
         if (this.text) {
            this.$text.textContent = this.text;
            this.$text.style.display = 'block';
         } else {
            this.$text.style.display = 'none';
         }
      }

      if (this.$details && this.$detailsContent) {
         if (this.details) {
            this.$detailsContent.textContent = this.details;
            this.$details.style.display = 'block';
         } else {
            this.$details.style.display = 'none';
         }
      }

      if (this.$badge) {
         if (this.badge) {
            this.$badge.textContent = this.badge;
         } else {
            this.$badge.textContent = '';
         }
      }
   }

   async setupMedia() {
      if (this.$mediaContent) {
         slice.controller.destroyByContainer(this.$mediaContent);   // destroy a prior Icon child (no leak)
         this.$mediaContent.innerHTML = '';
      }

      if (this.image) {
         const img = document.createElement('img');
         img.src = this.image;
         img.alt = this.title || 'Card image';
         img.classList.add('card-image');
         img.onerror = () => {
            this.setupIconInMedia();
         };
         this.$mediaContent.appendChild(img);
      } else if (this.icon) {
         await this.setupIconInMedia();
      } else {
         if (this.$media) {
            this.$media.style.display = 'none';
         }
         return;
      }

      if (this.$media) {
         this.$media.style.display = 'flex';
      }
   }

   async setupIconInMedia() {
      try {
         if (!this.$mediaContent) {
            return;
         }

         slice.controller.destroyByContainer(this.$mediaContent);   // destroy a prior Icon child (no leak)
         this.$mediaContent.innerHTML = '';

         const iconName = typeof this.icon === 'string' ? this.icon : this.icon?.name;
         if (!iconName) {
            return;
         }

         // No iconStyle: deprecated no-op, and passing it only earned a
         // console warning on every card that has a media icon.
         const iconElement = await slice.build('Icon', {
            name: iconName,
            size: (typeof this.icon === 'object' && this.icon.size) || '32px',
            color: (typeof this.icon === 'object' && this.icon.color) || 'var(--primary-color)'
         });

         if (iconElement) {
            this.$mediaContent.appendChild(iconElement);
         }
      } catch (error) {
         console.warn('Card: Failed to create icon', error);
      }
   }

   async setupActions() {
      // Guard with the promise, not a flag: setupActions is async and can be
      // entered twice in the same tick (init() plus a prop setter). Both would
      // pass a boolean check, both would clear the container, and both would
      // then build into it — 4 buttons for 2 actions.
      if (this._actionsBuilding) {
         await this._actionsBuilding;
         return;
      }
      this._actionsBuilding = this._buildActions();
      try {
         await this._actionsBuilding;
      } finally {
         this._actionsBuilding = null;
      }
   }

   async _buildActions() {
      slice.controller.destroyByContainer(this.$actions);   // destroy prior Button children (no leak)
      this.$actions.innerHTML = '';

      if (!this.actions || this.actions.length === 0) {
         this.$actions.style.display = 'none';
         return;
      }

      this.$actions.style.display = 'flex';

      for (const action of this.actions) {
         try {
            const opts = {
               value: action.text || 'Action',
               onClick: action.onClick || (() => {})
            };
            if (action.color) {
               opts.customColor = action.color;
            }
            const button = await slice.build('Button', opts);
            this.$actions.appendChild(button);
         } catch (error) {
            console.warn('Card: Failed to create action button', error);
         }
      }
   }

   /**
    * The chevron is built here rather than sitting in the template. A
    * <slice-icon> in another component's template is instantiated racily — it
    * was sometimes a rendered SVG and sometimes an empty host, depending on
    * timing — and a child built with slice.build has a lifecycle we can own.
    */
   async setupToggle() {
      await this._destroyToggleIcon();

      if (this.details) {
         this.$toggle.style.display = 'flex';
         this.$toggleIcon = await slice.build('Icon', {
            sliceId: `${this.sliceId || 'card'}-toggle-icon`,
            name: 'chevron-down',
            size: '16px',
            color: 'currentColor',
         });
         if (this.$toggleIcon) this.$toggle.appendChild(this.$toggleIcon);
      } else {
         this.$toggle.style.display = 'none';
      }
   }

   /**
    * Header icon: the small mark beside the title. This is the pattern most
    * Cards use for an avatar or a glyph, and it is a DIFFERENT slot from
    * `icon` — that one is the banner above the content.
    *
    * Accepts a bare name or { name, size, color }.
    */
   async setupHeaderIcon() {
      await this._destroyHeaderIcon();

      const spec = this._headerIcon;
      const name = typeof spec === 'string' ? spec : spec?.name;
      if (!name) {
         this.$headerIcon.hidden = true;
         return;
      }

      const options = typeof spec === 'string' ? {} : spec;
      this.$headerIcon.hidden = false;
      // currentColor, NOT --primary-color: the chip is filled with --primary
      // and sets its own colour to the contrast token. An inline
      // `color: var(--primary-color)` on the icon beat that and painted a
      // purple glyph on a purple chip — present in the DOM, invisible on screen.
      this.$headerIconEl = await slice.build('Icon', {
         sliceId: `${this.sliceId || 'card'}-header-icon`,
         name,
         size: options.size || '20px',
         color: options.color || 'currentColor',
      });
      if (this.$headerIconEl) this.$headerIcon.appendChild(this.$headerIconEl);
   }

   async _destroyHeaderIcon() {
      if (!this.$headerIconEl) return;
      slice.controller.destroyComponent(this.$headerIconEl);
      this.$headerIconEl = null;
      if (this.$headerIcon) {
         this.$headerIcon.hidden = true;
         this.$headerIcon.replaceChildren();
      }
   }

   async _destroyToggleIcon() {
      if (!this.$toggleIcon) return;
      slice.controller.destroyComponent(this.$toggleIcon);
      this.$toggleIcon = null;
      if (this.$toggle) this.$toggle.replaceChildren();
   }

   /**
    * Card builds Icon and Button children. Those are not auto-cascaded on
    * destroy — a Service among them never would be — so without this the
    * chevron, the media icon and every action button stayed registered in
    * activeComponents for the life of the page.
    */
   /** Destroy every child this Card built: the media icon and the action buttons. */
   _destroyBuilt() {
      slice.controller.destroyByContainer(this.$mediaContent);
      slice.controller.destroyByContainer(this.$actions);
      this._destroyToggleIcon();
      this._destroyHeaderIcon();
   }

   beforeDestroy() {
      this._destroyBuilt();

      if (this._toggleListener) {
         this.$toggle?.removeEventListener('click', this._toggleListener);
         this._toggleListener = null;
      }
      if (this._cardClickListener) {
         this.removeEventListener('click', this._cardClickListener);
         this._cardClickListener = null;
      }
      if (this._keydownListener) {
         this.removeEventListener('keydown', this._keydownListener);
         this._keydownListener = null;
      }
   }

   setupEventListeners() {
      if (this._toggleListener) {
         this.$toggle.removeEventListener('click', this._toggleListener);
      }
      if (this._cardClickListener) {
         this.$card.removeEventListener('click', this._cardClickListener);
      }
      if (this._keydownListener) {
         this.$card.removeEventListener('keydown', this._keydownListener);
      }

      this._toggleListener = (e) => {
         e.stopPropagation();
         this.toggleOpen();
      };
      this.$toggle.addEventListener('click', this._toggleListener);

      if (this.interactive && this.onClick) {
         this._cardClickListener = (e) => {
            if (!this.disabled && !e.target.closest('.card-toggle') && !e.target.closest('.card-actions')) {
               this.onClick(e);
            }
         };
         this.$card.addEventListener('click', this._cardClickListener);
      }

      this._keydownListener = (e) => {
         if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (this.details) {
               this.toggleOpen();
            } else if (this.onClick && this.interactive) {
               this.onClick(e);
            }
         }
      };
      this.$card.addEventListener('keydown', this._keydownListener);

      if (this.interactive) {
         this.$card.setAttribute('tabindex', '0');
         this.$card.setAttribute('role', 'button');
      }
   }

   toggleOpen() {
      this.open = !this.open;
      this.updateOpenState();
   }

   updateOpenState() {
      if (this.open) {
         this.$card.classList.add('is-open');
         this.$card.setAttribute('aria-expanded', 'true');
      } else {
         this.$card.classList.remove('is-open');
         this.$card.setAttribute('aria-expanded', 'false');
      }
   }

   updateState() {
      if (this.disabled) {
         this.$card.classList.add('disabled');
         this.$card.setAttribute('aria-disabled', 'true');
         this.$card.style.pointerEvents = 'none';
         this.$card.style.opacity = '0.6';
      } else {
         this.$card.classList.remove('disabled');
         this.$card.removeAttribute('aria-disabled');
         this.$card.style.pointerEvents = '';
         this.$card.style.opacity = '';
      }

      if (this.interactive) {
         this.$card.classList.add('interactive');
      } else {
         this.$card.classList.remove('interactive');
      }

      this.updateOpenState();
   }

   applyCustomStyling() {
      if (this.customColor) {
         if (this.customColor.accent) {
            this.$card.style.setProperty('--custom-accent', this.customColor.accent);
         }
         if (this.customColor.background) {
            this.$card.style.setProperty('--custom-bg', this.customColor.background);
         }
         if (this.customColor.text) {
            this.$card.style.setProperty('--custom-text', this.customColor.text);
         }
         if (this.customColor.card && this.$media) {
            this.$media.style.background = this.customColor.card;
         }
      }
   }

   get title() { return this._title; }
   set title(value) {
      this._title = value;
      if (this.$title) {
         this.setupContent();
      }
   }

   get text() { return this._text; }
   set text(value) {
      this._text = value;
      if (this.$text && this._initialized) {
         this.setupContent();
      }
   }

   get details() { return this._details; }
   set details(value) {
      this._details = value;
      if (this.$details) {
         this.setupContent();
         // Fire-and-forget: a setter cannot await, and making it async would
         // change when callers observe the prop. The chevron appears a tick
         // later, which is what the framework's own prop flow already does.
         this.setupToggle();
      }
   }

   get badge() { return this._badge; }
   set badge(value) {
      this._badge = value;
      if (this.$badge) {
         this.setupContent();
      }
   }

   get variant() { return this._variant || 'default'; }
   set variant(value) {
      this._variant = value;
      if (this.$card && this._initialized) {
         this.setupVariant();
      }
   }

   // Canonical expanded-state flag. Ignores the null default so the alias can
   // still contribute a value (§7).
   get open() { return this._open || false; }
   set open(value) {
      if (value === null || value === undefined) return;
      this._open = Boolean(value);
      if (this.$card) {
         this.updateOpenState();
      }
   }

   // Deprecated alias for `open`. Fills the shared field only if the canonical
   // prop did not, and warns once.
   get isOpen() { return this._open || false; }
   set isOpen(value) {
      if (value === null || value === undefined) return;
      this._open ??= Boolean(value);
      deprecate('isOpen', 'open');
      if (this.$card) {
         this.updateOpenState();
      }
   }

   get disabled() { return this._disabled || false; }
   set disabled(value) {
      this._disabled = Boolean(value);
      if (this.$card) {
         this.updateState();
      }
   }

   get interactive() { return this._interactive !== false; }
   set interactive(value) {
      this._interactive = Boolean(value);
      if (this.$card) {
         this.updateState();
      }
   }

   get customColor() { return this._customColor; }
   set customColor(value) {
      this._customColor = value;
      if (this.$card) {
         this.applyCustomStyling();
      }
   }

   /**
    * Header icon. The setter is not optional: `setComponentProps` nulls the
    * derived `_headerIcon` for every declared prop and then assigns to the
    * PROPERTY, so without this the value never reaches the field and the slot
    * silently stays hidden.
    */
   get headerIcon() { return this._headerIcon; }
   set headerIcon(value) {
      this._headerIcon = value ?? null;
      if (this._initialized) this.setupHeaderIcon();
   }

   get icon() { return this._icon; }
   set icon(value) {
      this._icon = value;
      if (this._initialized && this.$media && !this._image && this.$mediaContent) {
         this.setupMedia();
      }
   }

   get image() { return this._image; }
   set image(value) {
      this._image = value;
      if (this._initialized && this.$media && !this._icon && this.$mediaContent) {
         this.setupMedia();
      }
   }

   get actions() { return this._actions || []; }
   set actions(value) {
      this._actions = value;
      if (this.$actions) {
         this.setupActions();
      }
   }

   get onClick() { return this._onClick; }
   set onClick(value) {
      this._onClick = value;
      if (this.$card) {
         this.setupEventListeners();
      }
   }

   // Imperative open/close helpers. `open` is now a property (the boolean
   // expanded state), so these are named *Card to avoid colliding with it.
   openCard() {
      this._open = true;
      if (this.$card) this.updateOpenState();
   }

   closeCard() {
      this._open = false;
      if (this.$card) this.updateOpenState();
   }

   toggle() {
      this.toggleOpen();
   }

   updateActions(newActions) {
      this.actions = newActions;
      this.setupActions();
   }

   enable() {
      this.disabled = false;
   }

   disable() {
      this.disabled = true;
   }

   async refreshMedia() {
      if (this._initialized && this.$media) {
         await this.setupMedia();
      }
   }

   async setIcon(iconData) {
      this._icon = iconData;
      if (this._initialized && this.$media && !this._image) {
         await this.setupMedia();
      }
   }

   async setImage(imageUrl) {
      this._image = imageUrl;
      if (this._initialized && this.$media && !this._icon) {
         await this.setupMedia();
      }
   }
}

customElements.define('slice-card', Card);
