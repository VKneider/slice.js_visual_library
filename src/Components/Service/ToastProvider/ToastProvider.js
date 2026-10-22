const VALID_POSITIONS = new Set([
  'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
]);

// A stack of notifications backed by a POOL of Toast components.
//
// A Toast is built the first time it is needed and then reused: when one
// finishes hiding it goes back to the pool, and the next show() takes it from
// there with reuse() instead of building another. At most `maxToasts` are on
// screen and at most `maxToasts` wait in the pool, so a page that shows a
// thousand notifications still owns a handful of Toast components.
export default class ToastProvider {
  constructor() {
    this._container = null;
    this._toasts = new Map();   // id -> Toast on screen (or hiding)
    this._idle = [];            // Toasts ready to be reused
    this._position = 'top-right';
    this._maxToasts = 5;
    this._counter = 0;
    this._destroyed = false;

    this._handleToastDismissed = this._handleToastDismissed.bind(this);

    // A second provider means a second container stacked over the first and a
    // second pool. Almost always a missing { singleton: true }: say so.
    ToastProvider._live += 1;
    if (ToastProvider._live > 1) {
      slice.logger?.logWarning?.('ToastProvider',
        `${ToastProvider._live} ToastProviders are alive. Build it with slice.build('ToastProvider', { singleton: true }) so the app shares one.`);
    }
    this._prewarm();
  }

  static _live = 0;

  /** Toasts this provider owns right now: on screen plus waiting in the pool. */
  get poolSize() {
    return this._toasts.size + this._idle.length;
  }

  async show(message, config = {}) {
    if (!message || this._destroyed) return '';

    const id = `toast-${++this._counter}-${Date.now()}`;
    const props = {
      message: String(message),
      type: config.type || 'default',
      duration: config.duration ?? 4000,
      dismissable: config.dismissable ?? true,
      customColor: config.customColor || null
    };

    const toast = await this._acquire(props);
    if (!toast) return '';
    if (this._destroyed) {
      this._release(toast);
      return '';
    }

    this._toasts.set(id, toast);
    this._getContainer().appendChild(toast);
    toast.show();
    this._enforceMax();

    return id;
  }

  dismiss(id) {
    const toast = this._toasts.get(id);
    if (toast) {
      toast.hide();
      this._toasts.delete(id);
    }
    return this;
  }

  clear() {
    for (const toast of this._toasts.values()) {
      toast.hide();
    }
    this._toasts.clear();
    return this;
  }

  setPosition(position) {
    if (!VALID_POSITIONS.has(position)) return this;
    this._position = position;
    if (this._container) {
      this._container.dataset.position = position;
    }
    return this;
  }

  // Framework teardown hook: the controller calls beforeDestroy() (never
  // destroy()), so the provider's cleanup lives here.
  beforeDestroy() {
    if (!this._destroyed) ToastProvider._live = Math.max(0, ToastProvider._live - 1);
    this._destroyed = true;
    const owned = [...this._toasts.values(), ...this._idle];
    this._toasts.clear();
    this._idle = [];
    for (const toast of owned) this._destroyToast(toast);
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._container = null;
  }

  // ── Pool ────────────────────────────────────────────────────────

  async _acquire(props) {
    const pooled = this._idle.pop();
    if (pooled) return pooled.reuse(props);
    const toast = await slice.build('Toast', props);
    if (!toast) return null;
    toast.addEventListener('toast-dismissed', this._handleToastDismissed);
    // init() already started it; reset, and show() runs once it is on the page.
    return toast.reuse(props);
  }

  // Back to the pool, or destroyed when the pool is full.
  _release(toast) {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
    if (!this._destroyed && this._idle.length < this._maxToasts && !this._idle.includes(toast)) {
      toast.reuse();
      this._idle.push(toast);
    } else {
      this._destroyToast(toast);
    }
  }

  _destroyToast(toast) {
    toast.removeEventListener('toast-dismissed', this._handleToastDismissed);
    if (toast.sliceId && slice.controller.activeComponents.has(toast.sliceId)) {
      slice.controller.destroyComponent(toast);
    }
    toast.remove();
  }

  // Building the first Toast also loads its CSS, so it is built up front and
  // parked in the pool: the first real notification then appears styled and
  // without a build.
  async _prewarm() {
    if (typeof slice === 'undefined' || !slice.controller) return;
    try {
      const toast = await this._acquire({ message: '' });
      if (toast) this._release(toast);
    } catch (err) {
      slice.logger?.logWarn?.('ToastProvider', 'Could not prepare the toast pool', err);
    }
  }

  _getContainer() {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.className = 'toast-provider-container';
      this._container.dataset.position = this._position;
      document.body.appendChild(this._container);
    }
    return this._container;
  }

  _enforceMax() {
    const entries = [...this._toasts.entries()];
    while (entries.length > this._maxToasts) {
      const [id, toast] = entries.shift();
      toast.hide();
      this._toasts.delete(id);
    }
  }

  _handleToastDismissed(event) {
    const toast = event.target;
    for (const [id, t] of this._toasts) {
      if (t === toast) {
        this._toasts.delete(id);
        break;
      }
    }
    this._release(toast);
  }
}