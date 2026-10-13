---
title: Link
route: /docs/navigation/link
navLabel: Link
section: Navigation Components
group: Basic
order: 30
description: Route-aware anchor with optional icon and subtitle — the one link primitive that navigates through slice.router.
component: LinkDocumentation
generate: true
tags: [link, navigation, anchor]
---

# Link

## Overview

`Link` is a route-aware `<a>`: it keeps a real `href` in the DOM (so right-click → open in new tab
still works, and the URL is visible on hover) but intercepts the click and hands the path to
`slice.router.navigate`, so navigation goes through the client-side router instead of a full page load.

It is built with DOM APIs (`setAttribute` / `textContent`) rather than an `innerHTML` template, so a
`path` like `javascript:...` or text containing markup can never inject into the page.

## API and Behavior

- `path` — the route to navigate to. Also the anchor's `href`. Defaults to `'#'`.
- `text` — the link label.
- `classes` — extra class names applied to the `<a>`.
- `icon` — an `Icon` name rendered before the label, `aria-hidden` (the label is the accessible name).
- `iconSize` / `iconColor` — passed through to the `Icon`.
- `sub` — a secondary line under the label (a count, a description).

The anchor is an inline flex row with a gap, `text-decoration: none` and `color: inherit`, so a link
reads as part of its layout instead of fighting the UA's default link styling. Pass `classes` to add
your own hover/underline treatment.

## Prop Scenarios

:::script label="basic route-aware link" expected="clicking navigates through the router, href stays in the DOM"
const link = await slice.build('Link', { text: 'Components', path: '/docs' });
mount(link);
:::

:::script label="icon + subtitle" expected="a labelled link with an icon chip and a secondary line"
const row = document.createElement('div');
row.style.cssText = 'display:flex;flex-direction:column;gap:12px;font-family:system-ui,sans-serif;';

const docs = await slice.build('Link', {
  text: 'Components',
  sub: '42 items',
  icon: 'rocket',
  path: '/docs'
});

const plain = await slice.build('Link', { text: 'Plain link', path: '/docs' });

row.appendChild(docs);
row.appendChild(plain);
return row;
:::

## Best Practices

:::tip
Use `Link` for in-app navigation. For external destinations use a plain `<a>` with `target` /
`rel` — routing an off-site URL through the router buys nothing.
:::

## Pitfalls

:::warning
`Link` has no template and no `setComponentProps`: its props are read once, in the constructor, from
whoever built the element. Changing them later means calling `render()` again — it is not a reactive
component like `Button` or `Tabs`.
:::