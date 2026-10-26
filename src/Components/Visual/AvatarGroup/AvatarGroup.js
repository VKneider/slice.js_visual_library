// AvatarGroup — a few people as overlapping avatars, and "+N" for the rest.
//
//   await slice.build('AvatarGroup', { items: members, max: 4 });
//
// Each item takes Avatar's props ({ name, src, status, … }). Every face shows
// its name in a tooltip (through the app's ToolTipProvider), and "+N" lists
// the people it stands for. The whole group has one accessible name:
// "6 people: Ana, Luis, María and 3 more".

const TEXTS = {
   label: '{count} people: {names}',
   more: 'and {count} more',
   moreLabel: '{count} more',
};

function fill(template, values) {
   return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

export default class AvatarGroup extends HTMLElement {
   static props = {
      items: { type: 'array', default: [] },
      // How many faces before "+N".
      max: { type: 'number', default: 4 },
      size: { type: 'any', default: 'sm' },
      shape: { type: 'string', default: 'circle', allowedValues: ['circle', 'rounded'] },
      // Show each name on hover and focus.
      tooltips: { type: 'boolean', default: true },
      // A click on "+N" (open the full list); without it "+N" is not a button.
      onMoreClick: { type: 'function', default: null },
      texts: { type: 'object', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.classList.add('slice-avatar-group');
      this.$stack = this.querySelector('.slice-avatar-group__stack');
      this._items = [];
      this._max = 4;
      this._size = 'sm';
      this._shape = 'circle';
      this._tooltips = true;
      this._onMoreClick = null;
      this._texts = { ...TEXTS };
      this._avatars = [];
      slice.controller.setComponentProps(this, props);
   }

   async init() {
      this._ready = true;
      this.setAttribute('role', 'group');
      await this._render();
      if (this._tooltips) {
         this._tips = await slice.build('ToolTipProvider', { singleton: true });
         if (this._ready) this._tips?.scope(this);
      }
   }

   beforeDestroy() {
      this._ready = false;
      this._tips?.unscope(this);
      this._destroyAvatars();
   }

   get items() { return this._items; }
   set items(value) { this._items = Array.isArray(value) ? value.filter((i) => i && typeof i === 'object') : []; this._ready && this._render(); }

   get max() { return this._max; }
   set max(value) { this._max = Math.max(1, Math.trunc(Number(value) || 4)); this._ready && this._render(); }

   get size() { return this._size; }
   set size(value) { this._size = value ?? 'sm'; this._ready && this._render(); }

   get shape() { return this._shape; }
   set shape(value) { this._shape = value === 'rounded' ? 'rounded' : 'circle'; this._ready && this._render(); }

   get tooltips() { return this._tooltips; }
   set tooltips(value) { this._tooltips = value !== false; }

   get onMoreClick() { return this._onMoreClick; }
   set onMoreClick(value) { this._onMoreClick = typeof value === 'function' ? value : null; this._ready && this._render(); }

   get texts() { return this._texts; }
   set texts(value) { this._texts = { ...TEXTS, ...(value && typeof value === 'object' ? value : {}) }; this._ready && this._render(); }

   _destroyAvatars() {
      for (const avatar of this._avatars) slice.controller.destroyComponent(avatar);
      this._avatars = [];
   }

   async _render() {
      const token = (this._token = (this._token || 0) + 1);
      const items = this._items;
      // "+1" would take the place of a face: show the face instead.
      const shown = items.length > this._max ? items.slice(0, this._max - 1) : items;
      const rest = items.slice(shown.length);

      // (A cast: the generated build types predate Avatar.)
      const built = await Promise.all(shown.map((item) => slice.build(/** @type {any} */ ('Avatar'), {
         size: this._size,
         shape: this._shape,
         ...item,
      })));
      if (token !== this._token || !this._ready) {
         for (const avatar of built) if (avatar) slice.controller.destroyComponent(avatar);
         return;
      }
      this._destroyAvatars();
      this._avatars = built.filter(Boolean);
      this.$stack.replaceChildren();
      for (const avatar of this._avatars) {
         const name = avatar.alt || avatar.name;
         // The group has the names; each face only shows them on hover.
         avatar.setAttribute('aria-hidden', 'true');
         if (this._tooltips && name) {
            avatar.setAttribute('data-tooltip', name);
            // Hover only: not one tab stop per face (the group's name lists them).
            if (!avatar.hasAttribute('tabindex')) avatar.setAttribute('tabindex', '-1');
         }
         this.$stack.append(avatar);
      }

      if (rest.length) {
         const more = document.createElement(this._onMoreClick ? 'button' : 'span');
         more.className = 'slice-avatar-group__more';
         if (more instanceof HTMLButtonElement) {
            more.type = 'button';
            more.addEventListener('click', (event) => this._onMoreClick?.({ items: rest, group: this, event }));
            more.setAttribute('aria-label', fill(this._texts.moreLabel, { count: rest.length }));
         } else {
            more.setAttribute('aria-hidden', 'true');
         }
         more.textContent = `+${rest.length}`;
         const names = rest.map((i) => i.alt || i.name).filter(Boolean);
         if (this._tooltips && names.length) {
            more.setAttribute('data-tooltip', names.join(', '));
            if (!(more instanceof HTMLButtonElement)) more.setAttribute('tabindex', '-1');
         }
         this.$stack.append(more);
      }

      const px = typeof this._size === 'number' ? this._size : { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 }[this._size] ?? (parseFloat(this._size) || 32);
      this.style.setProperty('--slice-avatar-group-size', `${px}px`);
      this.dataset.shape = this._shape;

      const names = shown.map((i) => i.alt || i.name).filter(Boolean);
      const listed = rest.length ? `${names.join(', ')} ${fill(this._texts.more, { count: rest.length })}` : names.join(', ');
      this.setAttribute('aria-label', fill(this._texts.label, { count: items.length, names: listed }));
   }
}

customElements.define('slice-avatar-group', AvatarGroup);