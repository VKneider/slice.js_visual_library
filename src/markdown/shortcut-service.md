---
title: ShortcutService
route: /docs/services/shortcut-service
navLabel: ShortcutService
section: Services
group: Interaction
order: 62
description: The app's keyboard shortcuts in one place. mod+k that is ⌘ on Mac and Ctrl elsewhere, sequences like "g o", no single-key shortcuts while typing, scopes so an open dialog takes the keyboard, a warning when two shortcuts collide, cleanup with the component, and list() for a help screen.
component: ShortcutServiceDocumentation
generate: true
tags: [service, keyboard, shortcuts, hotkeys, keybindings, accessibility, command palette, scope]
---

# ShortcutService

## Overview
`ShortcutService` keeps the app's keyboard shortcuts in one place. A component says which keys do what; the service listens once for the whole app and decides which shortcut, if any, a key press belongs to.

```js
const keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'shortcuts' });

keys.add('mod+k', this, () => this.openSearch(), { label: 'Search', group: 'General' });
keys.add('g o', this, () => slice.router.navigate('/orders'), { label: 'Go to orders', group: 'Navigation' });
keys.add('shift+?', this, () => this.showShortcuts(), { label: 'Keyboard shortcuts', group: 'General' });
```

What it takes care of, so components do not each listen to `keydown`:

- **`mod`** is ⌘ on Mac and Ctrl elsewhere, and `format()` / `list()` show the keys that way (`⌘K`, `Ctrl+K`).
- **Sequences**: `g o` is G, then O within a second.
- **Typing is safe**: in an input, a textarea or an editable element, single keys and sequences do nothing; combinations with Ctrl, ⌘ or Alt (`mod+s`) still work.
- **Scopes**: while a dialog or panel is active, only its shortcuts (and the ones marked `global`) fire. When it is deactivated or destroyed, the page's shortcuts are back.
- **Collisions**: the same keys twice in the same place log a warning, and the newest wins.
- **Cleanup**: a shortcut belongs to a component and goes with it.
- **Keyboards**: `?` works whether your layout needs Shift for it or not, and Alt/Option combinations match the physical key.

### When to use it
- An app people use every day: an inbox, a dashboard, an editor, an admin panel.
- A command palette or search on `mod+k`, navigation with sequences (`g i`, `g o`).
- A help screen that lists the shortcuts that work right now.

### When not to use it
- Keys inside a widget that are part of how it works (arrows in a list, Enter in a field, Escape in a menu). The library's components already handle their own; that is the widget's keyboard model, not a shortcut.
- Replacing a visible control: every shortcut should also be reachable with the mouse or by tab.

## Build it
```js
const keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'shortcuts' });
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `sequenceTimeout` | `number` | `1000` | Ms between the keys of a sequence (`g` then `o`). |

## Writing keys
| You write | It means |
| --- | --- |
| `mod+k` | ⌘K on Mac, Ctrl+K elsewhere |
| `ctrl+k`, `meta+k`, `alt+k`, `shift+k` | that exact modifier (`cmd`, `option`, `control` also work) |
| `mod+shift+p` | several modifiers |
| `escape`, `enter`, `space`, `arrowup`, `delete`, `f2` | named keys (`esc`, `up`, `del`… also work) |
| `shift+?`, `/`, `[` | punctuation: Shift is not required to match, because keyboards differ |
| `g o` | a sequence: G, then O |
| `['mod+k', 'ctrl+p']` | any of them |

## Methods
| Method | Returns | Description |
| --- | --- | --- |
| `add(combo, component, handler, options?)` | `() => void` | Calls `handler(event, shortcut)` when the keys are pressed, while `component` lives. Returns a function that removes it. |
| `removeAll(component)` | — | Removes the component's shortcuts now (they also go when it is destroyed). |
| `activate(component)` | — | The component takes the keyboard: only its shortcuts (`scope: component`) and the `global` ones fire. Scopes stack. |
| `deactivate(component)` | — | Gives the keyboard back. A destroyed scope is dropped by itself. |
| `activeScope` | component \| `null` | The scope on top (`null`: the page). |
| `list({ all }?)` | `[{ keys, label, group, scope }]` | The shortcuts that would fire now (`all: true`: every one), with keys formatted for this platform. |
| `format(combo)` | `string` | `'mod+shift+k'` → `⌘⇧K` / `Ctrl+Shift+K`. |
| `pause()` / `resume()` | — | Stops every shortcut (while recording a new one, during a game). Calls nest. |

### Options of add
| Option | Default | Description |
| --- | --- | --- |
| `label`, `group` | `''` | What `list()` shows. |
| `scope` | `null` | A component: fires only while it is the active scope. Without it, the shortcut belongs to the page. |
| `global` | `false` | Fires whatever scope is active (search, help). |
| `within` | `null` | An element: fires only when focus is inside it (an editor's own shortcuts). |
| `inInputs` | combinations only | `true`: also while typing in a field. `false`: never while typing, not even `mod+s`. |
| `preventDefault` | `true` | The browser's own action for those keys does not run. |
| `repeat` | `false` | Holding the keys down fires once; `true` fires on every repeat (arrows). |
| `when()` | — | Fires only when it returns `true` (something is selected, a tab is open). |

## Examples

### An inbox you can drive with the keyboard
Click the example (or Tab to it), then try **J** and **K** to move, **E** to archive, **G** then **A** to see the archive, **G** then **I** to go back, **Ctrl+K** (**⌘K** on Mac) to search, and **?** for the list. While the list is open only its own shortcuts work, and typing in the search box does not trigger anything. The shortcuts are limited to the example with `within`, so the rest of this page keeps its keys.

:::script label="Keyboard inbox" expected="a search field, a list of five messages with the first one highlighted, and a hint line; J and K move the highlight, E archives the highlighted message, G then A shows the archived ones and G then I the inbox again, Ctrl+K (⌘K on Mac) puts the cursor in the search field, and ? opens a dialog listing the shortcuts with their keys; typing letters in the search field does not move the highlight"
const keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'docsShortcuts' });

let messages = [
  { id: 1, from: 'Ana López', subject: 'Quarterly numbers', archived: false },
  { id: 2, from: 'Luis Galué', subject: 'Server maintenance on Friday', archived: false },
  { id: 3, from: 'María Ruiz', subject: 'New client in Valencia', archived: false },
  { id: 4, from: 'Sofía Rey', subject: 'Design review notes', archived: false },
  { id: 5, from: 'Pedro Díaz', subject: 'Invoice #1045', archived: false }
];
let view = 'inbox';
let current = 0;

// The example's area: focusable, and the `within` of its shortcuts.
const box = document.createElement('div');
box.tabIndex = 0;
box.setAttribute('aria-label', 'Keyboard inbox');
box.style.cssText = 'display:grid;gap:10px;width:100%;max-width:560px;padding:8px;border-radius:10px;outline-offset:2px';
const area = { within: box };

const search = await slice.build('Input', { label: 'Search mail', size: 'sm', clearable: true, onChange: () => { current = 0; paint(); } });
const list = document.createElement('div');
list.setAttribute('role', 'listbox');
list.style.cssText = 'display:grid;gap:4px';
const hint = document.createElement('small');
hint.style.cssText = 'opacity:.75';

const visible = () => {
  const q = search.value.trim().toLowerCase();
  return messages.filter((m) => m.archived === (view === 'archive'))
    .filter((m) => !q || `${m.from} ${m.subject}`.toLowerCase().includes(q));
};
const paint = () => {
  const items = visible();
  current = Math.max(0, Math.min(current, items.length - 1));
  list.replaceChildren(...items.map((m, i) => {
    const row = document.createElement('div');
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', String(i === current));
    row.style.cssText = `padding:8px 12px;border-radius:8px;border:1px solid var(--primary-color-shade);${i === current ? 'background:color-mix(in srgb, var(--primary-color) 14%, transparent);border-color:var(--primary-color)' : ''}`;
    row.innerHTML = '<strong></strong> — <span></span>';
    row.querySelector('strong').textContent = m.from;
    row.querySelector('span').textContent = m.subject;
    return row;
  }));
  if (!items.length) list.textContent = view === 'archive' ? 'Nothing archived yet.' : 'No messages.';
  hint.textContent = `${view === 'archive' ? 'Archive' : 'Inbox'} · press ? for the shortcuts`;
};

// The shortcuts belong to the search field (they go when this example does)
// and work only with focus inside the example.
keys.add('j', search, () => { current += 1; paint(); }, { ...area, label: 'Next message', group: 'Inbox', repeat: true });
keys.add('k', search, () => { current -= 1; paint(); }, { ...area, label: 'Previous message', group: 'Inbox', repeat: true });
keys.add('e', search, () => {
  const message = visible()[current];
  if (message) { message.archived = view !== 'archive'; paint(); }
}, { ...area, label: 'Archive (or move back)', group: 'Inbox', when: () => visible().length > 0 });
keys.add('g a', search, () => { view = 'archive'; current = 0; paint(); }, { ...area, label: 'Go to the archive', group: 'Navigation' });
keys.add('g i', search, () => { view = 'inbox'; current = 0; paint(); }, { ...area, label: 'Go to the inbox', group: 'Navigation' });
keys.add('mod+k', search, () => search.focus(), { ...area, label: 'Search', group: 'General', global: true });
keys.add('shift+?', search, async () => {
  // The dialog takes the keyboard while it is open.
  const rows = document.createElement('div');
  rows.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:6px 16px;align-items:center';
  for (const shortcut of keys.list().filter((s) => s.label)) {
    const k = document.createElement('kbd');
    k.textContent = shortcut.keys.join(' / ');
    const label = document.createElement('span');
    label.textContent = `${shortcut.label}${shortcut.group ? ` · ${shortcut.group}` : ''}`;
    rows.append(k, label);
  }
  const dialog = await slice.build('Modal', { title: 'Keyboard shortcuts', size: 'sm', content: rows });
  document.body.append(dialog);
  keys.activate(dialog);
  await dialog.show();
  keys.deactivate(dialog);
  slice.controller.destroyComponent(dialog);
}, { ...area, label: 'Keyboard shortcuts', group: 'General' });

paint();
box.append(search, list, hint);
return box;
:::

### A dialog that takes the keyboard
Activate the dialog as its scope when it opens: the page's `j`, `k`, `e` stop working, the dialog's `mod+enter` works, and a `global` shortcut (search) still does. Deactivate it when it closes; if it is destroyed instead, the page gets the keyboard back anyway.

```js
const editor = await slice.build('Modal', { title: 'New message', content: form });
document.body.append(editor);

keys.add('mod+enter', editor, () => send(), { scope: editor, label: 'Send', inInputs: true });
keys.activate(editor);
await editor.show();
keys.deactivate(editor);
```

### Shortcuts that only exist while something is selected
```js
keys.add('delete', this, () => this.removeSelected(), {
  label: 'Delete selected',
  when: () => this.$table.selected.length > 0,
});
```

### An editor's own shortcuts
`within` limits them to focus inside the element, and `inInputs: true` lets them fire while typing there.

```js
keys.add('mod+b', this, () => this.toggleBold(), { within: this.$editor, inInputs: true, label: 'Bold', group: 'Editor' });
```

## Best practices
:::tip
- One service for the app (`singleton: true`), and every shortcut added by the component it belongs to: it goes away with it.
- Give each shortcut a `label`, and offer `?` with `list()`: shortcuts nobody can discover are not used.
- Prefer `mod+…` for actions that also make sense while typing (save, search), and single keys or sequences for moving around.
:::

## Pitfalls
:::warning
Do not take keys the browser or the screen reader relies on (Tab, Ctrl+L, Ctrl+W, Ctrl+T, F6, Alt+arrows for history). `preventDefault` would take them away from people who depend on them.
:::

:::warning
A single-letter shortcut fires anywhere on the page that is not a text field. In pages with many custom widgets, give it a `scope` or a `within`, or use a sequence.
:::