---
title: Avatar
route: /docs/display/avatar
navLabel: Avatar
section: Display
group: Basic
order: 24
description: A person, a team or a project as a small picture. Falls back to initials on a colour of their own, then to an icon; status dot, badge, sizes, shapes, and clickable.
component: AvatarDocumentation
generate: true
tags: [avatar, user, profile, photo, initials, status]
---

# Avatar

## Overview
`Avatar` shows who something belongs to: the person next to a comment, the owner of a task, the account in the top bar. It never shows a broken picture:

1. the picture (`src`);
2. if there is none, or it fails to load, the **initials** of `name` ("Ana María López" → "AL") on a colour that comes from the name, so the same person always has the same colour;
3. without a name either, an icon (`icon`, `'user'` by default).

### When to use it
- **People in lists and feeds**: comments, messages, members, assignees.
- **The signed-in account** in a Navbar or a SideMenu.
- **Things with a face of their own**: teams, projects, companies (`shape: 'rounded'`).

### When not to use it
- **A large profile picture or a product photo.** Use an `<img>` or a [Card](/docs/layout/card) with `image`; an avatar is small and cropped.
- **Several people in a row.** Use [AvatarGroup](/docs/display/avatar-group), which overlaps them and sums up the rest.

## Core Behavior
- `src`, `name` and `alt`. Screen readers hear `alt`, or the name, or "Unknown user", plus the status: "Ana López, Online".
- While the picture loads, the initials are already there, so the place is never empty.
- `status`: `'online'`, `'away'`, `'busy'` or `'offline'`. It shows as a dot on the corner.
- `badge`: a number (3) or a word, or [Badge](/docs/display/badge) props (`{ value: 12, tone: 'accent' }`), on the top corner.
- `onClick({ avatar, event })` makes it a button, and `path` (through `slice.router`) or `href` makes it a link. Either way it can be reached with Tab and used with Enter.
- `color` replaces the colour that comes from the name.
- `initials` and `showing` (`'image'`, `'initials'` or `'icon'`) say what it shows.

## Looks
- `size`: `'xs'` (24px), `'sm'` (32), `'md'` (40, default), `'lg'` (56), `'xl'` (80), or a number of pixels.
- `shape`: `'circle'` (default) or `'rounded'`, for teams and projects.
- `texts` translates the status names and "Unknown user".

## Live Preview
:::component name="Avatar"
{
  "name": "Ana López",
  "status": "online",
  "size": "lg"
}
:::

## Examples
:::script label="Comments" expected="a comment thread: each comment has the author's avatar (a picture, initials when the picture is missing or broken), their name, the time and the text"
const PHOTO = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#0ea5e9"/><circle cx="20" cy="16" r="7" fill="#e0f2fe"/><rect x="8" y="26" width="24" height="14" rx="7" fill="#e0f2fe"/></svg>');
const comments = [
  { name: 'Ana López', photo: PHOTO, time: '9:12', text: 'I moved the release to Thursday so QA has a full day.' },
  { name: 'Luis Galué', photo: '/missing/luis.png', time: '9:20', text: 'Works for me. The migration is ready.' },
  { name: 'María Ruiz', photo: '', time: '9:31', text: 'I will write the release notes tonight.' }
];

const thread = document.createElement('div');
thread.style.cssText = 'display:grid;gap:14px;width:100%;max-width:520px';
for (const comment of comments) {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:12px;align-items:flex-start';
  const avatar = await slice.build('Avatar', { src: comment.photo, name: comment.name });
  const body = document.createElement('div');
  body.innerHTML = `<div><strong>${comment.name}</strong> <span style="opacity:.6;font-size:.85rem">${comment.time}</span></div>
    <p style="margin:4px 0 0">${comment.text}</p>`;
  row.append(avatar, body);
  thread.append(row);
}
return thread;
:::

:::script label="Account button in a top bar" expected="a top bar with the app name on the left and, on the right, the signed-in user's avatar with a green online dot and a badge of 3; clicking it opens a menu"
const toasts = await slice.build('ToastProvider', { singleton: true });
const menu = await slice.build('DropDown', {
  label: '',
  caret: false,
  variant: 'ghost',
  ariaLabel: 'Account',
  items: [
    { type: 'label', label: 'Ana López' },
    { label: 'Profile', icon: 'user', onClick: () => toasts.show('Profile') },
    { label: 'Notifications', icon: 'bell', onClick: () => toasts.show('3 new notifications') },
    'separator',
    { label: 'Sign out', icon: 'arrow-right-to-bracket', danger: true, onClick: () => toasts.show('Signed out') }
  ]
});
const avatar = await slice.build('Avatar', { name: 'Ana López', status: 'online', badge: 3, size: 'sm' });
avatar.style.pointerEvents = 'none';
menu.querySelector('button')?.prepend(avatar);

const bar = document.createElement('header');
bar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;width:100%;padding:8px 14px;border-radius:12px;background:color-mix(in srgb,var(--primary-color) 7%,transparent)';
bar.innerHTML = '<strong>Acme</strong>';
bar.append(menu);
return bar;
:::

:::script label="Sizes, shapes and statuses" expected="five sizes from xs to xl; a row of rounded team avatars; the four statuses; the icon fallback"
const row = (label) => {
  const r = document.createElement('div');
  r.style.cssText = 'display:flex;align-items:center;gap:12px;flex-wrap:wrap';
  r.innerHTML = `<span style="width:70px;font-size:.8rem;opacity:.7">${label}</span>`;
  return r;
};
const sizes = row('Sizes');
for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) sizes.append(await slice.build('Avatar', { name: 'Ana López', size }));
const teams = row('Teams');
for (const name of ['Design', 'Platform', 'Sales']) teams.append(await slice.build('Avatar', { name, shape: 'rounded' }));
const statuses = row('Status');
for (const status of ['online', 'away', 'busy', 'offline']) statuses.append(await slice.build('Avatar', { name: 'Luis Galué', status }));
const fallback = row('No name');
fallback.append(await slice.build('Avatar', {}), await slice.build('Avatar', { icon: 'users', shape: 'rounded' }));

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:14px';
box.append(sizes, teams, statuses, fallback);
return box;
:::

## Best Practices
:::tip
Always pass `name`, even with a picture. It is what screen readers hear, and what shows when the picture fails.
:::

:::tip
Use `shape: 'rounded'` for teams, companies and projects, and circles for people. The shape tells them apart at a glance.
:::

## Pitfalls
:::warning
Do not pass a status the app cannot keep up to date. A green dot that stays green after the person left is worse than no dot.
:::