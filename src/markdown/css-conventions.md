---
title: CSS Conventions
route: /docs/internal/css-conventions
navLabel: CSS Conventions
section: Internal
group: Documentation
order: 2
description: Three rules to write component CSS that never leaks — host scope, explicit display, and prefixed keyframes.
component: CssConventionsDocumentation
generate: true
tags: [css, scoping, encapsulation, display, conventions]
---

# CSS Conventions

Two problems component CSS has to solve:
1. Styles inside your component leak **out** — `.container` in your component restyles every `.container` on the page.
2. Styles **outside** leak **in** — a global reset or utility framework overrides your internal layout.

The fix is three dead-simple rules.

---

## 1. Scope everything under `slice-<name>`

Your component's custom-element tag is your namespace. Every selector starts with it.

```css
/* ❌ affects every .slice_input in the app */
.slice_input { ... }

/* ✅ only fires inside <slice-input> */
slice-input .slice_input { ... }
```

- The tag name is what `customElements.define('slice-...')` registers — it's **not** always the folder name (`Navbar` → `slice-nav-bar`, `MiniInspector` → `slice-mini-inspector`).
- Generic names like `.container`, `.item`, `.card-title` are the most dangerous — always prefix.
- `@media` / `@supports` blocks don't get a pass — scope the selectors inside them too.

:::script label="Scoping demo" expected="two buttons where only the scoped card has styles"
const btn = await slice.build('Button', { value: 'Show scoping demo' });
btn.onClick = async () => {
  // Build a component to show how scoping works
  const card = await slice.build('Card', {
    title: 'Scoped',
    value: 'Only <slice-card> styles apply here'
  });
  card.style.margin = '0';
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '0.75rem';
  container.style.padding = '1rem';
  container.style.border = '1px dashed #ccc';
  container.style.borderRadius = '0.5rem';

  const p = document.createElement('p');
  p.style.fontSize = '0.8rem';
  p.style.margin = '0 0 0.5rem';
  p.textContent = 'The Card below uses scoped selectors — its .slice_card styles cannot leak out or be overridden by global CSS:';
  container.appendChild(p);
  container.appendChild(card);
  document.body.appendChild(container);
  // Clean up after 5 seconds
  setTimeout(() => container.remove(), 5000);
};
return btn;
:::

---

## 2. Set an explicit `display` on the host

Custom elements default to `display: inline`. That silently:
- Ignores `width` / `height`
- Drops vertical `margin`
- Sits the component on the text baseline

Set `display` as the **first rule** in your CSS.

```css
slice-input  { display: block; }
slice-button { display: inline-block; }
```

| `display` | When to use |
| --- | --- |
| `block` | form fields, layout/data containers, full-width strips (Input, Select, Textarea, Card, Grid, Tabs, Navbar, Pagination, …) |
| `inline-block` | content-sized inline controls (Button, Switch, Checkbox, Icon) |
| `inline-flex` / `flex` | the host is the flex container (ToolTip) |
| `contents` | pure wrappers that should not introduce a box (Modal) |

> The element selector is low-specificity, so consuming apps can still override it (`slice-button { display: flex }`). Declaring it just removes the broken `inline` default.

---

## 3. Prefix `@keyframes`

Keyframe names are **global**. Bare `@keyframes spin` collides across components.

```css
/* ❌ */ @keyframes spin { ... }
/* ✅ */ @keyframes slice_loading_spin { ... }
```

---

## Exceptions (deliberate leaks)

Some components append nodes to `document.body` — those elements live outside the component tree, so their styles stay global with a comment explaining why:

- **ToolTip** — `.slice-tooltip-bubble*` appended to `document.body`
- **Toast** — `.toast-provider-container*` created on `document.body`
- **Icon** — `.slc-*` icon-font glyph stylesheet
- **Card** — `.slice-card*` is the host's own class (`this.classList.add('slice-card')`), already host-scoped

---

## Common mistakes

:::warning
**Renaming a class to scope it changes the CSS selector, not the DOM.** Components keep adding the same class names, so `*.spec.js` assertions on `.some_class` still pass. If a rule was intentionally matching outside the component (a true leak), scoping will stop it — move that styling into the consuming app.
:::

:::warning
Scoping raises every rule's specificity uniformly (one element selector). If an app override stops working after you scope, **don't bump the component's specificity** — adjust the override instead.
:::
