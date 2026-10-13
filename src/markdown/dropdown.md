---
title: DropDown
route: /docs/navigation/dropdown
navLabel: DropDown
section: Navigation
group: Core
order: 32
description: DropDown component documentation with practical navigation scenarios.
component: DropDownDocumentation
generate: true
tags: [dropdown, navigation]
---

# DropDown

## Overview
`DropDown` groups related links **or actions** under a compact expandable trigger.

## Core Behavior
- `label` sets the trigger text.
- `options` renders items. Each item is a **link** (`text` + `href`/`path`, `path` navigates through `slice.router`) or an **action** (`text` + `callback`).
- The menu opens on click and closes when you pick an option, click the trigger again, or click outside it.
- The box is right-anchored so it stays on screen for a trigger at the end of a toolbar, and flips back to left-anchored below 760px.

## Actions, not just links
An item with a `callback` runs the function and closes the menu. It never navigates — `callback`
takes precedence over `path`/`href`, so an item carrying both runs the callback and stays put. Before
`callback`, the only way to express a non-navigating item was a placeholder `href: '#'` that went
nowhere.

:::script label="Action menu" expected="picking an item runs the action and shows the result"
const result = document.createElement('p');
result.textContent = 'No action yet';
result.style.cssText = 'font-family:system-ui,sans-serif;font-size:13px;color:#6b7280;';

const menu = await slice.build('DropDown', {
  label: 'Export',
  options: [
    { text: 'Download JSON', callback: () => { result.textContent = 'Downloaded'; } },
    { text: 'Print view', callback: () => { result.textContent = 'Print dialog opened'; } },
    { text: 'Back to docs', path: '/docs' }
  ]
});

const host = document.createElement('div');
host.appendChild(menu);
host.appendChild(result);
return host;
:::

## Live Preview
:::component name="DropDown"
{
  "label": "Resources",
  "options": [
    {
      "text": "Docs",
      "href": "/docs"
    },
    {
      "text": "GitHub",
      "href": "#"
    }
  ]
}
:::

## Prop Scenarios
:::script label="docs navigation dropdown" expected="dropdown renders links for docs sections"
const menu = await slice.build('DropDown', {
  label: 'Documentation',
  options: [
    { text: 'Button', href: '/docs/input/button' },
    { text: 'Input', href: '/docs/input/input' },
    { text: 'Card', href: '/docs/layout/card' }
  ]
});

return menu;
:::

:::script label="product menu" expected="dropdown can represent product navigation groups"
const menu = await slice.build('DropDown', {
  label: 'Product',
  options: [
    { text: 'Overview', href: '/docs' },
    { text: 'Changelog', href: '/docs/layout/details' },
    { text: 'Roadmap', href: '/docs/navigation/tabs' }
  ]
});

return menu;
:::
