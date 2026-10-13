---
title: EmptyState
route: /docs/display/empty-state
navLabel: EmptyState
section: Display
group: Basic
order: 24
description: The "nothing here yet" placeholder, with an optional icon, explanation and action.
component: EmptyStateDocumentation
generate: true
tags: [empty, placeholder, zero-state, onboarding]
---

# EmptyState

## Overview

The block you show where content *would* be, if there were any. It carries an icon, a title, a
sentence explaining what will appear there, and usually one action that fixes the emptiness.

An empty state is not decoration: it is the first thing a new user sees in that area, so the copy
should say what goes here and how to get the first one in.

## API

- `icon` (string, default `'inbox-full'`) — an `Icon` name. Empty renders no glyph.
- `iconSize` (string, default `'large'`)
- `title` (string) — the heading. Hidden when empty.
- `description` (string) — the explanation. Hidden when empty.
- `buttonLabel` (string) — label of the optional action `Button`
- `buttonRoute` (string) — where the action navigates
- `buttonOnClick` (function) — what the action does. **Wins over `buttonRoute`.**

`buttonOnClick` rather than `onClick` because the click belongs to the child `Button`, not to the
empty state itself.

## Prop Scenarios

:::script label="With an action" expected="an icon, a title, a sentence and a button that logs the click"
const note = document.createElement('p');
note.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);margin-top:10px;';
note.textContent = 'Click the button, then watch this line.';

const empty = await slice.build('EmptyState', {
  icon: 'inbox-full',
  title: 'No messages yet',
  description: 'Replies from your team will show up here.',
  buttonLabel: 'Invite a teammate',
  buttonOnClick: () => { note.textContent = 'Teammate invited.'; },
});

mount(empty);
mount(note);
:::

:::script label="Read-only" expected="just the title and sentence"
return await slice.build('EmptyState', {
  icon: 'search',
  title: 'No results',
  description: 'Try a different search term.',
});
:::

:::script label="Minimal" expected="a title with nothing else"
return await slice.build('EmptyState', { title: 'Nothing to show' });
:::

## Best Practices

:::tip
Write the description as a promise, not an apology: "Replies will show up here" beats "There are no
replies". One concrete action beats a paragraph of explanation.
:::

## Pitfalls

:::warning
Give it a real empty state only where the absence is expected. A request that failed to load looks
identical to an empty list, and "Nothing here" is the wrong message for a broken endpoint — handle
errors separately.
:::