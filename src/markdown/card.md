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

## Live Preview
:::component name="Card"
{
  "title": "Profile",
  "text": "A reusable content container with a title and body.",
  "variant": "elevated"
}
:::

## Icons

Two independent slots, and they are different things:

- `headerIcon` — the small mark **beside the title**, in a rounded chip. This is the
  usual "card with an avatar or a glyph" look. Accepts a name or
  `{ name, size, color }`:

  ```javascript
  await slice.build('Card', { title: 'Slice.js', headerIcon: 'sliceJs' });
  ```

- `icon` — the **banner above the content**, for an image or a large mark. Use it for
  artwork, not for a glyph; for a glyph, use `headerIcon`.

Neither is shown unless you ask. A Card with neither has no icon row at all.

:::tip
The Slice marks (`sliceJs`, `slicePizza`, `sliceLogo`, `singleSlice`) carry their own
viewBox from the original sprite — `sliceJs` is 1061x1320, not 24x24 — so they fill the
chip correctly instead of overflowing it.
:::

## Prop Scenarios
:::script label="Variant gallery" expected="renders default, outlined and elevated cards"
const variants = ['default', 'outlined', 'elevated'];

const grid = document.createElement('div');

const variantIcons = { default: 'star', outlined: 'info-circle', elevated: 'wand-magic-sparkles' };

for (const variant of variants) {
  const card = await slice.build('Card', {
    title: `Variant: ${variant}`,
    text: 'Reusable content container',
    headerIcon: variantIcons[variant] || 'star',
    variant
  });
  grid.appendChild(card);
}

return grid;
:::

:::script label="Status cards with badge" expected="renders status cards with colored badges"
const cards = [
  { title: 'Build Pipeline', badge: 'Healthy', icon: 'check-circle' },
  { title: 'QA Coverage', badge: 'Warning', icon: 'exclamation-circle' },
  { title: 'Deploy Queue', badge: 'Blocked', icon: 'close-circle' }
];

const grid = document.createElement('div');

for (const config of cards) {
  const card = await slice.build('Card', {
    title: config.title,
    text: 'Operational metric snapshot',
    headerIcon: config.icon,
    badge: config.badge,
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
  headerIcon: 'check-circle',
  details: 'Highlights: docs route auto-sync, tabs registration, script preview improvements.',
  variant: 'outlined'
});

return card;
:::

:::script label="Card in a disabled state" expected="disabled visual state is applied"
const card = await slice.build('Card', {
  title: 'Project Onboarding',
  text: 'Invite team members and configure permissions.',
  headerIcon: 'user',
  variant: 'elevated',
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
  customColor: { background: '#2563eb', text: '#ffffff' }
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
