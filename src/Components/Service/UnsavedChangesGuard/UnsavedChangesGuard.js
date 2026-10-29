// Warns before the user throws away work in progress — the "you have unsaved
// changes" guard.
//
// Any component can declare pending work with a stable key:
//
//   guard.arm('project-form');
//   ...
//   guard.disarm('project-form');   // saved
//
// Arms are reference-counted by key, so two components using the same key
// cannot switch each other off, and the guard releases itself when the last
// key goes away.
//
// THREE EXITS, and they are not equally reliable. This is a property of the
// platform, not a shortcut — see `confirmLeave()` for the details:
//
//   1. Page unload (tab close, reload, navigate to another site)
//      `beforeunload` -> the browser's own dialog. Rock solid. The browser
//      IGNORES any message you put in it and shows its own text.
//
//   2. In-app navigation via slice.router.navigate() / <slice-link>
//      Router `beforeEach` -> our own dialog. Rock solid.
//
//   3. The browser back/forward buttons (popstate)
//      The router does NOT run beforeEach on popstate — the URL has already
//      changed by the time the event fires. This service absorbs it by putting
//      the history back, which means the new route can paint for a frame
//      first. Best effort, and documented as such.

// WORKAROUND for a router bug (Slice.js 4.x, Router.js `_executeBeforeEachGuard`):
//
//   return redirectPath ? { path: redirectPath, options: redirectOptions } : null;
//
// `next(false)` sets `redirectPath = false`, which is FALSY, so the ternary
// returns `null` and the "cancelled" case below it is unreachable. A guard
// that calls `next(false)` lets the navigation through anyway, with no warning.
//
// The one path that does cancel is the catch: a guard that THROWS returns
// `{ path: false }` explicitly. So cancellation is expressed as a throw. It
// costs one error line in the console per declined navigation, which is a good
// trade for not silently discarding a user's work.
//
// `next('/some/path')` (a redirect) is unaffected — a non-empty string is
// truthy and works as documented.
const NAVIGATION_CANCELLED = new Error('UnsavedChangesGuard: navigation cancelled by the user');

export default class UnsavedChangesGuard {

   // A Set, so arming twice with one key is still one arm, and the guard only
   // releases when every holder has disarmed.
   constructor() {
      this._keys = new Set();
      this._message = '';
      this._dialog = null;

      this._onBeforeUnload = this._onBeforeUnload.bind(this);
      this._onPopState = this._onPopState.bind(this);

      // Where the user was when the work became pending. Restoring to this is
      // what makes the back button recoverable.
      this._armedLocation = null;

      this._resolveLeave = null;
      this._pendingLeave = null;
      this._leaveOpen = false;
      this._installed = false;
      this._router = null;
   }

   async init() {
      this._install();
      // `slice.router` may not exist yet if this service is built very early.
      // arm() retries, so the router guard is never permanently missed.
      if (!this._router) this._installRouterGuard();
   }

   // The framework ONLY ever calls `beforeDestroy()`. A method named `destroy()`
   // looks like teardown and silently never runs — which here would mean the
   // beforeunload listener and the composed router guard outlive the service.
   beforeDestroy() {
      this._keys.clear();
      this._armedLocation = null;
      this._uninstall();
   }

   // ---------------------------------------------------------------- public

   /** Declare pending work. Called with the same `key` by every holder. */
   arm(key = 'default', options = {}) {
      this._keys.add(key);
      if (options.message) this._message = options.message;
      if (this._keys.size === 1) {
         this._armedLocation = (slice.path + window.location.search);
      }
      // Retried here because slice.router may not have existed at init().
      this._installRouterGuard();
      return this;
   }

   /** The work is saved (or deliberately abandoned): stop warning. */
   disarm(key = 'default') {
      this._keys.delete(key);
      if (this._keys.size === 0) {
         this._armedLocation = null;
      }
      return this;
   }

   /** True while at least one holder has pending work. */
   get isArmed() {
      return this._keys.size > 0;
   }

   /** How many distinct keys are holding the guard. */
   get pendingCount() {
      return this._keys.size;
   }

   /**
    * Ask the user whether to leave.
    *
    * Use this yourself when you need to gate something the built-in exits do
    * not cover — a multi-step wizard, a closing drawer, a "discard draft?"
    * action.
    *
    * @param {string} [message]
    * @returns {Promise<boolean>}
    */
   confirmLeave(message) {
      if (!this.isArmed) return Promise.resolve(true);

      // One dialog at a time: a second caller joins the question already on
      // screen rather than stacking a second one on top of it.
      if (this._leaveOpen) return this._pendingLeave;

      let resolveFn;
      const pending = new Promise((resolve) => { resolveFn = resolve; });
      this._pendingLeave = pending;
      this._resolveLeave = resolveFn;
      this._leaveOpen = true;
      this._ask(message);
      // The local, not `this._pendingLeave`: _ask() can answer synchronously
      // (a stubbed dialog, or one the user answers instantly) and _closeLeave
      // clears the field on its way out.
      return pending;
   }

   /**
    * Replace the browser `confirm` with your own dialog.
    *
    * @param {(message: string) => void} fn  call `done(allowed)` when answered
    *
    * Only used by `confirmLeave()` — which covers in-app navigation and any
    * call you make yourself. The back/forward buttons keep the native confirm,
    * because that handler has to answer synchronously.
    */
   setDialog(fn) {
      this._dialog = typeof fn === 'function' ? fn : null;
      return this;
   }

   /**
    * The router guard body, for apps that install their own `beforeEach`.
    *
    * This service installs itself by composing whatever guard was already
    * registered, but the router keeps guards in a single slot
    * (`_beforeEachGuard`), so an app that registers a guard AFTER this
    * service was built replaces ours. If that is you, compose explicitly:
    *
    *   slice.router.beforeEach(async (to, from, next) => {
    *     if (to.meta?.public) return next();
    *     if (!(await guard.confirmLeave())) return next(false);
    *     return next();
    *   });
    */
   async guardFn(to, from, next) {
      const allowed = await this.confirmLeave();
      return next(allowed ? undefined : false);
   }

   // ------------------------------------------------------------- internals

   _ask(message) {
      const text = message || this._message || 'You have unsaved changes. Leave anyway?';
      if (this._dialog) {
         this._dialog(text, (allowed) => this._closeLeave(allowed));
         return;
      }
      this._closeLeave(window.confirm(text));
   }

   _closeLeave(allowed) {
      if (!this._leaveOpen) return;
      this._leaveOpen = false;
      const resolve = this._resolveLeave;
      this._resolveLeave = null;
      this._pendingLeave = null;
      if (resolve) resolve(allowed === true);
   }

   // Exit 1 — real page unloads. beforeunload does NOT fire for in-app history
   // navigation, so this alone would miss the back button.
   _onBeforeUnload(event) {
      if (!this.isArmed) return;
      event.preventDefault();
      // Legacy fallback for engines that predate preventDefault() here. The
      // string is ignored by every current browser: they show their own text,
      // because a page that could name the consequence would be a page that
      // could be used to trick people into staying.
      event.returnValue = '';
      // Returning a value keeps some older engines on the same path.
      return '';
   }

   // Exit 3 — the back/forward buttons.
   _onPopState() {
      if (!this.isArmed || !this._armedLocation) return;
      if (this._restoring) return;

      const here = (slice.path + window.location.search);
      if (here === this._armedLocation) return;   // landed back where we started

      // This path CANNOT use confirmLeave(): the history has already moved, and
      // a popstate handler has to answer synchronously or the browser moves on
      // without us. So the styled-dialog override does not apply here — the
      // browser's own confirm is the only thing that can hold the line.
      const ok = window.confirm(this._message || 'You have unsaved changes. Leave anyway?');
      if (ok) {
         // Allowed: forget the pending work, so the arriving route is clean.
         this._keys.clear();
         this._armedLocation = null;
         return;
      }

      // Declined. `history.go(1)` and NOT pushState: only a real popstate makes
      // the router re-render the route we are returning to. A pushState would
      // fix the URL while leaving the previous route painted underneath it.
      this._restoring = true;
      window.history.go(1);
      // Release on the next task, once the popstate from go(1) has landed.
      setTimeout(() => { this._restoring = false; }, 0);
   }

   _install() {
      if (this._installed) return;
      this._installed = true;
      window.addEventListener('beforeunload', this._onBeforeUnload);
      window.addEventListener('popstate', this._onPopState);
      this._installRouterGuard();
   }

   /**
    * Exit 2 — compose with whatever guard the app already registered.
    *
    * The router keeps a single `_beforeEachGuard` slot and exposes no getter
    * for it, so reading the private is the only way to compose rather than
    * silently replace an app's auth/redirect guard.
    */
   _installRouterGuard() {
      if (this._router) return;
      const router = window.slice?.router;
      if (!router || typeof router.beforeEach !== 'function') return;
      this._router = router;
      this._previousGuard = router._beforeEachGuard || null;
      router.beforeEach((to, from, next) => this._runRouterGuard(to, from, next));
   }

   async _runRouterGuard(to, from, next) {
      // Our dialog first: if the user declines, the app's guard must not run,
      // because it may redirect somewhere they did not agree to either.
      if (this.isArmed) {
         const allowed = await this.confirmLeave();
         if (!allowed) throw NAVIGATION_CANCELLED;
      }

      const previous = this._previousGuard;
      if (typeof previous !== 'function') return next();

      // The app's guard is `next()`-based; forward the verdict we already have
      // so it is not silently ignored.
      let forwarded = false;
      await previous(to, from, (arg) => {
         forwarded = true;
         next(arg);
      });
      // A guard that never calls next() is logged by the router, but forwarding
      // here keeps a cancelled navigation from looking successful.
      if (!forwarded) next();
   }

   _uninstall() {
      if (!this._installed) return;
      this._installed = false;
      window.removeEventListener('beforeunload', this._onBeforeUnload);
      window.removeEventListener('popstate', this._onPopState);
      this._router = null;
      this._previousGuard = null;
   }
}
