// Warns once per deprecated prop name (kept module-scoped so each component
// reports a given alias only once per session).
const _sliceDeprecated = new Set();
function deprecate(oldName, newName) {
   if (_sliceDeprecated.has(oldName)) return;
   _sliceDeprecated.add(oldName);
   console.warn(`[Slice] "${oldName}" is deprecated; use "${newName}" instead.`);
}

export default class Loading extends HTMLElement {

   // The overlay must cover every other layer: the ToastProvider stack sits at
   // 11000 and a DnD ghost at 999999, so the old stylesheet `z-index: 500` let
   // either one render ON TOP of a "blocking" spinner. Set inline because the
   // host is positioned from JS and a stylesheet value loses to app overrides.
   // (A native <dialog> lives in the top layer, which no z-index can beat — that
   // is why Modal shows its own state instead of relying on the overlay.)
   static OVERLAY_Z_INDEX = 2147483000;

   static props = {
      // Minimum time the overlay stays up once started. An operation that
      // resolves in under a frame otherwise paints a full-viewport overlay and
      // removes it in the same task, which the user reads as a grey flash.
      // Opt-in: 0 keeps the current behaviour.
      minVisibleMs: {
         type: 'number',
         default: 0,
         required: false
      },
      // Canonical busy-state flag. `isActive` is kept as a deprecated alias.
      active: {
         type: 'boolean',
         default: false,
         required: false
      },
      isActive: {
         type: 'boolean',
         default: false,
         required: false
      },
      container: {
         type: 'object',
         default: null,
         required: false
      }
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      // Instance state MUST be initialized before setComponentProps: passing
      // `active: true` at build time fires the `active` setter (→ start(), which
      // sets _running = true) during setComponentProps, so setComponentProps has
      // to run LAST or the field inits below would silently undo it.
      //
      // The internal flag is `_running`, never `_isActive`: setComponentProps
      // nulls the backing field it derives from EVERY declared prop, and the
      // deprecated `isActive` alias derives `_isActive` — which silently wiped
      // the real state to null and made `get active()` return null.
      this._container = null;
      this._running = false;
      this._currentContainer = null;
      slice.controller.setComponentProps(this, props);
   }

   init() {}

   /**
    * Muestra el loading spinner
    * @param {HTMLElement} container - Opcional. Contenedor donde mostrar el loading.
    *                                  Si no se proporciona, usa document.body (fullscreen)
    */
   start(container = null) {
      // Determinar el contenedor
      const targetContainer = container || this._container || document.body;

      // A stop() deferred by the minimum-visible floor is cancelled by ANY
      // start(), including the early-return path below: the user is busy again,
      // so the overlay has to stay. This must come BEFORE that check, because a
      // restart of an already-running loader is the common case.
      if (this._pendingStopTimeout) {
         clearTimeout(this._pendingStopTimeout);
         this._pendingStopTimeout = null;
      }

      // Si ya está activo en el mismo container, no hacer nada
      if (this._running && this._currentContainer === targetContainer) {
         return;
      }
      
      // Si está activo en otro container, primero detenerlo
      if (this._running) {
         this.stop();
      }
      
      // Configurar estilos según el contenedor
      if (targetContainer !== document.body) {
         // Para contenedores específicos
         // Guardar el position original para restaurarlo después
         this._originalPosition = targetContainer.style.position;
         this._originalOverflow = targetContainer.style.overflow;
         
         // Solo cambiar si no tiene position definido o es static
         const currentPosition = window.getComputedStyle(targetContainer).position;
         if (currentPosition === 'static' || currentPosition === '') {
            targetContainer.style.position = 'relative';
         }
         
         // Ocultar overflow para que el loading no se salga
         targetContainer.style.overflow = 'hidden';
         
         // Configurar el loading como absolute para que llene el container
         this.style.position = 'absolute';
         this.style.top = '0';
         this.style.left = '0';
         this.style.right = '0';
         this.style.bottom = '0';
         this.style.width = '100%';
         this.style.height = '100%';
      } else {
         // Para document.body (fullscreen)
         this.style.position = 'fixed';
         this.style.top = '0';
         this.style.left = '0';
         this.style.right = '0';
         this.style.bottom = '0';
         this.style.width = '100%';
         this.style.height = '100%';
      }

      this.style.zIndex = String(Loading.OVERLAY_Z_INDEX);

      // Append al contenedor
      targetContainer.appendChild(this);
      this._running = true;
      this._currentContainer = targetContainer;

      // Armed only on a real start. A restart of an already-running loader must
      // not push the deadline out, or a loader polled every frame never hides.
      this._minimumVisibleUntil = Date.now() + this._minFloorMs;
   }

   /**
    * Oculta el loading spinner
    */
   stop() {
      if (!this._running) {
         return;
      }

      // Defer the teardown until the minimum-visible floor has elapsed. Without
      // this, start() followed immediately by stop() in the same task shows an
      // overlay for zero frames.
      const remaining = (this._minimumVisibleUntil || 0) - Date.now();
      if (remaining > 0) {
         if (!this._pendingStopTimeout) {
            this._pendingStopTimeout = setTimeout(() => {
               this._pendingStopTimeout = null;
               this.stop();
            }, remaining);
         }
         return;
      }

      
      // Restaurar estilos originales del container si los modificamos
      if (this._currentContainer && 
          this._currentContainer !== document.body) {
         if (this._originalPosition !== undefined) {
            this._currentContainer.style.position = this._originalPosition;
         }
         if (this._originalOverflow !== undefined) {
            this._currentContainer.style.overflow = this._originalOverflow;
         }
      }
      
      // Remover del DOM
      if (this.parentNode) {
         this.parentNode.removeChild(this);
      }
      
      this._running = false;
      this._currentContainer = null;
      this._originalPosition = undefined;
      this._originalOverflow = undefined;
      this._minimumVisibleUntil = 0;
   }

   beforeDestroy() {
      // A deferred stop() must not fire into a destroyed component.
      if (this._pendingStopTimeout) {
         clearTimeout(this._pendingStopTimeout);
         this._pendingStopTimeout = null;
      }
   }

   /**
    * Minimum visible time, in ms.
    *
    * The backing field is `_minFloorMs`, NOT `_minVisibleMs`: setComponentProps
    * nulls the derived field for every declared prop and then assigns to the
    * property, so without this setter the value never reaches the field.
    */
   get minVisibleMs() {
      return this._minFloorMs;
   }

   set minVisibleMs(value) {
      this._minFloorMs = Math.max(0, Number(value) || 0);
   }

   // Canonical busy-state flag. Toggling it shows/hides the spinner.
   get active() {
      return this._running;
   }

   set active(value) {
      if (value === true && !this._running) {
         this.start();
      } else if (value === false && this._running) {
         this.stop();
      }
   }

   // Deprecated alias for `active`.
   get isActive() {
      return this._running;
   }

   set isActive(value) {
      if (value) deprecate('isActive', 'active');
      this.active = value;
   }

   get container() {
      return this._container;
   }

   set container(value) {
      this._container = value;
   }
}

customElements.define('slice-loading', Loading);