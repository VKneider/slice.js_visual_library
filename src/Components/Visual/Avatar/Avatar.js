// Avatar — a person (or a team, a project) as a small picture.
//
//   await slice.build('Avatar', { src: user.photo, name: user.name, status: 'online' });
//
// What it shows, in order: the picture (`src`); if there is none or it fails
// to load, the initials of `name` on a colour that comes from the name (the
// same person always gets the same colour); without a name, an icon.
//
// It is an image with a name (role="img") unless it does something: with
// `onClick` it is a button, with `path` or `href` a link.

const SIZES = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };
const SHAPES = ['circle', 'rounded'];
const STATUSES = ['online', 'away', 'busy', 'offline'];

const TEXTS = {
   online: 'Online',
   away: 'Away',
   busy: 'Busy',
   offline: 'Offline',
   unknown: 'Unknown user',
};

// "Ana María López" → "AL", "Victor" → "V", "  " → "".
function initialsOf(name) {
   const words = String(name || '').trim().split(/\s+/).filter(Boolean);
   if (!words.length) return '';
   const first = Array.from(words[0])[0] || '';
   const last = words.length > 1 ? Array.from(words[words.length - 1])[0] || '' : '';
   return (first + last).toLocaleUpperCase();
}

// A hue from the name, stable across reloads and devices.
function hueOf(text) {
   let hash = 0;
   for (const ch of String(text)) hash = (hash * 31 + ch.codePointAt(0)) | 0;
   return Math.abs(hash) % 360;
}

export default class Avatar extends HTMLElement {
   static props = {
      src: { type: 'string', default: '' },
      // The person's name: the accessible name, the initials and the colour.
      name: { type: 'string', default: '' },
      // Accessible name when it should differ from `name` ("Your profile").
      alt: { type: 'string', default: '' },
      // Shown without a picture or a name.
      icon: { type: 'string', default: 'user' },
      // 'xs' | 'sm' | 'md' | 'lg' | 'xl', or pixels.
      size: { type: 'any', default: 'md' },
      shape: { type: 'string', default: 'circle', allowedValues: SHAPES },
      status: { type: 'string', default: '', allowedValues: ['', ...STATUSES] },
      // A count (3) or a short word on the corner, as Badge props or a value.
      badge: { type: 'any', default: null },
      // A colour of your own for the initials' background.
      color: { type: 'string', default: '' },
      onClick: { type: 'function', default: null },
      path: { type: 'string', default: '' },
      href: { type: 'string', default: '' },
      texts: { type: 'object', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.classList.add('slice-avatar');

      this.$image = /** @type {HTMLImageElement} */ (this.querySelector('.slice-avatar__image'));
      this.$initials = this.querySelector('.slice-avatar__initials');
      this.$icon = this.querySelector('.slice-avatar__icon');
      this.$status = this.querySelector('.slice-avatar__status');
      this.$badge = this.querySelector('.slice-avatar__badge');

      this._src = '';
      this._name = '';
      this._alt = '';
      this._iconName = 'user';
      this._size = 'md';
      this._shape = 'circle';
      this._status = '';
      this._badge = null;
      this._color = '';
      this._onClick = null;
      this._path = '';
      this._href = '';
      this._texts = { ...TEXTS };
      this._failed = '';
      this._built = { icon: null, badge: null };

      this._handleError = () => {
         this._failed = this._src;
         this._paint();
      };
      this._handleLoad = () => this._paint();
      this._handleClick = (event) => this._activate(event);
      this._handleKey = (event) => {
         if (event.key === 'Enter' || (event.key === ' ' && this._onClick)) {
            event.preventDefault();
            this._activate(event);
         }
      };

      slice.controller.setComponentProps(this, props);
   }

   init() {
      this._ready = true;
      this.$image.addEventListener('error', this._handleError);
      this.$image.addEventListener('load', this._handleLoad);
      this.addEventListener('click', this._handleClick);
      this.addEventListener('keydown', this._handleKey);
      this._applySize();
      this._paint();
      this._paintStatus();
      this._paintBadge();
      this._applyRole();
   }

   beforeDestroy() {
      this.$image.removeEventListener('error', this._handleError);
      this.$image.removeEventListener('load', this._handleLoad);
      this.removeEventListener('click', this._handleClick);
      this.removeEventListener('keydown', this._handleKey);
      for (const key of Object.keys(this._built)) {
         if (this._built[key]) slice.controller.destroyComponent(this._built[key]);
         this._built[key] = null;
      }
   }

   // ── Props ──────────────────────────────────────────────────────

   get src() { return this._src; }
   set src(value) {
      this._src = value ? String(value) : '';
      this._failed = '';
      this._ready && this._paint();
   }

   get name() { return this._name; }
   set name(value) {
      this._name = value ? String(value) : '';
      if (this._ready) { this._paint(); this._applyRole(); }
   }

   get alt() { return this._alt; }
   set alt(value) { this._alt = value ? String(value) : ''; this._ready && this._applyRole(); }

   get icon() { return this._iconName; }
   set icon(value) { this._iconName = value ? String(value) : 'user'; this._ready && this._paint(); }

   get size() { return this._size; }
   set size(value) { this._size = value ?? 'md'; this._ready && this._applySize(); }

   get shape() { return this._shape; }
   set shape(value) { this._shape = SHAPES.includes(value) ? value : 'circle'; this.dataset.shape = this._shape; }

   get status() { return this._status; }
   set status(value) { this._status = STATUSES.includes(value) ? value : ''; this._ready && this._paintStatus(); }

   get badge() { return this._badge; }
   set badge(value) { this._badge = value === '' || value === undefined ? null : value; this._ready && this._paintBadge(); }

   get color() { return this._color; }
   set color(value) { this._color = value ? String(value) : ''; this._ready && this._paint(); }

   get onClick() { return this._onClick; }
   set onClick(value) { this._onClick = typeof value === 'function' ? value : null; this._ready && this._applyRole(); }

   get path() { return this._path; }
   set path(value) { this._path = value ? String(value) : ''; this._ready && this._applyRole(); }

   get href() { return this._href; }
   set href(value) { this._href = value ? String(value) : ''; this._ready && this._applyRole(); }

   get texts() { return this._texts; }
   set texts(value) {
      this._texts = { ...TEXTS, ...(value && typeof value === 'object' ? value : {}) };
      if (this._ready) { this._paintStatus(); this._applyRole(); }
   }

   /** The initials it shows (or would show) for `name`. */
   get initials() { return initialsOf(this._name); }

   /** What is on screen: 'image', 'initials' or 'icon'. */
   get showing() {
      if (this._src && this._failed !== this._src) return 'image';
      return this.initials ? 'initials' : 'icon';
   }

   // ── Painting ───────────────────────────────────────────────────

   _paint() {
      this.dataset.shape = this._shape;
      const showing = this.showing;
      this.dataset.showing = showing;

      this.$image.hidden = showing !== 'image';
      if (showing === 'image' && this.$image.getAttribute('src') !== this._src) this.$image.setAttribute('src', this._src);
      if (showing !== 'image' && this._failed !== this._src && !this._src) this.$image.removeAttribute('src');

      // The initials sit under the picture while it loads, so the place is
      // never blank, and stay if it fails.
      this.$initials.hidden = !this.initials || showing === 'icon';
      this.$initials.textContent = this.initials;

      const hue = hueOf(this._name || this._alt || '?');
      this.style.setProperty('--slice-avatar-hue', String(hue));
      if (this._color) this.style.setProperty('--slice-avatar-bg', this._color);
      else this.style.removeProperty('--slice-avatar-bg');

      this.$icon.hidden = showing !== 'icon';
      if (showing === 'icon') this._ensureIcon();
   }

   async _ensureIcon() {
      if (this._built.icon) {
         if (this._built.icon.name !== this._iconName) this._built.icon.name = this._iconName;
         return;
      }
      if (this._iconPending) return;
      this._iconPending = true;
      const icon = await slice.build('Icon', { name: this._iconName, size: '58%' });
      this._iconPending = false;
      if (!icon) return;
      if (!this._ready) {
         slice.controller.destroyComponent(icon);
         return;
      }
      this._built.icon = icon;
      if (icon.name !== this._iconName) icon.name = this._iconName;
      this.$icon.replaceChildren(icon);
   }

   _applySize() {
      const px = typeof this._size === 'number' ? this._size : SIZES[this._size] ?? (parseFloat(this._size) || SIZES.md);
      this.style.setProperty('--slice-avatar-size', `${px}px`);
      this.dataset.size = Object.keys(SIZES).find((key) => SIZES[key] === px) || 'custom';
   }

   _paintStatus() {
      this.$status.hidden = !this._status;
      if (this._status) {
         this.$status.dataset.status = this._status;
         this.$status.setAttribute('role', 'img');
         this.$status.setAttribute('aria-label', this._texts[this._status] || this._status);
      }
      this._applyRole();
   }

   async _paintBadge() {
      const config = this._badge;
      if (config === null) {
         if (this._built.badge) slice.controller.destroyComponent(this._built.badge);
         this._built.badge = null;
         this.$badge.replaceChildren();
         this.$badge.hidden = true;
         return;
      }
      const props = typeof config === 'object' ? config : typeof config === 'number' ? { value: config } : { label: String(config) };
      if (this._built.badge) {
         Object.assign(this._built.badge, props);
         this.$badge.hidden = false;
         return;
      }
      const badge = await slice.build('Badge', { size: 'sm', tone: 'danger', variant: 'filled', ...props });
      if (!badge) return;
      if (!this._ready || this._badge === null) {
         slice.controller.destroyComponent(badge);
         return;
      }
      this._built.badge = badge;
      this.$badge.replaceChildren(badge);
      this.$badge.hidden = false;
   }

   // An image with a name, or a control when it does something.
   _applyRole() {
      const label = this._alt || this._name || this._texts.unknown;
      const status = this._status ? `, ${this._texts[this._status] || this._status}` : '';
      const interactive = !!(this._onClick || this._path || this._href);
      this.setAttribute('role', this._onClick ? 'button' : this._path || this._href ? 'link' : 'img');
      this.setAttribute('aria-label', label + status);
      if (interactive) this.setAttribute('tabindex', '0');
      else this.removeAttribute('tabindex');
      this.classList.toggle('is-interactive', interactive);
   }

   _activate(event) {
      if (this._onClick) {
         this._onClick({ avatar: this, event });
         return;
      }
      if (this._path) {
         event.preventDefault?.();
         if (typeof slice?.router?.navigate === 'function') slice.router.navigate(this._path);
         else window.location.assign(this._path);
         return;
      }
      if (this._href) window.location.assign(this._href);
   }
}

customElements.define('slice-avatar', Avatar);