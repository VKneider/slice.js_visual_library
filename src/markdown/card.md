---
title: Card
route: /docs/layout/card
navLabel: Card
section: Layout
group: Containers
order: 20
description: Card documentation with prop scenario scripts.
component: CardDocumentation
generate: true
tags: [card, layout]
---

# Card

## Overview
`Card` provides a structured content shell with support for media, actions, badges, progress and interactive states.

## Core Behavior
- `Card` provides a reusable container for structured content with variant-driven presentation.
- Interactive mode supports actionable cards for dashboards, release notes and workflow states.
- Scenario scripts below cover status, metrics, and action-footer compositions used in production screens.

## Basic Usage
```javascript title="Build card"
const card = await slice.build('Card', {
  title: 'Profile',
  text: 'Card content',
  variant: 'elevated'
});

this.appendChild(card);
```

## Prop Scenarios
:::script label="Variant gallery" expected="renders default, outlined and elevated cards"
const variants = ['default', 'outlined', 'elevated'];

const grid = document.createElement('div');

for (const variant of variants) {
  const card = await slice.build('Card', {
    title: `Variant: ${variant}`,
    text: 'Reusable content container',
    variant
  });
  grid.appendChild(card);
}

return grid;
:::

:::script label="Status cards with badge + progress" expected="renders metrics cards with clear status"
const cards = [
  { title: 'Build Pipeline', badge: 'Healthy', progress: 82 },
  { title: 'QA Coverage', badge: 'Warning', progress: 63 },
  { title: 'Deploy Queue', badge: 'Blocked', progress: 22 }
];

const grid = document.createElement('div');

for (const config of cards) {
  const card = await slice.build('Card', {
    title: config.title,
    text: 'Operational metric snapshot',
    badge: config.badge,
    progress: config.progress,
    variant: 'outlined'
  });
  grid.appendChild(card);
}

return grid;
:::

:::script label="Card with expandable details" expected="details panel can be toggled using card control"
const card = await slice.build('Card', {
  title: 'Release Notes',
  text: 'Version 1.0.1 includes route sync and parser hardening.',
  details: 'Highlights: docs route auto-sync, tabs registration, script preview improvements.',
  variant: 'outlined'
});

return card;
:::

:::script label="Card with loading and disabled states" expected="loading and disabled visual states are applied"
const card = await slice.build('Card', {
  title: 'Project Onboarding',
  text: 'Invite team members and configure permissions.',
  variant: 'elevated',
  loading: true,
  disabled: true
});

return card;
:::

:::script label="Card as notification item" expected="compact card for inbox and activity feeds"
const card = await slice.build('Card', {
  title: 'Deployment completed',
  text: 'Version 1.0.1 is now live in production.',
  badge: 'Success',
  variant: 'outlined'
});

return card;
:::

:::script label="Card with CTA workflow" expected="card paired with follow-up action button"
const card = await slice.build('Card', {
  title: 'Customer interview notes',
  text: 'Summarize findings and send to product team.',
  variant: 'elevated',
  details: 'Open questions: onboarding friction, pricing clarity, mobile navigation expectations.'
});

const action = await slice.build('Button', {
  value: 'Open task',
  customColor: { button: '#2563eb', label: '#ffffff' }
});

const host = document.createElement('div');
host.appendChild(card);
host.appendChild(action);
return host;
:::

## Best Practices
:::tip
Use `variant` and `badge` together to surface status while keeping card content concise.
:::

## Pitfalls
:::warning
If `progress` is outside `0-100`, progress visuals are removed by design.
:::
