---
title: NotFound
route: /docs/navigation/not-found
navLabel: NotFound
section: Navigation
group: Core
order: 40
description: NotFound 404 page documentation with route fallback scenarios.
component: NotFoundDocumentation
generate: true
tags: [not-found, 404, navigation, routing]
---

# NotFound

## Overview
`NotFound` renders a 404 fallback page when no route matches the current URL. It sets the document title to "404 - Not Found" on initialization.

## API and Behavior
- No props required. Displays a static 404 message.
- Automatically updates the page title on `init()`.
- Composable inside `MultiRoute` as the default fallback view.

## Basic Usage
```javascript title="Build not found page"
const notFound = await slice.build('NotFound', {});
this.appendChild(notFound);
```

## Prop Scenarios
:::script label="Default 404 view" expected="renders not found message"
const notFound = await slice.build('NotFound', {});
return notFound;
:::

:::script label="Route fallback usage" expected="renders not found inside route container"
const notFound = await slice.build('NotFound', {});

const route = await slice.build('Route', {
  path: '/does-not-exist',
  view: notFound
});

const host = document.createElement('div');
const label = document.createElement('p');
label.textContent = 'Route /does-not-exist mapped to NotFound:';
host.appendChild(label);
host.appendChild(route);
return host;
:::

## Best Practices
:::tip
Use `NotFound` as the final route inside `MultiRoute` to catch unmatched paths.
:::

## Pitfalls
:::warning
`NotFound` is a presentation-only component. It does not provide automatic redirect logic.
:::
