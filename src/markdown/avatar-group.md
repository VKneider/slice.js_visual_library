---
title: AvatarGroup
route: /docs/display/avatar-group
navLabel: AvatarGroup
section: Display
group: Basic
order: 24.5
description: A few people as overlapping avatars and "+N" for the rest, with each name on hover and one accessible name for the group.
component: AvatarGroupDocumentation
generate: true
tags: [avatar, group, people, members, assignees]
---

# AvatarGroup

## Overview
`AvatarGroup` shows who is involved in something: the members of a project, the people assigned to a task, who has seen a message. It shows the first faces, overlapped, and sums up the rest as "+N".

### When to use it
- **Members or assignees** on a card or a list row, where there is room for a few faces.
- **"Who is here"**: people viewing a document, attending a meeting.

### When not to use it
- **When each person matters on their own**, with a name and actions: use a list of [Avatar](/docs/display/avatar)s with their names.
- **One person**: use [Avatar](/docs/display/avatar).

## Core Behavior
- `items`: one object per person, with [Avatar](/docs/display/avatar)'s props (`{ name, src, status, … }`).
- `max` (4 by default) is how many places it uses. With more people, the last place becomes "+N". With exactly `max` people, every face shows: never "+1".
- Each face shows its name in a tooltip on hover, and "+N" lists the names it stands for. They come from the app's [ToolTipProvider](/docs/services/tooltip-provider). `tooltips: false` turns them off.
- Screen readers hear the group once: "6 people: Ana López, Luis Galué, María Ruiz and 3 more". The faces are not separate tab stops.
- `onMoreClick({ items, group, event })` makes "+N" a button that gets the people it stands for, for example to open the full list.
- `size` and `shape` apply to every face. `texts` translates the group's name.

## Live Preview
:::component name="AvatarGroup"
{
  "items": [{ "name": "Ana López" }, { "name": "Luis Galué" }, { "name": "María Ruiz" }, { "name": "José Pérez" }, { "name": "Sofía Rey" }],
  "max": 4
}
:::

## Examples
:::script label="Project cards with members" expected="three project Cards, each with a group of member avatars in its footer; +N opens a Modal with everyone on that project"
const people = ['Ana López', 'Luis Galué', 'María Ruiz', 'José Pérez', 'Sofía Rey', 'Diego Fuentes', 'Carla Soto'].map((name, i) => ({ name, status: i % 3 === 0 ? 'online' : '' }));
const projects = [
  { name: 'Website redesign', team: people.slice(0, 6) },
  { name: 'Mobile app', team: people.slice(2, 5) },
  { name: 'Public API', team: people.slice(1, 3) }
];

const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;width:100%';
for (const project of projects) {
  const group = await slice.build('AvatarGroup', {
    items: project.team,
    max: 4,
    onMoreClick: async () => {
      const list = document.createElement('div');
      list.style.cssText = 'display:grid;gap:10px';
      for (const person of project.team) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:10px;align-items:center';
        row.append(await slice.build('Avatar', { ...person, size: 'sm' }), person.name);
        list.append(row);
      }
      const modal = await slice.build('Modal', { title: `${project.name} team`, size: 'sm', destroyOnClose: true, content: list, actions: [{ value: 'Close', variant: 'ghost' }] });
      document.body.append(modal);
      await modal.show();
    }
  });
  grid.append(await slice.build('Card', { title: project.name, subtitle: `${project.team.length} members`, content: group }));
}
return grid;
:::

## Best Practices
:::tip
Keep `max` small (3 to 5). The group says "these people and some more"; the full list belongs in a click on "+N".
:::

## Pitfalls
:::warning
Give every person a `name`. Without one, the face has no tooltip and the group's name cannot list them.
:::