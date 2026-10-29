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
`NotFound` renders a 404 fallback page when no route matches the current URL. It sets the document
title to its translated title on initialization.

## API and Behavior
- No props required. Displays a static 404 message.
- Routes: use it as the final route or as `MultiRoute`'s `fallback`.

## Texts and translation
The three texts are marked and ship their own defaults (English and Spanish), so the component works
with the translator off and translates itself when it is on:

| Key | English default | Spanish default |
| --- | --- | --- |
| `slice.notFound.title` | Page Not Found | Página no encontrada |
| `slice.notFound.message` | The page you are looking for doesn't exist or has been moved. | La página que buscas no existe o se ha movido. |
| `slice.notFound.home` | Go Home | Ir al inicio |

An app dictionary that defines these keys wins; the defaults are registered in the translator's
`defaults` layer, never overriding the app. The home button receives the key as a prop
(`slice.translator.ref`), so it follows a locale change.
- Automatically updates the page title on `init()`.
- Composable inside `MultiRoute` as the default fallback view.

## Live Preview
:::component name="NotFound"
:::

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
