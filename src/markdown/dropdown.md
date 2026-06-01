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
`DropDown` groups related links under a compact expandable navigation trigger.

## Core Behavior
- `label` sets the trigger text.
- `options` renders link items (`text` + `href`).
- The menu opens on click and closes when you pick an option, click the trigger again, or click outside it.

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
