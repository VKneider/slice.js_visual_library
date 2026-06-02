import { test as base, expect } from '@playwright/test';

// Shared Slice component-testing harness.
//
// Exposes a `mount` fixture that builds a component with the REAL Slice runtime
// (the same `slice.build` used in production) inside the chrome-free `/__test`
// page, and returns ergonomic helpers for assertions.
//
// Usage (in a `<Component>.spec.js` next to the component):
//
//   import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';
//
//   test('renders value', async ({ mount }) => {
//     const c = await mount('Button', { value: 'Save' });
//     await expect(c.locator('.slice_button_value')).toHaveText('Save');
//   });
//
// Function props (onClick/onChange/...) cannot cross the page boundary, so list
// them in `opts.spies`. The harness wires each to a recording spy you can read
// back with `events(name)` / `eventArgs(name)`.

const DEFAULT_THEME = 'LIGHT';

/**
 * Handle returned by `mount`, with helpers scoped to the mounted component.
 * @typedef {object} MountHandle
 * @property {import('@playwright/test').Locator} component  Mounted element (first child of the harness root).
 * @property {import('@playwright/test').Locator} root  The harness root locator.
 * @property {(selector: string) => import('@playwright/test').Locator} locator  Query scoped inside the mounted subtree.
 * @property {(handlerName: string) => Promise<number>} events  How many times a spied handler fired.
 * @property {(handlerName: string) => Promise<any[]>} eventArgs  Serialized args captured per call.
 * @property {() => string[]} warnings  All console.warn lines.
 * @property {() => string[]} deprecationWarnings  Slice deprecation warnings (§7).
 * @property {() => Array<{ type: string, text: string }>} consoleMessages  All console output.
 * @property {() => string[]} pageErrors  Uncaught page errors.
 */

/**
 * Custom fixtures added on top of Playwright's built-ins.
 * @typedef {object} SliceFixtures
 * @property {(name: string, props?: Record<string, any>, opts?: { spies?: string[], theme?: string | null }) => Promise<MountHandle>} mount
 */

/** @type {import('@playwright/test').TestType<import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & SliceFixtures, import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions>} */
export const test = base.extend({
   mount: async ({ page }, use) => {
      const consoleMessages = [];
      const pageErrors = [];
      page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
      page.on('pageerror', (err) => pageErrors.push(err.message));

      await page.goto('/__test');
      // Wait for the runtime and the harness mount point to be ready.
      await page.waitForFunction(() => !!(window.slice && typeof window.slice.build === 'function'));
      // The root is empty (0×0) until a component is mounted, so wait for it to be
      // ATTACHED, not visible — otherwise Playwright's default visibility wait times out.
      await page.waitForSelector('[data-test-root]', { state: 'attached' });

      /**
       * Build a component into the harness root.
       * @param {string} name    Registered component name (e.g. 'Button').
       * @param {object} props    Serializable props.
       * @param {object} [opts]   { spies?: string[], theme?: string|null }
       * @returns handle with { component, root, locator, events, eventArgs, warnings, deprecationWarnings, consoleMessages, pageErrors }
       */
      async function mount(name, props = {}, opts = {}) {
         const { spies = [], theme = DEFAULT_THEME } = opts;

         if (theme) {
            await page.evaluate((t) => window.slice.setTheme(t), theme);
         }

         const built = await page.evaluate(
            async ({ name, props, spies }) => {
               const root = document.querySelector('[data-test-root]');
               root.innerHTML = '';
               window.__sliceTestEvents = {};

               const finalProps = { ...props };
               for (const spyName of spies) {
                  window.__sliceTestEvents[spyName] = [];
                  finalProps[spyName] = (...args) => {
                     const safe = args.map((a) => {
                        try {
                           return JSON.parse(JSON.stringify(a));
                        } catch {
                           return String(a);
                        }
                     });
                     window.__sliceTestEvents[spyName].push(safe);
                  };
               }

               const node = await window.slice.build(name, finalProps);
               if (!node) return false;
               root.appendChild(node);
               window.__sliceMounted = node;
               return true;
            },
            { name, props, spies }
         );

         if (!built) {
            throw new Error(
               `slice.build('${name}', ...) returned null. ` +
                  `Check the component is registered in src/Components/components.js and has no build error (see console output).`
            );
         }

         const root = page.locator('[data-test-root]');
         return {
            // The mounted component element (first child of the harness root).
            component: root.locator(':scope > *').first(),
            // The harness root locator.
            root,
            // Query scoped INSIDE the mounted subtree.
            locator: (selector) => root.locator(selector),
            // Number of times a spied handler fired.
            events: (handlerName) =>
               page.evaluate((n) => (window.__sliceTestEvents?.[n] || []).length, handlerName),
            // The serialized arguments captured per call: Array<Array<any>>.
            eventArgs: (handlerName) =>
               page.evaluate((n) => window.__sliceTestEvents?.[n] || [], handlerName),
            // All captured console.warn lines.
            warnings: () => consoleMessages.filter((m) => m.type === 'warning').map((m) => m.text),
            // Only the Slice deprecation warnings (§7 alias pattern).
            deprecationWarnings: () =>
               consoleMessages
                  .filter((m) => m.type === 'warning' && /\[Slice\].*deprecated/i.test(m.text))
                  .map((m) => m.text),
            consoleMessages: () => [...consoleMessages],
            pageErrors: () => [...pageErrors],
         };
      }

      await use(mount);
   },
});

export { expect };
