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
- Shows the child whose `path` matches the current URL; matching is case-insensitive and tolerant of a trailing slash (`/About` and `/about/` match `/about`).
- Supports exact and dynamic `${param}` path matching.
- Caches rendered components and calls `update()` when reusing.
- Emits `route-rendered` with `path`, `component`, `params`, and `metadata`.
- Does **not** register its paths with the Router. `routes.js` is the single source of truth, so every path a MultiRoute can show must also exist there (in the App Shell pattern they point at the shell). Otherwise a direct load, refresh, or deep-link to that URL resolves before the container mounts and falls through to `/404`.

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
summary.textContent = `Configured route entries: ${multi.props.routes.length}`;
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

:::script label="tabs navigation showcase" expected="tabs/buttons call await slice.router.navigate and MultiRoute switches content"
const tabs = document.createElement('div');
tabs.style.display = 'flex';
tabs.style.gap = '8px';
tabs.style.marginBottom = '12px';

const routes = [
  { path: '/docs/multiroute-showcase/overview', component: 'DemoRouteHome', metadata: { title: 'Overview' } },
  { path: '/docs/multiroute-showcase/form', component: 'DemoRouteDetails', metadata: { title: 'Form' } },
  { path: '/docs/multiroute-showcase/state', component: 'DemoRouteState', metadata: { title: 'State' } }
];

const multi = await slice.build('MultiRoute', {
  routes
});

for (const entry of routes) {
  const button = await slice.build('Button', {
    value: entry.metadata.title,
    onClick: async () => {
      await slice.router.navigate(entry.path);
    }
  });
  tabs.appendChild(button);
}

const host = document.createElement('div');
const note = document.createElement('p');
note.textContent = 'Use buttons to navigate between MultiRoute paths.';
host.appendChild(note);
host.appendChild(tabs);
host.appendChild(multi);
return host;
:::

## Best Practices
:::tip
Use `MultiRoute` inside app-shell layouts where navbar/sidebar stay mounted while inner sections switch by URL.
:::

## Pitfalls
:::warning
Do not declare duplicate route paths in the same `routes` array; the first match wins.
:::
