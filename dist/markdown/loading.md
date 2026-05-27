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
- `isActive` can be toggled as a reactive state prop.

## Basic Usage
```javascript title="Build loading"
const loading = await slice.build('Loading');
loading.start();

setTimeout(() => {
  loading.stop();
}, 500);
```

## Prop Scenarios
:::script label="manual start and stop" expected="loading appears then hides via API"
const loading = await slice.build('Loading');

const start = await slice.build('Button', {
  value: 'Start loading',
  onClickCallback: () => loading.start()
});

const stop = await slice.build('Button', {
  value: 'Stop loading',
  onClickCallback: () => loading.stop()
});

const host = document.createElement('div');
host.appendChild(start);
host.appendChild(stop);
host.appendChild(loading);
return host;
:::

:::script label="isActive state toggle" expected="isActive true/false controls visibility"
const loading = await slice.build('Loading', { isActive: false });

const activate = await slice.build('Button', {
  value: 'Activate',
  onClickCallback: () => {
    loading.isActive = true;
  }
});

const deactivate = await slice.build('Button', {
  value: 'Deactivate',
  onClickCallback: () => {
    loading.isActive = false;
  }
});

const host = document.createElement('div');
host.appendChild(activate);
host.appendChild(deactivate);
host.appendChild(loading);
return host;
:::
