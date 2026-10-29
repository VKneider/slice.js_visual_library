---
id: "0007"
title: "Library texts through slice.translator, and routes through slice.router"
repo: "slicejs-components"
status: in-progress
area: components
priority: medium
created: 2026-10-28
updated: 2026-10-28
target: "TBD"
owners: []
related:
  - "slice.js/features/0003-slice-translator-locales-in-templates-props-urls-and-seo.md (the contract)"
  - "slicejs-cli/features/0003-translator-and-multilingual-seo-commands.md"
  - "COMPONENT_API_STANDARDS.md"
  - "src/Components/shared/"
---

# Library texts through slice.translator, and routes through slice.router

## Summary

Make the visual library a good citizen of `slice.translator` (framework feature 0003): every text a
component writes by itself ("Close", "Clear date", "Undo", Table and DataList labels, "Page Not
Found") becomes a `slice.*` key with English and Spanish defaults; components refresh those texts
when the locale changes; numbers and dates follow the app's locale; and the components that read
`window.location.pathname` move to `slice.router.path` / `href()`, so they keep working when the
locale is in the URL. Then the docs site dogfoods it in English and Spanish.

## Problem / motivation

- Built-in texts are English literals spread over templates and code. Today an app in Spanish
  overrides them prop by prop (`dismissLabel`, `labels`, `texts`, `closeLabel`…), each component with
  its own prop name.
- Components that show dates and numbers (DescriptionList, Table, DatePicker, DataList) each create
  their own `Intl` objects from their own `locale` prop; an app has to pass the same locale to each.
- `Route`, `MultiRoute`, `Navbar`, `BottomNav`, `SideMenu`, `Breadcrumbs` and `TreeView` (plus `App`,
  `ComponentsPage` and `UnsavedChangesGuard` in the docs app) compare `window.location.pathname` with
  their paths. With `/en/pricing` in the URL, none of them would find the active route.

## Proposed direction

### 1. Keys under `slice.*`

One namespace per component: `slice.modal.close`, `slice.datepicker.clear`, `slice.datepicker.choose`,
`slice.table.undo`, `slice.datalist.removedOne`, `slice.notFound.title`, … The inventory (every
literal a component writes, in its template or its code) is the first task of the PR.

### 2. Shipping the defaults

The library is copied into apps component by component (`slice get`), so each component carries its
own defaults instead of a central file. A small shared helper registers them once, at the **lowest
priority**, the first time the component is built:

```js
// src/Components/shared/text/texts.js
export function texts(namespace, defaults) { … }   // registers { en, es } as defaults, returns a lookup

// In Modal.js
const t = texts('slice.modal', {
  en: { close: 'Close' },
  es: { close: 'Cerrar' },
});
this.$close.setAttribute('aria-label', this._closeLabel || t('close'));
```

- With the translator **enabled**: the lookup is `slice.t('slice.modal.close')`; an app dictionary
  that defines `slice.modal.close` wins over the library's default.
- With the translator **disabled** (or a framework without it): the lookup returns the English
  default. Today's behaviour, unchanged.

This needs one addition to the framework contract: `slice.translator.add(locale, messages,
{ defaults: true })`, a layer that never overrides what the app's dictionaries define (framework 0003,
open point).

**Priority, from highest:** the instance prop (`closeLabel`, `labels`, `texts`, `dismissLabel`) → the
app's dictionary → the library's default → the key.

### 3. Refreshing on a locale change

Built-in texts are **marked**, not written: a component puts `data-t="slice.modal.close"` (and
`data-t-*` params) on the element, and the framework translates it now and on every locale change.
Text props passed by the app as `slice.translator.key(…)` need nothing either: the framework
re-assigns them. Only formatted dates and numbers inside a component (Table cells, DatePicker
labels) repaint through `slice.translator.watch(this, …)`.

When an instance prop overrides a built-in text, the component writes the prop's text and removes
the `data-t` from that element, so the framework does not overwrite it.

`COMPONENT_API_STANDARDS.md` gains a rule: a text prop is applied in its setter and read from the
prop when painting — never copied once in the constructor — so a re-assigned prop shows.

### 4. Formatting

`shared/data/dates.js` and the number/currency formatting in DescriptionList, Table, DataList and
DatePicker use `slice.translator.format.*` when the translator is enabled. A component's own `locale`
prop still wins (a table of prices in a fixed currency format, say).

### 5. Routes through the router

`Route`, `MultiRoute`, `Navbar`, `BottomNav`, `SideMenu`, `Breadcrumbs`, `TreeView`, and in the docs
app `App`, `ComponentsPage` and `UnsavedChangesGuard`:

- read the current path from `slice.router.path` instead of `window.location.pathname`;
- build `<a href>` with `slice.router.href(path)`, so a link carries the locale when `routing` is on.

Useful on its own: one place decides what "the current route" is. Their specs gain a case with a
locale prefix.

### 6. The docs site, in English and Spanish

The components docs adopt `translator` with `routing: "prefix-except-default"` (English default, so
today's URLs do not move; Spanish under `/es/`):

- the shell (navigation, search, buttons, the copy-as-markdown menu, theme switcher, 404) through
  `data-t` and `slice.translator.key()`;
- `seo.json` defaults and the docs' generic metadata through `{ "t": … }`;
- per-route OG cards per locale (CLI 0003 `seo images`).

Translating the **markdown content** of each page (a second set of `src/markdown/es/*.md`, parsed per
locale) is a separate, later feature: the shell and SEO first, so the mechanism is proven before the
content doubles.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| One `locales/slice.en.json` shipped with the library | `slice get` copies components, not the library; a central file would hold texts of components the app does not have, and need its own sync. |
| Keep per-component text props only | Every app repeats the same Spanish strings, prop by prop, with different prop names per component. Props stay, as the highest priority. |
| Translate in each component with `slice.t()` directly, no helper | Breaks with the translator disabled (the key shows instead of today's English text). |

## Scope

### In scope
- Inventory and migration of every built-in text to `slice.*` keys, English and Spanish.
- `shared/text/texts.js` and its README entry.
- Built-in texts marked with `data-t` / `data-t-*`; `watch()` for formatted values; the standards rule.
- Formatting through `slice.translator.format.*`.
- The ten components moved to `slice.router.path` / `href()`.
- Docs site shell + SEO in English and Spanish.

### Out of scope
- Translating the markdown content of the docs pages (later feature).
- Locales beyond English and Spanish for the library defaults (apps add their own through their
  dictionaries; contributions welcome per locale).

## Compatibility and risk

- **Depends on** framework 0003 (`slice.translator`, `add(…, { defaults })`, `slice.router.path` /
  `href()`). Components must keep working on a framework without them: the helper and a
  `slice.router.path ?? window.location.pathname` fallback cover that during the transition.
- Existing text props keep their names and keep winning; no app breaks.
- A component's default English text does not change, so screenshots and specs in English stay valid.

## Validation plan

- Per component with built-in texts: English default with the translator off; Spanish with it on;
  an app dictionary overriding a `slice.*` key; an instance prop overriding both; the text updating
  after `setLocale()`.
- Router-aware components: active item correct at `/es/docs/…` and at `/docs/…`; links carry the
  prefix.
- `slice translator check` (CLI 0003) clean on the docs site in both locales.
- SEO: `/es/docs/input/button` prerendered in Spanish with `hreflang` to the English page.

## Documentation impact

- Each component doc: a "Texts and translation" note listing its `slice.*` keys and its text props.
- `shared/README.md`: `text/texts.js`.
- `COMPONENT_API_STANDARDS.md`: built-in texts through `texts()`, text props read when painting,
  routes through `slice.router`.

## Open questions

1. Key naming: `slice.modal.close` (namespace per component) or flat `slice.close` shared by every
   component that has a close button?
2. Should the docs default to English (today's URLs stay) with Spanish under `/es/`, as proposed?

## Decision log

- 2026-10-28 — Library texts are defaults at the lowest priority; app dictionaries and instance
  props override them.
- 2026-10-28 — The router migration ships with this feature, but is useful without any locale.
- 2026-10-28 — Router migration done: Route, MultiRoute, Navbar, BottomNav, Breadcrumbs, SideMenu,
  TreeView, Link, Card, DataList, DescriptionList, Pagination, ComponentsPage and
  UnsavedChangesGuard read `slice.path` and build anchors with `slice.href()`.
  - The first pass added `shared/router/paths.js`; it was **removed** in review: the router is
    mandatory, so the shortcuts belong on the instance (`slice.path`, `slice.href()`) and components
    import nothing extra (`slice get` copies less). `slice.href()` leaves fragments, schemes,
    protocol-relative URLs and relative templates untouched.
  - `NotFound` is the first component on the texts contract: `shared/text/texts.js` registers
    `slice.notFound.*` (en/es) in the translator's defaults layer, the template is marked with
    `data-t`, and the home button receives `slice.translator.key()`. `shared/data/dates.js` now uses
    `translator.format` for relative/full dates when no explicit `locale` is passed.
  - Proof: `slicejs-lab` runs with `routing: "prefix-except-default"`; its e2e covers `/en`,
    `navigate({ locale })`, back/forward, `/es/...` canonicalization, an unknown prefix as a 404 and
    the Spanish 404 defaults. `COMPONENT_API_STANDARDS.md` §16 records the contract.
  - Remaining: the full text inventory of DataList, Table, DatePicker, Select and Pagination; the
    docs site in English/Spanish; per-locale OG cards. The lib ships with the router migration, the
    helper and the exemplar; those components keep today's English until their inventory lands.
