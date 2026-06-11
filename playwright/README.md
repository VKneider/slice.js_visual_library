# Component testing

Every component is tested against the **real Slice runtime** with [Playwright](https://playwright.dev/).
There is no simulated framework: Playwright boots the actual dev server, navigates to a
chrome-free harness page, and builds the component with the same `slice.build(...)` used in
production. So if a test passes, the component really works in a browser.

## How it works

```
playwright.config.js                         # runner config + auto dev server (webServer)
playwright/harness/sliceFixtures.js          # the `mount` fixture (shared by every test)
src/Components/.../<Component>.spec.js        # one test file PER COMPONENT, next to it
src/Components/AppComponents/TestHarness/     # the chrome-free /__test mount page
```

1. `webServer` in `playwright.config.js` runs `pnpm run dev` (port 3001) and waits for
   `/api/status` before tests start. It is stopped automatically afterwards.
2. The `mount` fixture navigates to `/__test` (the `TestHarness` route — see
   `parser/lib/routesSync.js`), which renders only an empty `[data-test-root]` container.
3. `mount('Button', props)` calls `window.slice.build('Button', props)` and appends the real
   node into the root. Component CSS is injected by the runtime, so styles are real too.

> **Naming contract:** Playwright tests are `*.spec.js`. The `node:test` logic tests
> (`pnpm test`, for routes/parser) are `*.test.js`. Keep the suffixes distinct — they must
> never overlap.

## Running

```bash
pnpm run test:e2e              # default gate: DOM + behaviour + a11y (no screenshots)
pnpm run test:e2e:ui           # interactive UI mode (great while writing tests)
pnpm run test:e2e -- Button    # run a single component's tests (path filter)
pnpm run test:e2e:report       # open the last HTML report
```

Visual regression is **opt-in** (tests tagged `@visual`):

```bash
pnpm run test:e2e:visual:update   # generate/refresh baseline screenshots (commit them)
pnpm run test:e2e:visual          # compare against committed baselines
```

First-time setup (browser binary is NOT auto-downloaded because pnpm runs with
`ignoreScripts=true`):

```bash
pnpm add -D @playwright/test      # once, if not installed
pnpm exec playwright install chromium
```

## The `mount` API

```js
import { test, expect } from '<relative-path>/playwright/harness/sliceFixtures.js';

test('...', async ({ mount }) => {
  const c = await mount(name, props?, opts?);
});
```

`mount(name, props = {}, opts = {})`:

| Param | Meaning |
| --- | --- |
| `name` | Registered component name, e.g. `'Button'` (must be in `components.js`). |
| `props` | **Serializable** props. Functions cannot cross into the page — use `opts.spies`. |
| `opts.spies` | `string[]` of handler prop names (`['onClick']`) to wire to recording spies. |
| `opts.theme` | Theme to force before mount. Defaults to `'LIGHT'` for deterministic output. |

Returns a handle:

| Helper | Use |
| --- | --- |
| `c.component` | Locator for the mounted element (first child of the root). |
| `c.locator(sel)` | Locator scoped **inside** the mounted subtree. |
| `c.events(name)` | `Promise<number>` — how many times a spied handler fired. |
| `c.eventArgs(name)` | `Promise<any[][]>` — serialized args captured per call. |
| `c.deprecationWarnings()` | `string[]` — `[Slice] "x" is deprecated...` lines (for §7). |
| `c.warnings()` / `c.consoleMessages()` | all `console.warn` / all console output. |
| `c.pageErrors()` | uncaught page errors (assert `[]` for a clean smoke test). |

## Writing a test for a new component

1. Copy [`src/Components/Visual/Button/Button.spec.js`](../src/Components/Visual/Button/Button.spec.js)
   next to your component as `<Component>.spec.js` and adjust the relative import depth to
   `playwright/harness/sliceFixtures.js`.
2. Cover the **baseline contract**:
   - **Smoke** — `mount(...)` renders and `c.pageErrors()` is empty.
   - **Props/setters** — each meaningful `static props` entry reflects in the DOM
     (text, class, attribute). Add one case per `allowedValues` entry where it matters.
   - **Deprecated aliases (§7)** — if the component has any, assert the alias still works
     **and** emits exactly one deprecation warning.
   - **Handlers** — `onClick`/`onChange`/etc. fire (via `spies`).
   - **A11y** — role/`tabindex`/`aria-*`/keyboard as applicable (§9 of the standards).
3. (Optional) Add a `@visual` screenshot test and generate its baseline.
4. Run `pnpm run test:e2e` — it must pass before opening a PR.

## Gotchas

- **Function props don't serialize.** Always pass handlers via `opts.spies`, never inside `props`.
- **Async handlers need `expect.poll`.** When a handler fires *after* an awaited op (e.g. an
  `onChange` invoked after `await slice.setTheme(...)`), a bare `await c.events('name')` can read
  before the spy records. Poll instead:
  `await expect.poll(() => c.events('onChange')).toBe(1)`, then assert
  `c.eventArgs('onChange')`. Handlers that fire synchronously on the click don't need this.
- **Theme stability.** Leave the default `LIGHT` theme unless a test specifically targets dark
  mode; mixing themes makes screenshots flaky.
- **Component not found / `build` returned null.** The component must be registered in
  `src/Components/components.js`. The error message points you there.
- **Children built via `slice.build`** (e.g. `Button`'s `icon` → `Icon`) need those components
  registered too — they already are in this repo.
- **IntelliSense for `mount`.** The `mount` fixture and its handle are typed centrally in
  `sliceFixtures.js`. As long as a spec imports `test`/`expect` from the harness, the editor
  autocompletes `mount`, `c.locator`, `c.events`, etc. — no per-spec typing needed.
- **Service components are not tested here.** `FetchManager`, `LocalStorageManager`, etc. are not
  Web Components, so they aren't mounted. Test their logic with `node:test` in a `*.test.js` file
  (run by `pnpm test`), mocking browser/storage APIs as needed.
