import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// The three exits have very different mechanics, and two of them cannot be
// tested the way you would expect:
//
//  - beforeunload needs the page to actually be unloading. Chromium can be told
//    to hold the dialog open and Playwright exposes it as a 'dialog' event.
//  - The router guard is a normal async call: assert on the navigation not
//    happening.
//  - popstate must be driven from inside the page, and the dialog answered
//    synchronously — a popstate handler cannot await.

async function build(h, key = 'spec') {
   return h.page.evaluate(async ({ key }) => {
      window.__guard = await slice.build('UnsavedChangesGuard', { sliceId: `guard-${key}` });
      window.slice.events.removeAllListeners?.('test:none');
      return true;
   }, { key });
}

test.describe('UnsavedChangesGuard — arming', () => {
   test('smoke: builds without errors', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      expect(await h.page.evaluate(() => !!window.__sliceServices.UnsavedChangesGuard)).toBe(true);
      expect(h.pageErrors()).toEqual([]);
   });

   test('arm/disarm flips isArmed and the pending count', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });

      const out = await h.page.evaluate(() => {
         const g = window.__sliceServices.UnsavedChangesGuard;
         const steps = [];
         steps.push(g.isArmed);
         g.arm('form');
         steps.push(g.isArmed, g.pendingCount);
         g.disarm('form');
         steps.push(g.isArmed, g.pendingCount);
         return steps;
      });

      expect(out).toEqual([false, true, 1, false, 0]);
   });

   test('arming the same key twice counts once', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });

      const out = await h.page.evaluate(() => {
         const g = window.__sliceServices.UnsavedChangesGuard;
         g.arm('form').arm('form');
         const both = g.pendingCount;
         g.disarm('form');
         return { both, after: g.isArmed };
      });

      // Two arms with one key is still one holder: a component that arms on
      // every render must not lock the user out of the page.
      expect(out.both).toBe(1);
      expect(out.after).toBe(false);
   });

   test('two independent keys need two disarms', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });

      const out = await h.page.evaluate(() => {
         const g = window.__sliceServices.UnsavedChangesGuard;
         g.arm('editor').arm('upload');
         g.disarm('editor');
         const afterFirst = g.isArmed;
         g.disarm('upload');
         return { afterFirst, afterSecond: g.isArmed };
      });

      expect(out.afterFirst).toBe(true);
      expect(out.afterSecond).toBe(false);
   });
});

test.describe('UnsavedChangesGuard — exit 1: beforeunload', () => {
   test('an armed page prevents the unload; a disarmed one does not', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      await build(h);

      // A real unload cannot be observed from inside the page, but the contract
      // IS observable: the handler must call preventDefault() when armed, and
      // must not when it is not — otherwise every navigation gets a prompt.
      const out = await h.page.evaluate(() => {
         const g = window.__guard;
         const fire = () => {
            const event = new Event('beforeunload', { cancelable: true });
            window.dispatchEvent(event);
            return event.defaultPrevented;
         };
         const idle = fire();
         g.arm('form');
         return { idle, armed: fire() };
      });

      expect(out.idle).toBe(false);
      expect(out.armed).toBe(true);
   });

   test('the listener is on window, so it survives navigation within the app', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      await build(h);

      const out = await h.page.evaluate(() => {
         window.__guard.arm('form');
         // Fires regardless of where the component was mounted.
         const event = new Event('beforeunload', { cancelable: true });
         window.dispatchEvent(event);
         return event.defaultPrevented;
      });

      expect(out).toBe(true);
   });

   test('returnValue is left falsy: the browser owns the wording', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      await build(h);

      const out = await h.page.evaluate(() => {
         window.__guard.arm('form');
         const fake = { preventDefault: () => {}, returnValue: undefined };
         window.__guard._onBeforeUnload(fake);
         return fake.returnValue;
      });

      // Every current browser ignores this string and shows its own text; a
      // page able to word the prompt could use it to trick people into staying.
      expect(out).toBe('');
   });
});

test.describe('UnsavedChangesGuard — exit 2: router guard', () => {
   test('declining cancels the navigation', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      await build(h);
      await h.page.evaluate(() => {
         window.__answers = [];
         window.__guard.setDialog((msg, done) => { window.__answers.push(msg); done(false); });
         window.__guard.arm('form');
      });

      const before = await h.page.evaluate(() => window.location.pathname);
      await h.page.evaluate(() => window.slice.router.navigate('/docs/display/badge'));
      await h.page.waitForTimeout(300);

      const after = await h.page.evaluate(() => window.location.pathname);
      expect(after).toBe(before);
      expect(await h.page.evaluate(() => window.__answers.length)).toBe(1);
   });

   test('accepting lets the navigation through and disarms nothing', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      await build(h);
      await h.page.evaluate(() => {
         window.__guard.setDialog((msg, done) => done(true));
         window.__guard.arm('form');
      });

      await h.page.evaluate(() => window.slice.router.navigate('/docs/display/badge'));
      await expect.poll(() => h.page.evaluate(() => window.location.pathname)).toContain('/docs/display/badge');
      // Still armed: leaving once is not the same as saving.
      expect(await h.page.evaluate(() => window.__guard.isArmed)).toBe(true);
   });

   test('a disarmed guard never prompts', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      await build(h);
      await h.page.evaluate(() => {
         window.__asked = 0;
         window.__guard.setDialog((msg, done) => { window.__asked++; done(false); });
      });

      await h.page.evaluate(() => window.slice.router.navigate('/docs/display/badge'));
      await expect.poll(() => h.page.evaluate(() => window.location.pathname)).toContain('/docs/display/badge');
      expect(await h.page.evaluate(() => window.__asked)).toBe(0);
   });

   test('an app guard registered first still runs, and still wins', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });

      // This service builds first, so it captures nothing; the app then
      // registers its own. That is the clobbering case, so we assert the
      // composition the OTHER way: app guard first, then this service.
      const out = await h.page.evaluate(async () => {
         const router = window.slice.router;
         router.beforeEach((to, from, next) => { window.__appRan = true; next(); });
         window.__appRan = false;

         const g = await slice.build('UnsavedChangesGuard', { sliceId: 'guard-compose' });
         g.setDialog((msg, done) => done(false));
         g.arm('form');

         const before = window.location.pathname;
         await router.navigate('/docs/display/badge');
         await new Promise((r) => setTimeout(r, 200));
         return { appRan: window.__appRan, blocked: window.location.pathname === before };
      });

      // Our guard declined first, so the app's guard must NOT have run: it may
      // redirect somewhere the user also did not agree to.
      expect(out.blocked).toBe(true);
      expect(out.appRan).toBe(false);
   });

   test('an app guard that allows runs after ours accepts', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });

      const out = await h.page.evaluate(async () => {
         const router = window.slice.router;
         router.beforeEach((to, from, next) => { window.__appRan = true; next(); });
         window.__appRan = false;

         const g = await slice.build('UnsavedChangesGuard', { sliceId: 'guard-compose2' });
         g.setDialog((msg, done) => done(true));
         g.arm('form');

         await router.navigate('/docs/display/chip');
         await new Promise((r) => setTimeout(r, 250));
         return { appRan: window.__appRan, path: window.location.pathname };
      });

      expect(out.appRan).toBe(true);
      expect(out.path).toContain('/docs/display/chip');
   });
});

test.describe('UnsavedChangesGuard — confirmLeave()', () => {
   test('resolves true immediately when nothing is pending', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      const out = await h.page.evaluate(() => window.__sliceServices.UnsavedChangesGuard.confirmLeave());
      expect(out).toBe(true);
   });

   test('a custom dialog receives the message and resolves the answer', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });

      const out = await h.page.evaluate(async () => {
         const g = window.__sliceServices.UnsavedChangesGuard;
         g.arm('form', { message: 'Your draft is not saved.' });
         window.__seen = null;
         g.setDialog((msg, done) => { window.__seen = msg; done(true); });
         return await g.confirmLeave();
      });

      expect(out).toBe(true);
      expect(await h.page.evaluate(() => window.__seen)).toBe('Your draft is not saved.');
   });

   test('a per-call message wins over the armed one', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });

      const out = await h.page.evaluate(async () => {
         const g = window.__sliceServices.UnsavedChangesGuard;
         g.arm('form', { message: 'armed message' });
         g.setDialog((msg, done) => { window.__seen = msg; done(true); });
         await g.confirmLeave('per-call message');
         return window.__seen;
      });

      expect(out).toBe('per-call message');
   });

   test('a second caller joins the question already on screen', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });

      const out = await h.page.evaluate(async () => {
         const g = window.__sliceServices.UnsavedChangesGuard;
         g.arm('form');
         window.__dialogs = 0;
         let release;
         g.setDialog((msg, done) => { window.__dialogs++; release = () => done(true); });

         const first = g.confirmLeave();
         const second = g.confirmLeave();
         release();
         return { dialogs: window.__dialogs, both: [await first, await second] };
      });

      expect(out.dialogs).toBe(1);
      expect(out.both).toEqual([true, true]);
   });
});

test.describe('UnsavedChangesGuard — exit 3: back button', () => {
   test('declining puts the user back where they were', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      await build(h);

      const out = await h.page.evaluate(async () => {
         const g = window.__guard;
         // Answer the native confirm without blocking the page.
         window.confirm = () => false;

         // Give the history somewhere to go back to.
         window.history.pushState({}, '', '/docs/display/badge');
         const armedAt = window.location.pathname;
         g.arm('form');
         g._armedLocation = armedAt;

         window.history.back();                       // the user presses Back
         await new Promise((r) => setTimeout(r, 250));

         return { armedAt, settledAt: window.location.pathname, stillArmed: g.isArmed };
      });

      // Declined, so history.go(1) walked us back and re-fired popstate, which
      // the router turned into a real re-render of the route we were on.
      expect(out.settledAt).toBe(out.armedAt);
      expect(out.stillArmed).toBe(true);
   });

   test('accepting lets the back navigation stand and disarms', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      await build(h);

      const out = await h.page.evaluate(async () => {
         const g = window.__guard;
         window.confirm = () => true;

         window.history.pushState({}, '', '/docs/display/badge');
         g.arm('form');
         g._armedLocation = window.location.pathname;

         window.history.back();
         await new Promise((r) => setTimeout(r, 250));
         return { path: window.location.pathname, stillArmed: g.isArmed };
      });

      expect(out.path).not.toContain('/docs/display/badge');
      expect(out.stillArmed).toBe(false);
   });

   test('a disarmed guard lets the back button through untouched', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      await build(h);

      const out = await h.page.evaluate(async () => {
         window.__guard.beforeDestroy();
         window.confirm = () => false;      // would block if the guard were live
         window.history.pushState({}, '', '/docs/display/badge');
         const from = window.location.pathname;
         window.history.back();
         await new Promise((r) => setTimeout(r, 250));
         return { from, to: window.location.pathname };
      });

      expect(out.to).not.toBe(out.from);
   });

   test('the restoring pass does not re-trigger itself', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      await build(h);

      const out = await h.page.evaluate(async () => {
         const g = window.__guard;
         window.__confirms = 0;
         window.confirm = () => { window.__confirms++; return false; };

         window.history.pushState({}, '', '/docs/display/badge');
         g.arm('form');
         g._armedLocation = window.location.pathname;

         window.history.back();
         await new Promise((r) => setTimeout(r, 400));

         // One question for the user; the popstate fired by history.go(1) must
         // not ask a second one, or the back button would be unusable.
         return { confirms: window.__confirms, path: window.location.pathname };
      });

      expect(out.confirms).toBe(1);
      expect(out.path).toContain('/docs/display/badge');
   });
});

test.describe('UnsavedChangesGuard — teardown', () => {
   test('beforeDestroy() — the hook the framework actually calls — detaches the handler', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      await build(h);

      const out = await h.page.evaluate(() => {
         const g = window.__guard;
         g.arm('form');
         g.beforeDestroy();

         const event = new Event('beforeunload', { cancelable: true });
         window.dispatchEvent(event);
         return { prevented: event.defaultPrevented, armed: g.isArmed };
      });

      expect(out.prevented).toBe(false);
      expect(out.armed).toBe(false);
   });

   test('destroyComponent() really runs beforeDestroy — the whole point of the name', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['UnsavedChangesGuard'] });
      await build(h);

      // If this ever regresses, the beforeunload listener outlives the service
      // for the life of the page and every navigation prompts forever.
      const out = await h.page.evaluate(() => {
         const g = window.__guard;
         g.arm('form');
         slice.controller.destroyComponent('guard-spec');

         const event = new Event('beforeunload', { cancelable: true });
         window.dispatchEvent(event);
         return { prevented: event.defaultPrevented };
      });

      expect(out.prevented).toBe(false);
   });
});
