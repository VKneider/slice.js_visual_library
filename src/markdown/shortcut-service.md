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

keys.add('mod+k', this, () => this.openSearch(), { label: 'Search', group: 'General', override: true });
keys.add('g o', this, () => slice.router.navigate('/orders'), { label: 'Go to orders', group: 'Navigation' });
keys.add('shift+?', this, () => this.showShortcuts(), { label: 'Keyboard shortcuts', group: 'General' });
```

What it takes care of, so components do not each listen to `keydown`:

- **`mod`** is ⌘ on Mac and Ctrl elsewhere, and `format()` / `list()` show the keys that way (`⌘K`, `Ctrl+K`).
- **Sequences**: `g o` is G, then O within a second.
- **Typing is safe**: in an input, a textarea or an editable element, single keys and sequences do nothing, and neither do the keys that edit text (`mod+z`, `mod+backspace`, `mod+arrows`…); other combinations with Ctrl, ⌘ or Alt (`mod+k`) still work.
- **The browser's keys**: outside production, a shortcut on keys the browser uses (`mod+f`, `mod+e`, `mod+s`, `mod+p`…) logs a warning saying what people would lose, and one on keys the browser never gives to a page (`mod+t`, `mod+w`, `mod+n`) says it will never run. `override: true` when taking them is meant.
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
| `inInputs` | combinations only | `true`: also while typing in a field. `false`: never while typing. By default, combinations with Ctrl, ⌘ or Alt fire while typing, except the keys that edit text (`mod+z`, `mod+backspace`, `mod+arrows`…). |
| `override` | `false` | `true`: taking keys the browser uses is meant (a palette on `mod+k`, bold on `mod+b` in an editor), so no warning. |
| `preventDefault` | `true` | The browser's own action for those keys does not run. |
| `repeat` | `false` | Holding the keys down fires once; `true` fires on every repeat (arrows). |
| `when()` | — | Fires only when it returns `true` (something is selected, a tab is open). |

## Examples

### A task list you can drive from the keyboard
The keys follow what Gmail, GitHub or Linear do. **Ctrl** (**⌘** on Mac) only where people expect an app to take it: **Ctrl+K** for the command palette and **Ctrl+Enter** to mark a task done. Everything else is a plain key or a sequence, limited to the example with `within`: it never fights with the browser, and it does nothing while you type in the field. Click the example (or Tab to it) and try:

- **Ctrl+K**: a command palette with every action and its keys; type to filter, arrows to choose, Enter to run.
- **?**: the list of shortcuts.
- **J / K**: next and previous task (hold to keep moving). **Ctrl+Enter**: done or not done.
- **N**: write a new task, Enter to add it, **Esc** to leave the field. **E**: rename the selected task. **Delete**: delete it. **U**: undo (several times).
- **] / [**: next and previous filter. **G** then **A**, **T** or **D**: All, To do, Done.

While the palette or the list is open, the task shortcuts stop: the dialog is the active scope, so **Delete** cannot remove a task behind it.

:::script label="Keyboard task list" expected="a 'New task' field, a filter badge, a list of six tasks with the first highlighted, and a status line; J and K move the highlight, Ctrl+Enter marks the task done or not done, N puts the cursor in the field and Enter adds the task, E puts the selected title in the field to rename it, Delete removes it, U undoes, ] and [ change the filter and G then A, T or D jump to one, Ctrl+K opens a command palette that filters as you type and runs the chosen command with Enter, and ? opens the list of shortcuts with their keys; letters typed in the field only type"
const keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'docsShortcuts' });

// The example's area: focusable, and the `within` of its shortcuts.
const box = document.createElement('div');
box.tabIndex = 0;
box.setAttribute('aria-label', 'Task list with keyboard shortcuts');
box.style.cssText = 'display:grid;gap:10px;width:100%;max-width:600px;padding:8px;border-radius:10px;outline-offset:2px';

// ── The data, with an undo history ──
let tasks = [
  { id: 1, title: 'Prepare the quarterly report', tag: 'Work', done: false },
  { id: 2, title: 'Review the pull request for the Table', tag: 'Work', done: false },
  { id: 3, title: 'Book the meeting room for Friday', tag: 'Office', done: true },
  { id: 4, title: 'Buy paper for the shop', tag: 'Shop', done: false },
  { id: 5, title: 'Call the client in Valencia', tag: 'Sales', done: false },
  { id: 6, title: 'Update the team on the release', tag: 'Work', done: true }
];
let nextId = 7;
let current = 0;
let filter = 'all';
let renaming = null;            // the id of the task being renamed
const FILTERS = [['all', 'All'], ['todo', 'To do'], ['done', 'Done']];
const history = [];
const remember = () => { history.push(JSON.stringify(tasks)); if (history.length > 30) history.shift(); };

const visible = () => tasks.filter((t) => filter === 'all' || (filter === 'done') === t.done);
const selected = () => visible()[current] || null;

// ── The interface ──
const field = await slice.build('Input', {
  label: 'New task', size: 'sm',
  onEnter: (text, event) => {
    if (event.ctrlKey || event.metaKey) return;          // Ctrl+Enter is a shortcut, not "add"
    const title = text.trim();
    if (!title) return;
    remember();
    if (renaming !== null) {
      tasks = tasks.map((t) => (t.id === renaming ? { ...t, title } : t));
      say('Renamed · U to undo');
      renaming = null;
      field.label = 'New task';
    } else {
      tasks = [{ id: nextId++, title, tag: 'Inbox', done: false }, ...tasks];
      filter = filter === 'done' ? 'all' : filter;
      current = 0;
      say('Added · U to undo');
    }
    field.value = '';
    paint();
    box.focus();                                          // back to the list: the keys work again
  }
});
const filterBadge = await slice.build('Badge', { label: 'All', tone: 'accent' });
const list = document.createElement('div');
list.setAttribute('role', 'listbox');
list.setAttribute('aria-label', 'Tasks');
list.style.cssText = 'display:grid;gap:4px';
const status = document.createElement('small');
status.style.cssText = 'opacity:.75;min-height:1.4em';
const say = (text) => { status.textContent = text; };

const paint = () => {
  const items = visible();
  current = Math.max(0, Math.min(current, items.length - 1));
  filterBadge.label = FILTERS.find(([value]) => value === filter)[1];
  list.replaceChildren(...items.map((task, i) => {
    const row = document.createElement('div');
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', String(i === current));
    const on = i === current;
    row.style.cssText = `display:flex;gap:10px;align-items:center;padding:8px 12px;border-radius:8px;border:1px solid ${on ? 'var(--primary-color)' : 'var(--primary-color-shade)'};${on ? 'background:color-mix(in srgb, var(--primary-color) 14%, transparent);' : ''}`;
    const mark = document.createElement('span');
    mark.textContent = task.done ? '✓' : '○';
    mark.style.cssText = `width:1.2em;text-align:center;${task.done ? 'color:var(--success-color)' : 'opacity:.6'}`;
    const title = document.createElement('span');
    title.textContent = task.title;
    title.style.cssText = `flex:1;${task.done ? 'text-decoration:line-through;opacity:.65' : ''}`;
    const tag = document.createElement('small');
    tag.textContent = task.tag;
    tag.style.opacity = '.7';
    row.append(mark, title, tag);
    return row;
  }));
  if (!items.length) list.textContent = filter === 'done' ? 'Nothing done yet.' : 'Nothing to do.';
};

// ── A dialog that takes the keyboard while it is open ──
const openDialog = async (title, content, onKeys) => {
  const dialog = await slice.build('Modal', { title, size: 'sm', content });
  document.body.append(dialog);
  keys.activate(dialog);                 // the task shortcuts wait
  const shown = dialog.show();
  onKeys?.(dialog);
  const { returnValue } = await shown;
  keys.deactivate(dialog);
  slice.controller.destroyComponent(dialog);
  return returnValue;
};

const openHelp = () => {
  const rows = document.createElement('div');
  rows.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:6px 16px;align-items:center';
  let group = '';
  for (const shortcut of keys.list().filter((s) => s.label)) {
    if (shortcut.group !== group) {
      group = shortcut.group;
      const heading = document.createElement('strong');
      heading.textContent = group;
      heading.style.cssText = 'grid-column:1 / -1;margin-top:6px';
      rows.append(heading);
    }
    const k = document.createElement('kbd');
    k.textContent = shortcut.keys.join(' / ');
    const label = document.createElement('span');
    label.textContent = shortcut.label;
    rows.append(k, label);
  }
  return openDialog('Keyboard shortcuts', rows);
};

// The palette lists the same commands, runs the chosen one after it closes.
const openPalette = async () => {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;gap:8px';
  const results = document.createElement('div');
  results.setAttribute('role', 'listbox');
  results.style.cssText = 'display:grid;gap:2px;max-height:300px;overflow:auto';
  let matches = [];
  let pick = 0;
  const show = (query) => {
    const q = query.trim().toLowerCase();
    matches = commands.filter((c) => c.combo !== 'mod+k' && (!q || `${c.label} ${c.group}`.toLowerCase().includes(q)));
    pick = Math.min(pick, Math.max(0, matches.length - 1));
    results.replaceChildren(...matches.map((c, i) => {
      const row = document.createElement('div');
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(i === pick));
      row.style.cssText = `display:flex;justify-content:space-between;gap:12px;padding:6px 10px;border-radius:6px;${i === pick ? 'background:color-mix(in srgb, var(--primary-color) 14%, transparent)' : ''}`;
      const name = document.createElement('span');
      name.textContent = c.label;
      const k = document.createElement('kbd');
      k.textContent = keys.format(c.combo);
      row.append(name, k);
      return row;
    }));
    if (!matches.length) results.textContent = 'No command matches.';
  };
  const search = await slice.build('Input', { label: 'Type a command', size: 'sm', onChange: (text) => { pick = 0; show(text); } });
  wrap.append(search, results);
  show('');
  let chosen = null;
  const answer = await openDialog('Commands', wrap, (dialog) => {
    search.focus();
    // Arrows and Enter are how this list works (its own keyboard model), not shortcuts.
    search.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        pick = (pick + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % Math.max(1, matches.length);
        show(search.value);
      } else if (event.key === 'Enter' && matches[pick]) {
        chosen = matches[pick];
        dialog.close('run');
      }
    });
  });
  if (answer === 'run' && chosen) {
    box.focus();
    chosen.run();
  }
};

// ── The commands: one list for the shortcuts, the palette and the help ──
const move = (step) => { current = Math.max(0, Math.min(visible().length - 1, current + step)); paint(); };
const hasTask = () => selected() !== null;
const setFilter = (value) => { filter = value; current = 0; paint(); };
const stepFilter = (step) => setFilter(FILTERS[(FILTERS.findIndex(([v]) => v === filter) + step + FILTERS.length) % FILTERS.length][0]);
const inField = () => document.activeElement?.closest?.('slice-input') === field;
const commands = [
  // Ctrl only where an app is expected to take it (override: the browser uses Ctrl+K too).
  { combo: 'mod+k', label: 'Command palette', group: 'General', override: true, typing: true, run: openPalette },
  { combo: 'shift+?', label: 'Keyboard shortcuts', group: 'General', run: openHelp },
  { combo: 'j', label: 'Next task', group: 'Move', repeat: true, run: () => move(1) },
  { combo: 'k', label: 'Previous task', group: 'Move', repeat: true, run: () => move(-1) },
  { combo: 'mod+enter', label: 'Done / not done', group: 'Tasks', when: hasTask, typing: false, run: () => {
    const task = selected();
    remember();
    tasks = tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t));
    say(`${task.done ? 'Back to do' : 'Done'} · U to undo`);
    paint();
  } },
  { combo: 'n', label: 'New task', group: 'Tasks', run: () => { renaming = null; field.label = 'New task'; field.focus(); } },
  { combo: 'e', label: 'Rename task', group: 'Tasks', when: hasTask, run: () => {
    const task = selected();
    renaming = task.id;
    field.label = 'Rename task (Enter to save, Esc to cancel)';
    field.value = task.title;
    field.focus();
  } },
  { combo: 'escape', label: 'Leave the field', group: 'Tasks', when: inField, typing: true, run: () => {
    renaming = null;
    field.label = 'New task';
    field.value = '';
    box.focus();
  } },
  { combo: 'delete', label: 'Delete task', group: 'Tasks', when: hasTask, run: () => {
    const task = selected();
    remember();
    tasks = tasks.filter((t) => t.id !== task.id);
    say(`Deleted "${task.title}" · U to undo`);
    paint();
  } },
  { combo: 'u', label: 'Undo', group: 'Tasks', run: () => {
    const before = history.pop();
    if (!before) { say('Nothing to undo.'); return; }
    tasks = JSON.parse(before);
    say('Undone.');
    paint();
  } },
  { combo: ']', label: 'Next filter', group: 'View', run: () => stepFilter(1) },
  { combo: '[', label: 'Previous filter', group: 'View', run: () => stepFilter(-1) },
  { combo: 'g a', label: 'Show all', group: 'View', run: () => setFilter('all') },
  { combo: 'g t', label: 'Show to do', group: 'View', run: () => setFilter('todo') },
  { combo: 'g d', label: 'Show done', group: 'View', run: () => setFilter('done') }
];

// Registered on the field (they go when this example does), only with focus inside it.
for (const command of commands) {
  keys.add(command.combo, field, () => command.run(), {
    within: box, label: command.label, group: command.group, repeat: command.repeat, when: command.when,
    override: command.override,
    // In the field: plain keys only type; Ctrl+K and Esc still work, Ctrl+Enter does not.
    inInputs: command.typing
  });
}

const head = document.createElement('div');
head.style.cssText = 'display:flex;gap:10px;align-items:end';
field.style.flex = '1';
head.append(field, filterBadge);
paint();
say(`${keys.format('mod+k')} for every command · ? for the shortcuts`);
box.append(head, list, status);
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
`within` limits them to focus inside the element, `inInputs: true` lets them fire while typing there, and `override: true` says that taking the browser's Ctrl+B (bookmarks in Firefox) is meant inside an editor.

```js
keys.add('mod+b', this, () => this.toggleBold(), { within: this.$editor, inInputs: true, override: true, label: 'Bold', group: 'Editor' });
```

## Best practices
:::tip
- One service for the app (`singleton: true`), and every shortcut added by the component it belongs to: it goes away with it.
- Give each shortcut a `label`, and offer `?` with `list()`: shortcuts nobody can discover are not used.
- Use Ctrl/⌘ only where people expect an app to take it (`mod+k` for a palette, `mod+enter` to send); almost every other Ctrl+letter is the browser's. Plain keys and sequences (`j`, `e`, `g i`), with a `within` or a `scope`, are what Gmail, GitHub or Linear use for the rest.
- Read the warnings: when the service says a key is the browser's, choose another, or pass `override: true` only when taking it is the point.
:::

## Pitfalls
:::warning
Do not take keys the browser or the screen reader relies on (Tab, Ctrl+L, Ctrl+F, F6, Alt+arrows for history). `preventDefault` would take them away from people who depend on them. Some (Ctrl+T, Ctrl+W, Ctrl+N) the browser never gives to a page at all; the service warns about both while you develop.
:::

:::warning
A single-letter shortcut fires anywhere on the page that is not a text field. In pages with many custom widgets, give it a `scope` or a `within`, or use a sequence.
:::