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
grid.style.display = 'grid';
grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
grid.style.gap = '12px';

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
  { title: 'Build Pipeline', badge: 'Healthy', progress: 82, customColor: { button: '#e2e8f0', label: '#0f172a' } },
  { title: 'QA Coverage', badge: 'Warning', progress: 63, customColor: { button: '#fde68a', label: '#7c2d12' } },
  { title: 'Deploy Queue', badge: 'Blocked', progress: 22, customColor: { button: '#fecaca', label: '#7f1d1d' } }
];

const grid = document.createElement('div');
grid.style.display = 'grid';
grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(240px, 1fr))';
grid.style.gap = '12px';

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

:::script label="Interactive card action" expected="card click toggles contextual message"
const note = document.createElement('p');
note.textContent = 'Click the card to change this message.';

const card = await slice.build('Card', {
  title: 'Release Notes',
  text: 'Tap to acknowledge latest update.',
  variant: 'minimal',
  onClick: () => {
    note.textContent = note.textContent.includes('acknowledge')
      ? 'Release acknowledged by reviewer.'
      : 'Click the card to change this message.';
  }
});

const wrapper = document.createElement('div');
wrapper.appendChild(note);
wrapper.appendChild(card);
return wrapper;
:::

:::script label="Card with action footer" expected="renders card paired with action buttons"
const card = await slice.build('Card', {
  title: 'Project Onboarding',
  text: 'Invite team members and configure permissions.',
  variant: 'elevated'
});

const invite = await slice.build('Button', { value: 'Invite', customColor: { button: '#2563eb', label: '#ffffff' } });
const permissions = await slice.build('Button', { value: 'Permissions' });

const actions = document.createElement('div');
actions.style.display = 'flex';
actions.style.gap = '8px';
actions.style.marginTop = '8px';
actions.appendChild(invite);
actions.appendChild(permissions);

const host = document.createElement('div');
host.appendChild(card);
host.appendChild(actions);
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
