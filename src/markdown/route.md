---
title: Route
route: /docs/routing/route
navLabel: Route
section: Routing
group: Containers
order: 50
description: Route container documentation with dynamic path and metadata scenarios.
component: RouteDocumentation
generate: true
tags: [route, routing, container]
---

# Route

## Overview
`Route` renders a single component when the current URL matches a target path.

## Core Behavior
- Registers its own `path` + `component` into router map when mounted.
- Supports dynamic segments using `${param}` syntax.
- Passes `params` and `metadata` to the routed component.
- Reuses cached component instances and calls `update()` when needed.

## Basic Usage
```javascript title="Build route container"
const route = await slice.build('Route', {
  path: '/settings',
  component: 'SettingsPage',
  metadata: { requiresAuth: true }
});

this.appendChild(route);
```

## Prop Scenarios
:::script label="static route config" expected="Route stores path/component props for exact matching"
const route = await slice.build('Route', {
  path: '/account',
  component: 'CardDocumentation'
});

const summary = document.createElement('p');
summary.textContent = `${route.path} -> ${route.component}`;
return summary;
:::

:::script label="dynamic path matcher" expected="Route extracts params from ${param} patterns"
const route = await slice.build('Route', {
  path: '/users/${id}',
  component: 'CardDocumentation'
});

const matcher = route.compilePathPattern('/users/${id}');
const match = '/users/42'.match(matcher.regex);
const output = document.createElement('p');
output.textContent = match ? `Param ${matcher.paramNames[0]}=${match[1]}` : 'No match';
return output;
:::

:::script label="metadata payload" expected="Route keeps metadata available for routed component"
const route = await slice.build('Route', {
  path: '/billing',
  component: 'CardDocumentation',
  metadata: { private: true, title: 'Billing' }
});

const info = document.createElement('p');
info.textContent = `Metadata title: ${route.props.metadata.title}`;
return info;
:::

:::script label="showcase navigation controls" expected="buttons call await slice.router.navigate to move between Route targets"
const routeHome = await slice.build('Route', {
  path: '/docs/route-showcase/home',
  component: 'DemoRouteHome',
  metadata: { title: 'Route Showcase Home' }
});

const routeDetails = await slice.build('Route', {
  path: '/docs/route-showcase/details',
  component: 'DemoRouteDetails',
  metadata: { title: 'Route Showcase Details' }
});

const title = document.createElement('p');
title.textContent = 'Route showcase: use controls to navigate';

const controls = document.createElement('div');
controls.style.display = 'flex';
controls.style.gap = '8px';
controls.style.margin = '8px 0 12px';

const goHome = await slice.build('Button', {
  value: 'Go Home Route',
  onClickCallback: async () => {
    await slice.router.navigate('/docs/route-showcase/home');
  }
});

const goDetails = await slice.build('Button', {
  value: 'Go Details Route',
  onClickCallback: async () => {
    await slice.router.navigate('/docs/route-showcase/details');
  }
});

controls.appendChild(goHome);
controls.appendChild(goDetails);

const note = document.createElement('p');
note.textContent = 'Current path: ' + window.location.pathname;

const host = document.createElement('div');
host.appendChild(title);
host.appendChild(controls);
host.appendChild(note);
host.appendChild(routeHome);
host.appendChild(routeDetails);
return host;
:::

## Best Practices
:::tip
Use `metadata` to keep guards and page policies declarative instead of hard-coding checks inside components.
:::

## Pitfalls
:::warning
Dynamic params use `${param}` syntax, not `:param`.
:::
