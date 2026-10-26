import { applySize, SIZE_VALUES } from '../../shared/props.js';
import { fieldId } from '../../shared/validation/fieldRules.js';

// Pick or drop files, see what was picked, fix it, and (optionally) upload it.
//
// The zone is a <label> around a real <input type="file">, so a click, a tap,
// Enter or Space opens the picker, and the input stays reachable with Tab.
// Files can also be dropped on the zone or pasted into it.
//
// Every file is checked before it is accepted: `accept` (also for dropped
// files, which the browser does not filter), `maxSize`, and `maxFiles`.
// Rejected files are listed under the zone with the reason and reported
// through `onReject`.
//
// Accepted files appear in a list with a preview (images), their size, a
// remove button and, when `upload` is given, a progress bar, retry and cancel.
//
// The value is a File[]: `value` reads and sets it, `onChange` reports it,
// and inside a Form it is what getValues() returns. With `name`, a hidden
// input carries the files, so a plain <form> posts them too.

const VARIANTS = ['dropzone', 'compact'];
const VALIDATE_ON = ['change', 'manual'];

const MESSAGES = {
   required: 'Add at least one file',
   type: 'This type of file is not allowed',
   tooLarge: 'Larger than {max}',
   tooMany: 'You can add up to {max} files',
   uploading: 'Wait for the uploads to finish',
   failed: 'Some files did not upload',
};

const TEXTS = {
   prompt: 'Drag files here, or {browse}',
   promptOne: 'Drag a file here, or {browse}',
   browse: 'choose',
   compact: 'Choose files',
   compactOne: 'Choose a file',
   remove: 'Remove {name}',
   retry: 'Retry',
   cancel: 'Cancel upload of {name}',
   uploading: 'Uploading… {percent}%',
   done: 'Uploaded',
   failed: 'Upload failed',
   rejected: 'Not added',
   anyFile: 'Any file',
   upTo: 'up to {size}',
   maxFiles: '{max} files at most',
   any_image: 'Images',
   any_video: 'Videos',
   any_audio: 'Audio',
   any_text: 'Text files',
};

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** "5 MB", "500kb", 2048 -> bytes. */
function parseSize(value) {
   if (typeof value === 'number') return value > 0 ? value : 0;
   const match = /^\s*([\d.]+)\s*([kmgt]?b?)\s*$/i.exec(String(value || ''));
   if (!match) return 0;
   const unit = match[2].toUpperCase().replace(/^([KMGT])$/, '$1B') || 'B';
   const power = Math.max(0, UNITS.indexOf(unit));
   return Math.round(parseFloat(match[1]) * 1024 ** power);
}

/** 1536 -> "1.5 KB". */
function formatSize(bytes) {
   if (!Number.isFinite(bytes) || bytes < 0) return '';
   let size = bytes;
   let unit = 0;
   while (size >= 1024 && unit < UNITS.length - 1) {
      size /= 1024;
      unit++;
   }
   const digits = unit === 0 || size >= 10 ? 0 : 1;
   return `${size.toFixed(digits)} ${UNITS[unit]}`;
}

/** Does `file` match an `accept` list (".pdf, image/*, text/csv")? */
function matchesAccept(file, accept) {
   const rules = String(accept || '').split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
   if (!rules.length) return true;
   const name = (file.name || '').toLowerCase();
   const type = (file.type || '').toLowerCase();
   return rules.some((rule) => {
      if (rule.startsWith('.')) return name.endsWith(rule);
      if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
      return type === rule;
   });
}

function fill(template, values) {
   return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

let itemId = 0;

export default class FileUpload extends HTMLElement {
   static props = {
      accept: { type: 'string', default: '' },
      multiple: { type: 'boolean', default: false },
      maxSize: { type: 'any', default: 0 },
      maxFiles: { type: 'number', default: 0 },
      value: { type: 'array', default: [] },
      name: { type: 'string', default: '' },
      label: { type: 'string', default: '' },
      ariaLabel: { type: 'string', default: '' },
      prompt: { type: 'string', default: '' },
      hint: { type: 'string', default: '' },
      icon: { type: 'string', default: 'upload' },
      help: { type: 'string', default: '' },
      error: { type: 'string', default: '' },
      invalid: { type: 'boolean', default: false },
      required: { type: 'boolean', default: false },
      disabled: { type: 'boolean', default: false },
      // Show the files under the zone (with previews, sizes and remove).
      list: { type: 'boolean', default: true },
      preview: { type: 'boolean', default: true },
      paste: { type: 'boolean', default: true },
      variant: { type: 'string', default: 'dropzone', allowedValues: VARIANTS },
      size: { type: 'string', default: 'md', allowedValues: SIZE_VALUES },
      // upload(file, { signal, onProgress }) => Promise<result>
      upload: { type: 'function', default: null },
      autoUpload: { type: 'boolean', default: true },
      concurrency: { type: 'number', default: 3 },
      validateOn: { type: 'string', default: 'change', allowedValues: VALIDATE_ON },
      messages: { type: 'object', default: null },
      texts: { type: 'object', default: null },
      onFiles: { type: 'function', default: null },
      onChange: { type: 'function', default: null },
      onReject: { type: 'function', default: null },
      onUpload: { type: 'function', default: null },
      onUploadError: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.classList.add('slice-file-upload');

      this.$label = this.querySelector('.slice-file-upload__label');
      this.$zone = this.querySelector('.slice-file-upload__zone');
      this.$input = this.querySelector('.slice-file-upload__input');
      this.$icon = this.querySelector('.slice-file-upload__icon');
      this.$prompt = this.querySelector('.slice-file-upload__prompt');
      this.$hint = this.querySelector('.slice-file-upload__hint');
      this.$formValue = this.querySelector('.slice-file-upload__form-value');
      this.$message = this.querySelector('.slice-file-upload__message');
      this.$list = this.querySelector('.slice-file-upload__list');

      const id = fieldId('slice-file-upload');
      this.$input.id = id;
      this.$label.id = `${id}-label`;
      this.$message.id = `${id}-message`;

      this._accept = '';
      this._multiple = false;
      this._maxSize = 0;
      this._maxFiles = 0;
      this._name = '';
      this._label = '';
      this._ariaLabel = '';
      this._prompt = '';
      this._hint = '';
      this._icon = 'upload';
      this._help = '';
      this._error = '';
      this._invalid = false;
      this._required = false;
      this._disabled = false;
      this._list = true;
      this._preview = true;
      this._paste = true;
      this._variant = 'dropzone';
      this._size = 'md';
      this._upload = null;
      this._autoUpload = true;
      this._concurrency = 3;
      this._validateOn = 'change';
      this._messages = { ...MESSAGES };
      this._texts = { ...TEXTS };
      this._onFiles = null;
      this._onChange = null;
      this._onReject = null;
      this._onUpload = null;
      this._onUploadError = null;

      this._items = [];         // { id, file, status, progress, result, error, url, controller, $el }
      this._rejected = [];      // { file, reason, message }
      this._shownError = '';    // the validation message on screen
      this._dragDepth = 0;
      this._ready = false;

      this._handlers = {
         change: () => this._pick(),
         dragenter: (e) => this._dragEnter(e),
         dragover: (e) => this._dragOver(e),
         dragleave: () => this._dragLeave(),
         drop: (e) => this._drop(e),
         paste: (e) => this._handlePaste(e),
         hostDrag: (e) => e.preventDefault(),
         listClick: (e) => this._handleListClick(e),
      };

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      this._ready = true;
      const h = this._handlers;
      this.$input.addEventListener('change', h.change);
      this.$zone.addEventListener('dragenter', h.dragenter);
      this.$zone.addEventListener('dragover', h.dragover);
      this.$zone.addEventListener('dragleave', h.dragleave);
      this.$zone.addEventListener('drop', h.drop);
      this.addEventListener('paste', h.paste);
      // A file dropped next to the zone would make the browser open it.
      this.addEventListener('dragover', h.hostDrag);
      this.addEventListener('drop', h.hostDrag);
      this.$list.addEventListener('click', h.listClick);
      this.size = this._size;
      this._renderCopy();
      this._renderList();
      this._renderMessage();
      this._syncFormValue();
      await this._renderIcon();
   }

   beforeDestroy() {
      this._ready = false;
      const h = this._handlers;
      this.$input.removeEventListener('change', h.change);
      this.$zone.removeEventListener('dragenter', h.dragenter);
      this.$zone.removeEventListener('dragover', h.dragover);
      this.$zone.removeEventListener('dragleave', h.dragleave);
      this.$zone.removeEventListener('drop', h.drop);
      this.removeEventListener('paste', h.paste);
      this.removeEventListener('dragover', h.hostDrag);
      this.removeEventListener('drop', h.hostDrag);
      this.$list.removeEventListener('click', h.listClick);
      for (const item of this._items) this._releaseItem(item);
      this._items = [];
      if (this._iconEl) slice.controller.destroyComponent(this._iconEl);
      this._iconEl = null;
   }

   // ── Props ──────────────────────────────────────────────────────

   get accept() { return this._accept; }
   set accept(v) { this._accept = v ? String(v) : ''; this.$input.accept = this._accept; this._ready && this._renderCopy(); }

   get multiple() { return this._multiple; }
   set multiple(v) { this._multiple = v === true; this.$input.multiple = this._multiple; this._ready && this._renderCopy(); }

   get maxSize() { return this._maxSize; }
   set maxSize(v) { this._maxSize = parseSize(v); this._ready && this._renderCopy(); }

   get maxFiles() { return this._maxFiles; }
   set maxFiles(v) { this._maxFiles = Number(v) > 0 ? Math.floor(Number(v)) : 0; this._ready && this._renderCopy(); }

   /** The accepted files, in order. */
   get value() { return this._items.map((item) => item.file); }
   set value(v) {
      const files = Array.isArray(v) ? v.filter((f) => f instanceof Blob) : [];
      for (const item of this._items) this._releaseItem(item);
      this._items = files.map((file) => this._newItem(file, 'ready'));
      this._rejected = [];
      if (this._ready) this._afterChange({ silent: true });
   }

   get files() { return this.value; }

   /** Per-file state: { file, status, progress, result, error }. */
   get items() {
      return this._items.map(({ file, status, progress, result, error }) => ({ file, status, progress, result, error }));
   }

   /** What `upload` returned for each uploaded file. */
   get results() {
      return this._items.filter((i) => i.status === 'done').map((i) => i.result);
   }

   get uploading() { return this._items.some((i) => i.status === 'uploading' || i.status === 'queued'); }

   get name() { return this._name; }
   set name(v) {
      this._name = v ? String(v) : '';
      if (this._name) this.$formValue.name = this._name;
      else this.$formValue.removeAttribute('name');
   }

   get label() { return this._label; }
   set label(v) {
      this._label = v ? String(v) : '';
      this.$label.textContent = this._label;
      this.$label.hidden = !this._label;
      this._renderNames();
   }

   get ariaLabel() { return this._ariaLabel; }
   set ariaLabel(v) { this._ariaLabel = v ? String(v) : ''; this._renderNames(); }

   get prompt() { return this._prompt; }
   set prompt(v) { this._prompt = v ? String(v) : ''; this._ready && this._renderCopy(); }

   get hint() { return this._hint; }
   set hint(v) { this._hint = v ? String(v) : ''; this._ready && this._renderCopy(); }

   get icon() { return this._icon; }
   set icon(v) { this._icon = v ? String(v) : ''; this._ready && this._renderIcon(); }

   get help() { return this._help; }
   set help(v) { this._help = v ? String(v) : ''; this._ready && this._renderMessage(); }

   get error() { return this._error; }
   set error(v) { this._error = v ? String(v) : ''; this._ready && this._renderMessage(); }

   get invalid() { return this._invalid; }
   set invalid(v) { this._invalid = v === true; this._ready && this._renderMessage(); }

   get required() { return this._required; }
   set required(v) {
      this._required = v === true;
      if (this._required) this.$input.setAttribute('aria-required', 'true');
      else this.$input.removeAttribute('aria-required');
   }

   get disabled() { return this._disabled; }
   set disabled(v) {
      this._disabled = v === true;
      this.$input.disabled = this._disabled;
      this.classList.toggle('is-disabled', this._disabled);
      this._ready && this._renderList();
   }

   get list() { return this._list; }
   set list(v) { this._list = v !== false; this._ready && this._renderList(); }

   get preview() { return this._preview; }
   set preview(v) { this._preview = v !== false; this._ready && this._renderList(); }

   get paste() { return this._paste; }
   set paste(v) { this._paste = v !== false; }

   get variant() { return this._variant; }
   set variant(v) {
      this._variant = VARIANTS.includes(v) ? v : 'dropzone';
      for (const name of VARIANTS) this.classList.remove(`slice-file-upload--${name}`);
      this.classList.add(`slice-file-upload--${this._variant}`);
      this._ready && this._renderCopy();
   }

   get size() { return this._size; }
   set size(v) { this._size = applySize(this, v, 'md'); }

   get upload() { return this._upload; }
   set upload(v) { this._upload = typeof v === 'function' ? v : null; this._ready && this._renderList(); }

   get autoUpload() { return this._autoUpload; }
   set autoUpload(v) { this._autoUpload = v !== false; }

   get concurrency() { return this._concurrency; }
   set concurrency(v) { this._concurrency = Number(v) > 0 ? Math.floor(Number(v)) : 3; }

   get validateOn() { return this._validateOn; }
   set validateOn(v) { this._validateOn = VALIDATE_ON.includes(v) ? v : 'change'; }

   get messages() { return this._messages; }
   set messages(v) { this._messages = { ...MESSAGES, ...(v && typeof v === 'object' ? v : {}) }; }

   get texts() { return this._texts; }
   set texts(v) {
      this._texts = { ...TEXTS, ...(v && typeof v === 'object' ? v : {}) };
      if (this._ready) {
         this._renderCopy();
         this._renderList();
      }
   }

   get onFiles() { return this._onFiles; }
   set onFiles(v) { this._onFiles = typeof v === 'function' ? v : null; }

   get onChange() { return this._onChange; }
   set onChange(v) { this._onChange = typeof v === 'function' ? v : null; }

   get onReject() { return this._onReject; }
   set onReject(v) { this._onReject = typeof v === 'function' ? v : null; }

   get onUpload() { return this._onUpload; }
   set onUpload(v) { this._onUpload = typeof v === 'function' ? v : null; }

   get onUploadError() { return this._onUploadError; }
   set onUploadError(v) { this._onUploadError = typeof v === 'function' ? v : null; }

   // ── Validation ─────────────────────────────────────────────────

   /** What is wrong right now, or ''. An empty field only counts once validate() runs. */
   get validationMessage() {
      if (this.uploading) return this._messages.uploading;
      if (this._items.some((i) => i.status === 'error')) return this._messages.failed;
      return '';
   }

   get isValid() {
      return !this.validationMessage && !(this._required && this._items.length === 0);
   }

   /** Check the field and show the problem. Returns true when it is fine. */
   validate() {
      const message = this._required && this._items.length === 0 ? this._messages.required : this.validationMessage;
      this._shownError = message;
      this._renderMessage();
      if (message) {
         this.$zone.classList.remove('is-shaking');
         void this.$zone.offsetWidth;
         this.$zone.classList.add('is-shaking');
      }
      return !message;
   }

   focus(options) {
      this.$input.focus(options);
   }

   // ── Methods ────────────────────────────────────────────────────

   /** Open the file picker. */
   browse() {
      if (!this._disabled) this.$input.click();
   }

   /** Add files from code, with the same checks as a pick or a drop. */
   addFiles(files) {
      this._add(Array.from(files || []));
   }

   /** Remove a file (the File, or its index). Cancels its upload. */
   removeFile(fileOrIndex) {
      const index = typeof fileOrIndex === 'number' ? fileOrIndex : this._items.findIndex((i) => i.file === fileOrIndex);
      const item = this._items[index];
      if (!item) return;
      this._releaseItem(item);
      this._items.splice(index, 1);
      this._afterChange();
   }

   /** Remove every file. */
   clear() {
      for (const item of this._items) this._releaseItem(item);
      this._items = [];
      this._rejected = [];
      this._afterChange();
   }

   /** Upload the files that are waiting (with autoUpload: false) or failed. */
   uploadAll() {
      for (const item of this._items) {
         if (item.status === 'ready' || item.status === 'error') item.status = 'queued';
      }
      this._pump();
      return this._whenSettled();
   }

   // ── Adding files ───────────────────────────────────────────────

   _pick() {
      const files = Array.from(this.$input.files || []);
      // Reset, so picking the same file again still fires a change.
      this.$input.value = '';
      this._add(files);
   }

   _dragEnter(event) {
      event.preventDefault();
      if (this._disabled) return;
      this._dragDepth++;
      this.$zone.classList.add('is-over');
   }

   _dragOver(event) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = this._disabled ? 'none' : 'copy';
   }

   _dragLeave() {
      // dragleave fires for every child crossed; count, so the highlight does not flicker.
      this._dragDepth = Math.max(0, this._dragDepth - 1);
      if (!this._dragDepth) this.$zone.classList.remove('is-over');
   }

   _drop(event) {
      event.preventDefault();
      this._dragDepth = 0;
      this.$zone.classList.remove('is-over');
      if (this._disabled) return;
      this._add(Array.from(event.dataTransfer?.files || []));
   }

   _handlePaste(event) {
      if (!this._paste || this._disabled) return;
      const files = Array.from(event.clipboardData?.files || []);
      if (!files.length) return;
      event.preventDefault();
      this._add(files);
   }

   _add(files) {
      if (!files.length) return;
      const rejected = [];
      const accepted = [];
      for (const file of files) {
         if (!matchesAccept(file, this._accept)) {
            rejected.push({ file, reason: 'type', message: this._messages.type });
         } else if (this._maxSize && file.size > this._maxSize) {
            rejected.push({ file, reason: 'size', message: fill(this._messages.tooLarge, { max: formatSize(this._maxSize) }) });
         } else {
            accepted.push(file);
         }
      }

      let incoming = accepted;
      let keep = this._items;
      if (!this._multiple) {
         // One file: a new pick replaces the old one, and extras are turned away.
         for (const file of accepted.slice(1)) {
            rejected.push({ file, reason: 'count', message: fill(this._messages.tooMany, { max: 1 }) });
         }
         incoming = accepted.slice(0, 1);
         if (incoming.length) {
            for (const item of this._items) this._releaseItem(item);
            keep = [];
         }
      } else if (this._maxFiles) {
         const room = Math.max(0, this._maxFiles - keep.length);
         for (const file of incoming.slice(room)) {
            rejected.push({ file, reason: 'count', message: fill(this._messages.tooMany, { max: this._maxFiles }) });
         }
         incoming = incoming.slice(0, room);
      }

      const added = incoming.map((file) => this._newItem(file, this._upload && this._autoUpload ? 'queued' : 'ready'));
      this._items = [...keep, ...added];
      this._rejected = rejected;

      if (rejected.length) this._onReject?.(rejected, { fileUpload: this });
      if (added.length) {
         this._onFiles?.(added.map((i) => i.file), this.value);
      }
      this._afterChange({ changed: added.length > 0 });
      this._pump();
   }

   _newItem(file, status) {
      const isImage = /^image\//.test(file.type || '');
      return {
         id: ++itemId,
         file,
         status,
         progress: 0,
         result: undefined,
         error: null,
         url: isImage && typeof URL?.createObjectURL === 'function' ? URL.createObjectURL(file) : '',
         controller: null,
         $el: null,
      };
   }

   _releaseItem(item) {
      item.controller?.abort();
      item.controller = null;
      // Object URLs pin the file in memory until they are revoked.
      if (item.url) URL.revokeObjectURL(item.url);
      item.url = '';
   }

   _afterChange({ silent = false, changed = true } = {}) {
      this._syncFormValue();
      this._renderList();
      // An error on screen follows the files, so it clears once they are fixed.
      if (this._shownError && this._validateOn !== 'manual') this.validate();
      else if (this._shownError) {
         const message = this._required && this._items.length === 0 ? this._messages.required : this.validationMessage;
         if (!message) this._shownError = '';
      }
      this._renderMessage();
      if (!silent && changed) {
         this._onChange?.(this.value, { items: this.items, fileUpload: this });
         this.dispatchEvent(new Event('change', { bubbles: true }));
         this.dispatchEvent(new CustomEvent('files-change', { bubbles: true, detail: { files: this.value } }));
      }
   }

   // So a plain <form> posts the files under `name`.
   _syncFormValue() {
      if (!this._name || typeof DataTransfer === 'undefined') return;
      try {
         const transfer = new DataTransfer();
         for (const item of this._items) {
            if (item.file instanceof File) transfer.items.add(item.file);
         }
         this.$formValue.files = transfer.files;
      } catch { /* DataTransfer is not constructible in this browser */ }
   }

   // ── Uploading ──────────────────────────────────────────────────

   _pump() {
      if (!this._upload) return;
      const running = this._items.filter((i) => i.status === 'uploading').length;
      const queued = this._items.filter((i) => i.status === 'queued');
      for (const item of queued.slice(0, Math.max(0, this._concurrency - running))) this._send(item);
   }

   async _send(item) {
      item.status = 'uploading';
      item.progress = 0;
      item.error = null;
      item.controller = new AbortController();
      const { signal } = item.controller;
      this._renderItem(item);
      try {
         const result = await this._upload(item.file, {
            signal,
            onProgress: (value) => {
               if (signal.aborted) return;
               // Accepts 0–1 or 0–100.
               const percent = value <= 1 ? value * 100 : value;
               item.progress = Math.max(0, Math.min(100, Math.round(percent)));
               this._renderItem(item);
            },
         });
         if (signal.aborted || !this._items.includes(item)) return;
         item.status = 'done';
         item.progress = 100;
         item.result = result;
         this._onUpload?.(item.file, result, { fileUpload: this });
      } catch (error) {
         if (signal.aborted || !this._items.includes(item)) return;
         item.status = 'error';
         item.error = error;
         this._onUploadError?.(item.file, error, { fileUpload: this });
      }
      item.controller = null;
      if (!this._ready) return;
      this._renderItem(item);
      this._afterChange({ changed: false });
      // The files did not change, their state did: a Form re-checks on input.
      this.dispatchEvent(new Event('input', { bubbles: true }));
      this._pump();
      if (!this.uploading) this.dispatchEvent(new CustomEvent('uploads-settled', { detail: { items: this.items } }));
   }

   _whenSettled() {
      if (!this.uploading) return Promise.resolve(this.items);
      return new Promise((resolve) => {
         this.addEventListener('uploads-settled', () => resolve(this.items), { once: true });
      });
   }

   // ── Rendering ──────────────────────────────────────────────────

   _t(key, values = {}) {
      return fill(this._texts[key] ?? TEXTS[key] ?? key, values);
   }

   _renderNames() {
      if (this._label) {
         this.$input.setAttribute('aria-labelledby', this.$label.id);
         this.$input.removeAttribute('aria-label');
      } else {
         this.$input.removeAttribute('aria-labelledby');
         if (this._ariaLabel) this.$input.setAttribute('aria-label', this._ariaLabel);
         else this.$input.setAttribute('aria-label', this._multiple ? this._t('compact') : this._t('compactOne'));
      }
   }

   _renderCopy() {
      this.$prompt.replaceChildren();
      if (this._variant === 'compact') {
         const button = document.createElement('span');
         button.className = 'slice-file-upload__button';
         button.textContent = this._prompt || (this._multiple ? this._t('compact') : this._t('compactOne'));
         this.$prompt.appendChild(button);
      } else {
         // Raw, not through _t(): {browse} is where the link goes, not a value to fill.
         const template = this._prompt || (this._multiple ? this._texts.prompt : this._texts.promptOne);
         const [before, after = ''] = template.split('{browse}');
         const browse = document.createElement('span');
         browse.className = 'slice-file-upload__browse';
         browse.textContent = this._t('browse');
         this.$prompt.append(before, ...(template.includes('{browse}') ? [browse, after] : []));
      }

      // With no hint given, say what is allowed: "PDF, PNG · up to 5 MB · 3 files at most".
      let hint = this._hint;
      if (!hint) {
         const parts = [];
         if (this._accept) {
            // ".csv,text/csv" names the same type twice: say it once.
            parts.push([...new Set(this._accept.split(',').map((rule) => this._typeName(rule.trim())).filter(Boolean))].join(', '));
         }
         if (this._maxSize) parts.push(this._t('upTo', { size: formatSize(this._maxSize) }));
         if (this._multiple && this._maxFiles) parts.push(this._t('maxFiles', { max: this._maxFiles }));
         hint = parts.join(' · ');
      }
      this.$hint.textContent = hint;
      this.$hint.hidden = !hint;
      this._renderNames();
   }

   // ".pdf" -> "PDF", "image/*" -> "Images", "text/csv" -> "CSV".
   _typeName(rule) {
      if (!rule) return '';
      if (rule.startsWith('.')) return rule.slice(1).toUpperCase();
      const [kind, sub] = rule.split('/');
      if (sub === '*') return this._t(`any_${kind}`) !== `any_${kind}` ? this._t(`any_${kind}`) : kind.toUpperCase();
      return (sub || kind).toUpperCase();
   }

   async _renderIcon() {
      const token = (this._iconToken = (this._iconToken || 0) + 1);
      if (this._iconEl) slice.controller.destroyComponent(this._iconEl);
      this._iconEl = null;
      this.$icon.replaceChildren();
      this.$icon.hidden = !this._icon;
      if (!this._icon) return;
      const icon = await slice.build('Icon', { name: this._icon, size: 'var(--slice-file-upload-icon)', color: 'currentColor' });
      if (token !== this._iconToken || !this._ready) {
         if (icon) slice.controller.destroyComponent(icon);
         return;
      }
      this._iconEl = icon;
      if (icon) this.$icon.appendChild(icon);
   }

   _renderMessage() {
      const lines = [];
      const error = this._error || this._shownError;
      if (error) lines.push({ text: error, kind: 'error' });
      for (const r of this._rejected) {
         lines.push({ text: `${r.file.name}: ${r.message}`, kind: 'rejected' });
      }
      if (!lines.length && this._help) lines.push({ text: this._help, kind: 'help' });
      this.$message.replaceChildren(...lines.map(({ text, kind }) => {
         const p = document.createElement('p');
         p.className = `slice-file-upload__line slice-file-upload__line--${kind}`;
         p.textContent = text;
         return p;
      }));
      this.$message.hidden = lines.length === 0;
      const invalid = this._invalid || !!error;
      this.classList.toggle('is-invalid', invalid);
      this.$input.setAttribute('aria-invalid', String(invalid));
      if (lines.length) this.$input.setAttribute('aria-describedby', this.$message.id);
      else this.$input.removeAttribute('aria-describedby');
   }

   _renderList() {
      const show = this._list && this._items.length > 0;
      this.$list.hidden = !show;
      if (!show) {
         this.$list.replaceChildren();
         for (const item of this._items) item.$el = null;
         return;
      }
      const nodes = this._items.map((item) => {
         if (!item.$el) item.$el = this._buildItem(item);
         this._renderItem(item);
         return item.$el;
      });
      this.$list.replaceChildren(...nodes);
   }

   _buildItem(item) {
      const li = document.createElement('li');
      li.className = 'slice-file-upload__item';
      li.dataset.id = String(item.id);

      const thumb = document.createElement('span');
      thumb.className = 'slice-file-upload__thumb';
      thumb.setAttribute('aria-hidden', 'true');
      if (item.url && this._preview) {
         const img = document.createElement('img');
         img.src = item.url;
         img.alt = '';
         img.decoding = 'async';
         thumb.appendChild(img);
      } else {
         const ext = (item.file.name || '').split('.').pop();
         thumb.textContent = ext && ext !== item.file.name ? ext.slice(0, 4).toUpperCase() : 'FILE';
      }

      const body = document.createElement('span');
      body.className = 'slice-file-upload__meta';
      body.innerHTML = '<span class="slice-file-upload__name"></span><span class="slice-file-upload__detail"></span><span class="slice-file-upload__bar" hidden><span></span></span>';
      body.querySelector('.slice-file-upload__name').textContent = item.file.name || 'file';

      const actions = document.createElement('span');
      actions.className = 'slice-file-upload__actions';

      li.append(thumb, body, actions);
      return li;
   }

   _renderItem(item) {
      const li = item.$el;
      if (!li) return;
      li.dataset.status = item.status;
      const detail = li.querySelector('.slice-file-upload__detail');
      const bar = li.querySelector('.slice-file-upload__bar');
      const size = formatSize(item.file.size);
      let status = '';
      if (item.status === 'uploading' || item.status === 'queued') status = this._t('uploading', { percent: item.progress });
      else if (item.status === 'done') status = this._t('done');
      else if (item.status === 'error') status = item.error?.message ? `${this._t('failed')}: ${item.error.message}` : this._t('failed');
      detail.textContent = status ? `${size} · ${status}` : size;
      bar.hidden = !(item.status === 'uploading' || item.status === 'queued');
      bar.firstElementChild.style.width = `${item.progress}%`;
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuenow', String(item.progress));
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-label', item.file.name);

      const actions = li.querySelector('.slice-file-upload__actions');
      const buttons = [];
      if (item.status === 'error') buttons.push(this._actionButton('retry', this._t('retry'), this._t('retry'), 'text'));
      const uploading = item.status === 'uploading' || item.status === 'queued';
      buttons.push(this._actionButton(
         uploading ? 'cancel' : 'remove',
         uploading ? this._t('cancel', { name: item.file.name }) : this._t('remove', { name: item.file.name }),
         '',
         'icon',
      ));
      actions.replaceChildren(...buttons);
   }

   _actionButton(action, label, text, kind) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `slice-file-upload__action slice-file-upload__action--${kind}`;
      button.dataset.action = action;
      button.disabled = this._disabled;
      if (kind === 'icon') {
         button.setAttribute('aria-label', label);
         button.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      } else {
         button.textContent = text;
      }
      return button;
   }

   _handleListClick(event) {
      const button = event.target.closest('.slice-file-upload__action');
      if (!button || this._disabled) return;
      const li = button.closest('.slice-file-upload__item');
      const index = this._items.findIndex((i) => String(i.id) === li?.dataset.id);
      const item = this._items[index];
      if (!item) return;
      const action = button.dataset.action;
      if (action === 'retry') {
         item.status = 'queued';
         this._renderItem(item);
         this._pump();
         return;
      }
      // Remove or cancel: the file leaves the list either way. Focus moves to
      // the next file's button, or back to the picker, never to <body>.
      const next = this._items[index + 1] || this._items[index - 1];
      this.removeFile(index);
      const target = next?.$el?.querySelector('.slice-file-upload__action');
      (target || this.$input).focus();
   }
}

customElements.define('slice-file-upload', FileUpload);