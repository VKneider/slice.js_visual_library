---
title: Breadcrumbs
route: /docs/navigation/breadcrumbs
navLabel: Breadcrumbs
section: Navigation
group: Core
order: 34
description: Breadcrumbs component for hierarchical navigation context and quick backtracking.
component: BreadcrumbsDocumentation
generate: true
tags: [breadcrumbs, navigation, hierarchy]
---

# Breadcrumbs

## Overview
`Breadcrumbs` shows the current navigation hierarchy in a compact horizontal trail (for example:
`Docs / Navigation / Breadcrumbs`). It helps users understand where they are and quickly go back
to a parent section.

## Core Behavior
- `items` use the canonical navigation shape `{ text, path }`.
- `children` accepts a route-tree shape (`{ path, text?, title?, children? }`) like route configs,
  and auto-resolves the breadcrumb trail for `currentPath` (or `window.location.pathname`).
- Every segment except the current one is rendered as a link and uses `slice.router.navigate(path)`.
- The last segment is marked with `aria-current="page"` by default.
- `includeCurrent: false` hides the last segment when you only want parent links.
- `maxItems` collapses long trails into an ellipsis segment (`...`) to keep layouts tidy.

## Live Preview
:::component name="Breadcrumbs"
{
  "items": [
    { "text": "Docs", "path": "/docs" },
    { "text": "Navigation", "path": "/docs/navigation" },
    { "text": "Breadcrumbs", "path": "/docs/navigation/breadcrumbs" }
  ]
}
:::

## Prop Scenarios
:::script label="Docs hierarchy trail" expected="parent sections are links and current page is highlighted"
const breadcrumbs = await slice.build('Breadcrumbs', {
  items: [
    { text: 'Docs', path: '/docs' },
    { text: 'Navigation', path: '/docs/navigation' },
    { text: 'Breadcrumbs', path: '/docs/navigation/breadcrumbs' }
  ]
});

return breadcrumbs;
:::

:::script label="Collapsed long trail" expected="middle segments collapse into ellipsis"
const breadcrumbs = await slice.build('Breadcrumbs', {
  maxItems: 3,
  items: [
    { text: 'Docs', path: '/docs' },
    { text: 'Navigation', path: '/docs/navigation' },
    { text: 'Routing', path: '/docs/routing' },
    { text: 'Guards', path: '/docs/routing/guards' }
  ]
});

return breadcrumbs;
:::

:::script label="Route tree + currentPath (MultiRoute style)" expected="trail resolves from children tree"
const routeChildren = [
  {
    path: '/docs',
    text: 'Docs',
    children: [
      {
        path: '/navigation',
        text: 'Navigation',
        children: [
          { path: '/breadcrumbs', text: 'Breadcrumbs' }
        ]
      }
    ]
  }
];

const breadcrumbs = await slice.build('Breadcrumbs', {
  children: routeChildren,
  currentPath: '/docs/navigation/breadcrumbs'
});

return breadcrumbs;
:::

:::script label="Functional MultiRoute + Demo components" expected="breadcrumbs and view swap together"
const container = document.createElement('section');
container.style.display = 'grid';
container.style.gap = '10px';

const controls = document.createElement('div');
controls.style.display = 'flex';
controls.style.gap = '8px';
controls.style.flexWrap = 'wrap';

const frame = document.createElement('div');
frame.style.border = '1px solid color-mix(in srgb, var(--primary-color-shade) 55%, transparent)';
frame.style.borderRadius = '10px';
frame.style.padding = '10px';

const routes = [
  { path: '/demo/home', component: 'DemoRouteHome' },
  { path: '/demo/details', component: 'DemoRouteDetails' },
  { path: '/demo/state', component: 'DemoRouteState' }
];

const children = [
  {
    path: '/demo',
    text: 'Demo',
    children: [
      {
        path: '/home',
        text: 'Home'
      },
      {
        path: '/details',
        text: 'Details'
      },
      {
        path: '/state',
        text: 'State'
      }
    ]
  }
];

const breadcrumbs = await slice.build('Breadcrumbs', {
  children,
  currentPath: '/demo/home'
});

const multi = await slice.build('MultiRoute', { routes });

let demoPath = '/demo/home';
const originalMatchRoute = multi.matchRoute.bind(multi);
multi.matchRoute = () => originalMatchRoute(demoPath);

const setDemoPath = async (path) => {
  demoPath = path;
  breadcrumbs.currentPath = path;
  await multi.render();
};

for (const route of routes) {
  const button = await slice.build('Button', {
    value: route.path.split('/').pop(),
    onClick: () => setDemoPath(route.path)
  });
  controls.appendChild(button);
}

frame.appendChild(multi);
container.appendChild(breadcrumbs);
container.appendChild(controls);
container.appendChild(frame);

await setDemoPath('/demo/home');

return container;
:::

:::script label="Parent links only" expected="current page is hidden for compact headers"
const breadcrumbs = await slice.build('Breadcrumbs', {
  includeCurrent: false,
  separator: '>',
  items: [
    { text: 'Docs', path: '/docs' },
    { text: 'Navigation', path: '/docs/navigation' },
    { text: 'Breadcrumbs', path: '/docs/navigation/breadcrumbs' }
  ]
});

return breadcrumbs;
:::

## Best Practices
:::tip
Use `Breadcrumbs` near page titles or section headers, not as the primary navigation. Keep labels
short and meaningful so the trail stays scannable.
:::

:::tip
When your app already has route definitions as trees (e.g. nested children under `Route`/`MultiRoute`),
pass that structure in `children` and provide `currentPath` so `Breadcrumbs` stays in sync without
duplicating `items` arrays.
:::

## Pitfalls
:::warning
Avoid non-clickable parent segments with empty `path` values if users are expected to navigate
back from the breadcrumb trail.
:::
