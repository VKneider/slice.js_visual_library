---
title: Loading
route: /docs/feedback/loading
navLabel: Loading
section: Feedback
group: Status
order: 40
description: Loading component documentation with activation and container usage scenarios.
component: LoadingDocumentation
generate: true
tags: [loading, feedback]
---

# Loading

## Overview
`Loading` displays a blocking spinner overlay either fullscreen or inside a target container.

## Core Behavior
- `start(container?)` mounts the loading overlay.
- `stop()` removes it and restores container styles.
- `active` can be toggled as a reactive state prop.

## Prop Scenarios
:::script label="manual start and stop" expected="loading appears then hides via API"
const loading = await slice.build('Loading');

const start = await slice.build('Button', {
  value: 'Start loading',
  onClick: () => loading.start()
});

const stop = await slice.build('Button', {
  value: 'Stop loading',
  onClick: () => loading.stop()
});

const host = document.createElement('div');
host.appendChild(start);
host.appendChild(stop);
host.appendChild(loading);
return host;
:::

:::script label="active state toggle" expected="active true/false controls visibility"
const loading = await slice.build('Loading', { active: false });

const activate = await slice.build('Button', {
  value: 'Activate',
  onClick: () => {
    loading.active = true;
  }
});

const deactivate = await slice.build('Button', {
  value: 'Deactivate',
  onClick: () => {
    loading.active = false;
  }
});

const host = document.createElement('div');
host.appendChild(activate);
host.appendChild(deactivate);
host.appendChild(loading);
return host;
:::
