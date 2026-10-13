// A drop zone that is also a real file input. The zone is a <label> wrapping a
// visually-hidden <input type="file">, so click, tap AND keyboard all open the
// picker with no extra key handling — the browser gives that to a label for
// free, which a clickable <div> would not.
const ACCEPT_ALL = '';   // empty `accept` means "anything", so there is no default to override

export default class FileUpload extends HTMLElement {

   static props = {
      // Comma-separated extensions or MIME types, e.g. "image/*,.png,.jpg".
      accept: { type: 'string', default: ACCEPT_ALL },
      multiple: { type: 'boolean', default: false },
      disabled: { type: 'boolean', default: false },
      prompt: { type: 'string', default: 'Drag files here, or click to choose' },
      hint: { type: 'string', default: '' },
      // An Icon name for the zone glyph; empty renders none.
      icon: { type: 'string', default: 'upload' },
      // Show the picked files under the zone. Off by default: a library
      // component should not decide how you present a file list.
      list: { type: 'boolean', default: false },
      onFiles: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.$zone = this.querySelector('.slice_file_upload__zone');
      this.$input = this.querySelector('input[type="file"]');
      this.$prompt = this.querySelector('[data-el="prompt"]');
      this.$hint = this.querySelector('[data-el="hint"]');
      this.$iconSlot = this.querySelector('[data-el="icon"]');
      this.$list = this.querySelector('[data-el="list"]');

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      this._inited = true;
      this.$input.addEventListener('change', () => {
         this._emit(this.$input.files);
         // Reset so picking the SAME file twice still fires a change event.
         this.$input.value = '';
      });

      for (const type of ['dragenter', 'dragover']) {
         this.$zone.addEventListener(type, (event) => {
            event.preventDefault();
            if (!this._disabled) this.$zone.classList.add('is-over');
         });
      }
      for (const type of ['dragleave', 'dragend']) {
         this.$zone.addEventListener(type, () => this.$zone.classList.remove('is-over'));
      }
      this.$zone.addEventListener('drop', (event) => {
         event.preventDefault();
         this.$zone.classList.remove('is-over');
         if (this._disabled) return;
         const files = event.dataTransfer?.files;
         if (files && files.length) this._emit(files);
      });

      // Without this the browser navigates to the dropped file instead of
      // letting the page handle it.
      this.addEventListener('dragover', (e) => e.preventDefault());
      this.addEventListener('drop', (e) => e.preventDefault());

      this._apply();
      await this._renderIcon();
   }

   beforeDestroy() {
      if (this._iconEl) {
         slice.controller.destroyComponent(this._iconEl);
         this._iconEl = null;
      }
   }

   _emit(files) {
      if (typeof this._onFiles === 'function' && files) {
         this._onFiles(Array.from(files), files);
      }
      if (this._list) this._renderList(Array.from(files || []));
   }

   _apply() {
      this.$input.accept = this._accept || ACCEPT_ALL;
      this.$input.multiple = this._multiple === true;
      this.$input.disabled = this._disabled === true;
      this.$prompt.textContent = this._prompt;
      this.$hint.textContent = this._hint;
      this.$hint.hidden = !this._hint;
      this.$zone.classList.toggle('is-disabled', this._disabled === true);
      this.$list.hidden = !this._list;
   }

   async _renderIcon() {
      // setComponentProps runs the setters in the constructor; building a child
      // there would leave an orphan behind when init() builds the real one.
      if (!this._inited) return;
      if (this._iconEl) {
         slice.controller.destroyComponent(this._iconEl);
         this._iconEl = null;
      }
      this.$iconSlot.replaceChildren();
      if (!this._icon) return;
      this._iconEl = await slice.build('Icon', {
         name: this._icon,
         size: 'large',
         color: 'currentColor',
      });
      this.$iconSlot.appendChild(this._iconEl);
   }

   _renderList(files) {
      this.$list.replaceChildren();
      for (const file of files) {
         const li = document.createElement('li');
         li.className = 'slice_file_upload__item';
         li.textContent = file.name;
         this.$list.appendChild(li);
      }
      this.$list.hidden = files.length === 0;
   }

   get accept() { return this._accept; }
   set accept(v) { this._accept = v || ACCEPT_ALL; this._apply(); }

   get multiple() { return this._multiple; }
   set multiple(v) { this._multiple = v === true; this._apply(); }

   get disabled() { return this._disabled; }
   set disabled(v) { this._disabled = v === true; this._apply(); }

   get prompt() { return this._prompt; }
   set prompt(v) { this._prompt = v || ''; this.$prompt.textContent = this._prompt; }

   get hint() { return this._hint; }
   set hint(v) { this._hint = v || ''; this._apply(); }

   get list() { return this._list; }
   set list(v) { this._list = v === true; this.$list.hidden = !this._list; }

   get icon() { return this._icon; }
   set icon(v) { this._icon = v || ''; this._renderIcon(); }

   get onFiles() { return this._onFiles; }
   set onFiles(v) { this._onFiles = typeof v === 'function' ? v : null; }
}

customElements.define('slice-file-upload', FileUpload);