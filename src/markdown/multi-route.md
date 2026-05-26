---
title: MultiRoute
route: /docs/routing/multi-route
navLabel: MultiRoute
section: Routing
group: Containers
order: 51
description: MultiRoute container documentation with app-shell and dynamic route scenarios.
component: MultiRouteDocumentation
generate: true
tags: [multiroute, routing, app-shell]
---

# MultiRoute

## Overview
`MultiRoute` maps multiple URL paths to components and renders only the active match.

## Core Behavior
- Registers each route entry in the runtime router.
- Supports exact and dynamic `${param}` path matching.
- Caches rendered components and calls `update()` when reusing.
- Emits `route-rendered` with `path`, `component`, `params`, and `metadata`.

## Basic Usage
```javascript title="Build MultiRoute container"
const sections = await slice.build('MultiRoute', {
  routes: [
    { path: '/account', component: 'AccountPage' },
    { path: '/billing', component: 'BillingPage' }
  ]
});

this.appendChild(sections);
```

## Prop Scenarios
:::script label="app shell sections" expected="route list models section switching in a persistent shell"
const multi = await slice.build('MultiRoute', {
  routes: [
    { path: '/docs', component: 'DocumentationLibraryHome' },
    { path: '/docs/input/button', component: 'ButtonDocumentation' },
    { path: '/docs/layout/card', component: 'CardDocumentation' }
  ]
});

const summary = document.createElement('p');
summary.textContent = `Registered route entries: ${multi.props.routes.length}`;
return summary;
:::

:::script label="dynamic route matching" expected="matchRoute resolves params for ${param} patterns"
const multi = await slice.build('MultiRoute', {
  routes: [
    { path: '/projects/${projectId}', component: 'CardDocumentation' },
    { path: '/teams/${teamId}', component: 'CardDocumentation' }
  ]
});

const result = multi.matchRoute('/projects/alpha-42');
const output = document.createElement('p');
output.textContent = result.route
  ? `Matched ${result.route.path} with projectId=${result.params.projectId}`
  : 'No route matched';
return output;
:::

:::script label="metadata per route" expected="each route can carry metadata for guards and UI"
const multi = await slice.build('MultiRoute', {
  routes: [
    { path: '/admin', component: 'CardDocumentation', metadata: { private: true, title: 'Admin' } },
    { path: '/public', component: 'CardDocumentation', metadata: { private: false, title: 'Public' } }
  ]
});

const route = multi.props.routes.find((entry) => entry.path === '/admin');
const note = document.createElement('p');
note.textContent = `Admin route private=${route.metadata.private}`;
return note;
:::

## Best Practices
:::tip
Use `MultiRoute` inside app-shell layouts where navbar/sidebar stay mounted while inner sections switch by URL.
:::

## Pitfalls
:::warning
Do not register duplicate route paths in the same `routes` array; the first registration wins.
:::
