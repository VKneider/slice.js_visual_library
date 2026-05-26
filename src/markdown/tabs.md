---
title: Tabs
route: /docs/navigation/tabs
navLabel: Tabs
section: Navigation
group: Core
order: 31
description: Deep Tabs documentation with behavior-first scenarios and integration patterns.
component: TabsDocumentation
generate: true
tags: [tabs, navigation, routing]
---

# Tabs

## Overview
`Tabs` organizes related views in a compact navigation pattern where users switch context without leaving the current surface.

Use it for dashboards, settings pages, reporting workspaces, and any area where users frequently compare categories.

## Core behavior
- Tabs keep one panel active at a time and visually mark the selected context.
- Selection can be user-driven (click) or controlled from external state.
- Panel content should stay focused and lightweight to keep context switches responsive.
- Pair tabs with concise labels and stable ordering to preserve orientation.

## Advanced use cases
- Settings workspaces where each tab owns a form section and independent save flow.
- Data-heavy dashboards where tabs split long pages into digestible operational slices.
- Route-aware tabs that mirror URL query/path state so deep links open the right panel.
- Lazy activation patterns where expensive content mounts only after first selection.

## Prop Scenarios
:::script label="basic tabs navigation" expected="renders tabs and switches visible panel content"
const tabs = await slice.build('Tabs', {
  items: [
    { id: 'overview', label: 'Overview' },
    { id: 'usage', label: 'Usage' },
    { id: 'history', label: 'History' }
  ],
  activeTab: 'overview'
});

const content = document.createElement('div');
content.style.marginTop = '10px';
content.textContent = 'Overview content';

tabs.onTabChange = (tabId) => {
  if (tabId === 'usage') {
    content.textContent = 'Usage content';
  } else if (tabId === 'history') {
    content.textContent = 'History content';
  } else {
    content.textContent = 'Overview content';
  }
};

const host = document.createElement('div');
host.appendChild(tabs);
host.appendChild(content);
return host;
:::

:::script label="controlled active tab" expected="external controls drive selected tab"
let active = 'profile';

const tabs = await slice.build('Tabs', {
  items: [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'billing', label: 'Billing' }
  ],
  activeTab: active,
  onTabChange: (tabId) => {
    active = tabId;
    tabs.activeTab = active;
    panel.textContent = `Current panel: ${active}`;
  }
});

const panel = document.createElement('div');
panel.style.marginTop = '8px';
panel.textContent = `Current panel: ${active}`;

const jumpToBilling = await slice.build('Button', {
  value: 'Go to Billing',
  onClickCallback: () => {
    active = 'billing';
    tabs.activeTab = active;
    panel.textContent = `Current panel: ${active}`;
  }
});

const host = document.createElement('div');
host.style.display = 'grid';
host.style.gap = '10px';
host.appendChild(tabs);
host.appendChild(jumpToBilling);
host.appendChild(panel);
return host;
:::

:::script label="tabs with route-state integration" expected="tab changes update route query state"
const mockRouteState = { section: 'summary' };

const tabs = await slice.build('Tabs', {
  items: [
    { id: 'summary', label: 'Summary' },
    { id: 'errors', label: 'Errors' },
    { id: 'activity', label: 'Activity' }
  ],
  activeTab: mockRouteState.section,
  onTabChange: (tabId) => {
    mockRouteState.section = tabId;
    status.textContent = `Route query ?section=${mockRouteState.section}`;
  }
});

const status = document.createElement('p');
status.textContent = `Route query ?section=${mockRouteState.section}`;

const host = document.createElement('div');
host.appendChild(tabs);
host.appendChild(status);
return host;
:::

:::script label="lazy panel rendering" expected="panel content mounts only on first activation"
const mounted = new Set();
const panel = document.createElement('div');
panel.style.marginTop = '8px';

const renderPanel = (tabId) => {
  if (!mounted.has(tabId)) {
    mounted.add(tabId);
  }
  panel.textContent = `Mounted panels: ${Array.from(mounted).join(', ')}`;
};

const tabs = await slice.build('Tabs', {
  items: [
    { id: 'alpha', label: 'Alpha' },
    { id: 'beta', label: 'Beta' },
    { id: 'gamma', label: 'Gamma' }
  ],
  activeTab: 'alpha',
  onTabChange: (tabId) => {
    renderPanel(tabId);
  }
});

renderPanel('alpha');

const host = document.createElement('div');
host.appendChild(tabs);
host.appendChild(panel);
return host;
:::

:::script label="tabs inside analytics workspace" expected="tabs compose with cards for segmented metrics"
const tabs = await slice.build('Tabs', {
  items: [
    { id: 'traffic', label: 'Traffic' },
    { id: 'conversion', label: 'Conversion' },
    { id: 'retention', label: 'Retention' }
  ],
  activeTab: 'traffic'
});

const card = await slice.build('Card', {
  title: 'Traffic KPI',
  text: 'Monitor active sessions and acquisition trends.',
  variant: 'outlined'
});

const host = document.createElement('div');
host.style.display = 'grid';
host.style.gap = '10px';
host.appendChild(tabs);
host.appendChild(card);
return host;
:::

## Accessibility notes
- Keep tab labels concise and unique so screen-reader users can distinguish options quickly.
- Ensure visible focus styles remain clear for keyboard navigation.
- Preserve logical tab order and avoid moving focus unexpectedly when panels switch.
- If panel updates are significant, include clear heading structure inside each panel.

## Best Practices
:::tip
Use tabs for sibling content groups only. If users must complete a sequence, prefer a stepper or wizard pattern.
:::

## Pitfalls
:::warning
Do not hide critical validation errors inside inactive tabs without a global indicator. Users should know where attention is required.
:::
