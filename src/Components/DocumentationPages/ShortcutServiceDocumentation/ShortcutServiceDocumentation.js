export default class ShortcutServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Keyboard task list","expected":"a 'New task' field, a filter badge, a list of six tasks with the first highlighted, and a status line; J and K move the highlight, Ctrl+Enter marks the task done or not done, N puts the cursor in the field and Enter adds the task, E puts the selected title in the field to rename it, Delete removes it, U undoes, ] and [ change the filter and G then A, T or D jump to one, Ctrl+K opens a command palette that filters as you type and runs the chosen command with Enter, and ? opens the list of shortcuts with their keys; letters typed in the field only type","kind":"script","content":"const keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'docsShortcuts' });\n\n// The example's area: focusable, and the `within` of its shortcuts.\nconst box = document.createElement('div');\nbox.tabIndex = 0;\nbox.setAttribute('aria-label', 'Task list with keyboard shortcuts');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:600px;padding:8px;border-radius:10px;outline-offset:2px';\n\n// ── The data, with an undo history ──\nlet tasks = [\n  { id: 1, title: 'Prepare the quarterly report', tag: 'Work', done: false },\n  { id: 2, title: 'Review the pull request for the Table', tag: 'Work', done: false },\n  { id: 3, title: 'Book the meeting room for Friday', tag: 'Office', done: true },\n  { id: 4, title: 'Buy paper for the shop', tag: 'Shop', done: false },\n  { id: 5, title: 'Call the client in Valencia', tag: 'Sales', done: false },\n  { id: 6, title: 'Update the team on the release', tag: 'Work', done: true }\n];\nlet nextId = 7;\nlet current = 0;\nlet filter = 'all';\nlet renaming = null;            // the id of the task being renamed\nconst FILTERS = [['all', 'All'], ['todo', 'To do'], ['done', 'Done']];\nconst history = [];\nconst remember = () => { history.push(JSON.stringify(tasks)); if (history.length > 30) history.shift(); };\n\nconst visible = () => tasks.filter((t) => filter === 'all' || (filter === 'done') === t.done);\nconst selected = () => visible()[current] || null;\n\n// ── The interface ──\nconst field = await slice.build('Input', {\n  label: 'New task', size: 'sm',\n  onEnter: (text, event) => {\n    if (event.ctrlKey || event.metaKey) return;          // Ctrl+Enter is a shortcut, not \"add\"\n    const title = text.trim();\n    if (!title) return;\n    remember();\n    if (renaming !== null) {\n      tasks = tasks.map((t) => (t.id === renaming ? { ...t, title } : t));\n      say('Renamed · U to undo');\n      renaming = null;\n      field.label = 'New task';\n    } else {\n      tasks = [{ id: nextId++, title, tag: 'Inbox', done: false }, ...tasks];\n      filter = filter === 'done' ? 'all' : filter;\n      current = 0;\n      say('Added · U to undo');\n    }\n    field.value = '';\n    paint();\n    box.focus();                                          // back to the list: the keys work again\n  }\n});\nconst filterBadge = await slice.build('Badge', { label: 'All', tone: 'accent' });\nconst list = document.createElement('div');\nlist.setAttribute('role', 'listbox');\nlist.setAttribute('aria-label', 'Tasks');\nlist.style.cssText = 'display:grid;gap:4px';\nconst status = document.createElement('small');\nstatus.style.cssText = 'opacity:.75;min-height:1.4em';\nconst say = (text) => { status.textContent = text; };\n\nconst paint = () => {\n  const items = visible();\n  current = Math.max(0, Math.min(current, items.length - 1));\n  filterBadge.label = FILTERS.find(([value]) => value === filter)[1];\n  list.replaceChildren(...items.map((task, i) => {\n    const row = document.createElement('div');\n    row.setAttribute('role', 'option');\n    row.setAttribute('aria-selected', String(i === current));\n    const on = i === current;\n    row.style.cssText = `display:flex;gap:10px;align-items:center;padding:8px 12px;border-radius:8px;border:1px solid ${on ? 'var(--primary-color)' : 'var(--primary-color-shade)'};${on ? 'background:color-mix(in srgb, var(--primary-color) 14%, transparent);' : ''}`;\n    const mark = document.createElement('span');\n    mark.textContent = task.done ? '✓' : '○';\n    mark.style.cssText = `width:1.2em;text-align:center;${task.done ? 'color:var(--success-color)' : 'opacity:.6'}`;\n    const title = document.createElement('span');\n    title.textContent = task.title;\n    title.style.cssText = `flex:1;${task.done ? 'text-decoration:line-through;opacity:.65' : ''}`;\n    const tag = document.createElement('small');\n    tag.textContent = task.tag;\n    tag.style.opacity = '.7';\n    row.append(mark, title, tag);\n    return row;\n  }));\n  if (!items.length) list.textContent = filter === 'done' ? 'Nothing done yet.' : 'Nothing to do.';\n};\n\n// ── A dialog that takes the keyboard while it is open ──\nconst openDialog = async (title, content, onKeys) => {\n  const dialog = await slice.build('Modal', { title, size: 'sm', content });\n  document.body.append(dialog);\n  keys.activate(dialog);                 // the task shortcuts wait\n  const shown = dialog.show();\n  onKeys?.(dialog);\n  const { returnValue } = await shown;\n  keys.deactivate(dialog);\n  slice.controller.destroyComponent(dialog);\n  return returnValue;\n};\n\nconst openHelp = () => {\n  const rows = document.createElement('div');\n  rows.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:6px 16px;align-items:center';\n  let group = '';\n  for (const shortcut of keys.list().filter((s) => s.label)) {\n    if (shortcut.group !== group) {\n      group = shortcut.group;\n      const heading = document.createElement('strong');\n      heading.textContent = group;\n      heading.style.cssText = 'grid-column:1 / -1;margin-top:6px';\n      rows.append(heading);\n    }\n    const k = document.createElement('kbd');\n    k.textContent = shortcut.keys.join(' / ');\n    const label = document.createElement('span');\n    label.textContent = shortcut.label;\n    rows.append(k, label);\n  }\n  return openDialog('Keyboard shortcuts', rows);\n};\n\n// The palette lists the same commands, runs the chosen one after it closes.\nconst openPalette = async () => {\n  const wrap = document.createElement('div');\n  wrap.style.cssText = 'display:grid;gap:8px';\n  const results = document.createElement('div');\n  results.setAttribute('role', 'listbox');\n  results.style.cssText = 'display:grid;gap:2px;max-height:300px;overflow:auto';\n  let matches = [];\n  let pick = 0;\n  const show = (query) => {\n    const q = query.trim().toLowerCase();\n    matches = commands.filter((c) => c.combo !== 'mod+k' && (!q || `${c.label} ${c.group}`.toLowerCase().includes(q)));\n    pick = Math.min(pick, Math.max(0, matches.length - 1));\n    results.replaceChildren(...matches.map((c, i) => {\n      const row = document.createElement('div');\n      row.setAttribute('role', 'option');\n      row.setAttribute('aria-selected', String(i === pick));\n      row.style.cssText = `display:flex;justify-content:space-between;gap:12px;padding:6px 10px;border-radius:6px;${i === pick ? 'background:color-mix(in srgb, var(--primary-color) 14%, transparent)' : ''}`;\n      const name = document.createElement('span');\n      name.textContent = c.label;\n      const k = document.createElement('kbd');\n      k.textContent = keys.format(c.combo);\n      row.append(name, k);\n      return row;\n    }));\n    if (!matches.length) results.textContent = 'No command matches.';\n  };\n  const search = await slice.build('Input', { label: 'Type a command', size: 'sm', onChange: (text) => { pick = 0; show(text); } });\n  wrap.append(search, results);\n  show('');\n  let chosen = null;\n  const answer = await openDialog('Commands', wrap, (dialog) => {\n    search.focus();\n    // Arrows and Enter are how this list works (its own keyboard model), not shortcuts.\n    search.addEventListener('keydown', (event) => {\n      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {\n        event.preventDefault();\n        pick = (pick + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % Math.max(1, matches.length);\n        show(search.value);\n      } else if (event.key === 'Enter' && matches[pick]) {\n        chosen = matches[pick];\n        dialog.close('run');\n      }\n    });\n  });\n  if (answer === 'run' && chosen) {\n    box.focus();\n    chosen.run();\n  }\n};\n\n// ── The commands: one list for the shortcuts, the palette and the help ──\nconst move = (step) => { current = Math.max(0, Math.min(visible().length - 1, current + step)); paint(); };\nconst hasTask = () => selected() !== null;\nconst setFilter = (value) => { filter = value; current = 0; paint(); };\nconst stepFilter = (step) => setFilter(FILTERS[(FILTERS.findIndex(([v]) => v === filter) + step + FILTERS.length) % FILTERS.length][0]);\nconst inField = () => document.activeElement?.closest?.('slice-input') === field;\nconst commands = [\n  // Ctrl only where an app is expected to take it (override: the browser uses Ctrl+K too).\n  { combo: 'mod+k', label: 'Command palette', group: 'General', override: true, typing: true, run: openPalette },\n  { combo: 'shift+?', label: 'Keyboard shortcuts', group: 'General', run: openHelp },\n  { combo: 'j', label: 'Next task', group: 'Move', repeat: true, run: () => move(1) },\n  { combo: 'k', label: 'Previous task', group: 'Move', repeat: true, run: () => move(-1) },\n  { combo: 'mod+enter', label: 'Done / not done', group: 'Tasks', when: hasTask, typing: false, run: () => {\n    const task = selected();\n    remember();\n    tasks = tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t));\n    say(`${task.done ? 'Back to do' : 'Done'} · U to undo`);\n    paint();\n  } },\n  { combo: 'n', label: 'New task', group: 'Tasks', run: () => { renaming = null; field.label = 'New task'; field.focus(); } },\n  { combo: 'e', label: 'Rename task', group: 'Tasks', when: hasTask, run: () => {\n    const task = selected();\n    renaming = task.id;\n    field.label = 'Rename task (Enter to save, Esc to cancel)';\n    field.value = task.title;\n    field.focus();\n  } },\n  { combo: 'escape', label: 'Leave the field', group: 'Tasks', when: inField, typing: true, run: () => {\n    renaming = null;\n    field.label = 'New task';\n    field.value = '';\n    box.focus();\n  } },\n  { combo: 'delete', label: 'Delete task', group: 'Tasks', when: hasTask, run: () => {\n    const task = selected();\n    remember();\n    tasks = tasks.filter((t) => t.id !== task.id);\n    say(`Deleted \"${task.title}\" · U to undo`);\n    paint();\n  } },\n  { combo: 'u', label: 'Undo', group: 'Tasks', run: () => {\n    const before = history.pop();\n    if (!before) { say('Nothing to undo.'); return; }\n    tasks = JSON.parse(before);\n    say('Undone.');\n    paint();\n  } },\n  { combo: ']', label: 'Next filter', group: 'View', run: () => stepFilter(1) },\n  { combo: '[', label: 'Previous filter', group: 'View', run: () => stepFilter(-1) },\n  { combo: 'g a', label: 'Show all', group: 'View', run: () => setFilter('all') },\n  { combo: 'g t', label: 'Show to do', group: 'View', run: () => setFilter('todo') },\n  { combo: 'g d', label: 'Show done', group: 'View', run: () => setFilter('done') }\n];\n\n// Registered on the field (they go when this example does), only with focus inside it.\nfor (const command of commands) {\n  keys.add(command.combo, field, () => command.run(), {\n    within: box, label: command.label, group: command.group, repeat: command.repeat, when: command.when,\n    override: command.override,\n    // In the field: plain keys only type; Ctrl+K and Esc still work, Ctrl+Enter does not.\n    inInputs: command.typing\n  });\n}\n\nconst head = document.createElement('div');\nhead.style.cssText = 'display:flex;gap:10px;align-items:end';\nfield.style.flex = '1';\nhead.append(field, filterBadge);\npaint();\nsay(`${keys.format('mod+k')} for every command · ? for the shortcuts`);\nbox.append(head, list, status);\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "shortcut-service.md";
    this.markdownContent = "---\ntitle: ShortcutService\nroute: /docs/services/shortcut-service\nnavLabel: ShortcutService\nsection: Services\ngroup: Interaction\norder: 62\ndescription: The app's keyboard shortcuts in one place. mod+k that is ⌘ on Mac and Ctrl elsewhere, sequences like \"g o\", no single-key shortcuts while typing, scopes so an open dialog takes the keyboard, a warning when two shortcuts collide, cleanup with the component, and list() for a help screen.\ncomponent: ShortcutServiceDocumentation\ngenerate: true\ntags: [service, keyboard, shortcuts, hotkeys, keybindings, accessibility, command palette, scope]\n---\n\n# ShortcutService\n\n## Overview\n`ShortcutService` keeps the app's keyboard shortcuts in one place. A component says which keys do what; the service listens once for the whole app and decides which shortcut, if any, a key press belongs to.\n\n```js\nconst keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'shortcuts' });\n\nkeys.add('mod+k', this, () => this.openSearch(), { label: 'Search', group: 'General', override: true });\nkeys.add('g o', this, () => slice.router.navigate('/orders'), { label: 'Go to orders', group: 'Navigation' });\nkeys.add('shift+?', this, () => this.showShortcuts(), { label: 'Keyboard shortcuts', group: 'General' });\n```\n\nWhat it takes care of, so components do not each listen to `keydown`:\n\n- **`mod`** is ⌘ on Mac and Ctrl elsewhere, and `format()` / `list()` show the keys that way (`⌘K`, `Ctrl+K`).\n- **Sequences**: `g o` is G, then O within a second.\n- **Typing is safe**: in an input, a textarea or an editable element, single keys and sequences do nothing, and neither do the keys that edit text (`mod+z`, `mod+backspace`, `mod+arrows`…); other combinations with Ctrl, ⌘ or Alt (`mod+k`) still work.\n- **The browser's keys**: outside production, a shortcut on keys the browser uses (`mod+f`, `mod+e`, `mod+s`, `mod+p`…) logs a warning saying what people would lose, and one on keys the browser never gives to a page (`mod+t`, `mod+w`, `mod+n`) says it will never run. `override: true` when taking them is meant.\n- **Scopes**: while a dialog or panel is active, only its shortcuts (and the ones marked `global`) fire. When it is deactivated or destroyed, the page's shortcuts are back.\n- **Collisions**: the same keys twice in the same place log a warning, and the newest wins.\n- **Cleanup**: a shortcut belongs to a component and goes with it.\n- **Keyboards**: `?` works whether your layout needs Shift for it or not, and Alt/Option combinations match the physical key.\n\n### When to use it\n- An app people use every day: an inbox, a dashboard, an editor, an admin panel.\n- A command palette or search on `mod+k`, navigation with sequences (`g i`, `g o`).\n- A help screen that lists the shortcuts that work right now.\n\n### When not to use it\n- Keys inside a widget that are part of how it works (arrows in a list, Enter in a field, Escape in a menu). The library's components already handle their own; that is the widget's keyboard model, not a shortcut.\n- Replacing a visible control: every shortcut should also be reachable with the mouse or by tab.\n\n## Build it\n```js\nconst keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'shortcuts' });\n```\n\n| Prop | Type | Default | Description |\n| --- | --- | --- | --- |\n| `sequenceTimeout` | `number` | `1000` | Ms between the keys of a sequence (`g` then `o`). |\n\n## Writing keys\n| You write | It means |\n| --- | --- |\n| `mod+k` | ⌘K on Mac, Ctrl+K elsewhere |\n| `ctrl+k`, `meta+k`, `alt+k`, `shift+k` | that exact modifier (`cmd`, `option`, `control` also work) |\n| `mod+shift+p` | several modifiers |\n| `escape`, `enter`, `space`, `arrowup`, `delete`, `f2` | named keys (`esc`, `up`, `del`… also work) |\n| `shift+?`, `/`, `[` | punctuation: Shift is not required to match, because keyboards differ |\n| `g o` | a sequence: G, then O |\n| `['mod+k', 'ctrl+p']` | any of them |\n\n## Methods\n| Method | Returns | Description |\n| --- | --- | --- |\n| `add(combo, component, handler, options?)` | `() => void` | Calls `handler(event, shortcut)` when the keys are pressed, while `component` lives. Returns a function that removes it. |\n| `removeAll(component)` | — | Removes the component's shortcuts now (they also go when it is destroyed). |\n| `activate(component)` | — | The component takes the keyboard: only its shortcuts (`scope: component`) and the `global` ones fire. Scopes stack. |\n| `deactivate(component)` | — | Gives the keyboard back. A destroyed scope is dropped by itself. |\n| `activeScope` | component \\| `null` | The scope on top (`null`: the page). |\n| `list({ all }?)` | `[{ keys, label, group, scope }]` | The shortcuts that would fire now (`all: true`: every one), with keys formatted for this platform. |\n| `format(combo)` | `string` | `'mod+shift+k'` → `⌘⇧K` / `Ctrl+Shift+K`. |\n| `pause()` / `resume()` | — | Stops every shortcut (while recording a new one, during a game). Calls nest. |\n\n### Options of add\n| Option | Default | Description |\n| --- | --- | --- |\n| `label`, `group` | `''` | What `list()` shows. |\n| `scope` | `null` | A component: fires only while it is the active scope. Without it, the shortcut belongs to the page. |\n| `global` | `false` | Fires whatever scope is active (search, help). |\n| `within` | `null` | An element: fires only when focus is inside it (an editor's own shortcuts). |\n| `inInputs` | combinations only | `true`: also while typing in a field. `false`: never while typing. By default, combinations with Ctrl, ⌘ or Alt fire while typing, except the keys that edit text (`mod+z`, `mod+backspace`, `mod+arrows`…). |\n| `override` | `false` | `true`: taking keys the browser uses is meant (a palette on `mod+k`, bold on `mod+b` in an editor), so no warning. |\n| `preventDefault` | `true` | The browser's own action for those keys does not run. |\n| `repeat` | `false` | Holding the keys down fires once; `true` fires on every repeat (arrows). |\n| `when()` | — | Fires only when it returns `true` (something is selected, a tab is open). |\n\n## Examples\n\n### A task list you can drive from the keyboard\nThe keys follow what Gmail, GitHub or Linear do. **Ctrl** (**⌘** on Mac) only where people expect an app to take it: **Ctrl+K** for the command palette and **Ctrl+Enter** to mark a task done. Everything else is a plain key or a sequence, limited to the example with `within`: it never fights with the browser, and it does nothing while you type in the field. Click the example (or Tab to it) and try:\n\n- **Ctrl+K**: a command palette with every action and its keys; type to filter, arrows to choose, Enter to run.\n- **?**: the list of shortcuts.\n- **J / K**: next and previous task (hold to keep moving). **Ctrl+Enter**: done or not done.\n- **N**: write a new task, Enter to add it, **Esc** to leave the field. **E**: rename the selected task. **Delete**: delete it. **U**: undo (several times).\n- **] / [**: next and previous filter. **G** then **A**, **T** or **D**: All, To do, Done.\n\nWhile the palette or the list is open, the task shortcuts stop: the dialog is the active scope, so **Delete** cannot remove a task behind it.\n\n:::script label=\"Keyboard task list\" expected=\"a 'New task' field, a filter badge, a list of six tasks with the first highlighted, and a status line; J and K move the highlight, Ctrl+Enter marks the task done or not done, N puts the cursor in the field and Enter adds the task, E puts the selected title in the field to rename it, Delete removes it, U undoes, ] and [ change the filter and G then A, T or D jump to one, Ctrl+K opens a command palette that filters as you type and runs the chosen command with Enter, and ? opens the list of shortcuts with their keys; letters typed in the field only type\"\nconst keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'docsShortcuts' });\n\n// The example's area: focusable, and the `within` of its shortcuts.\nconst box = document.createElement('div');\nbox.tabIndex = 0;\nbox.setAttribute('aria-label', 'Task list with keyboard shortcuts');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:600px;padding:8px;border-radius:10px;outline-offset:2px';\n\n// ── The data, with an undo history ──\nlet tasks = [\n  { id: 1, title: 'Prepare the quarterly report', tag: 'Work', done: false },\n  { id: 2, title: 'Review the pull request for the Table', tag: 'Work', done: false },\n  { id: 3, title: 'Book the meeting room for Friday', tag: 'Office', done: true },\n  { id: 4, title: 'Buy paper for the shop', tag: 'Shop', done: false },\n  { id: 5, title: 'Call the client in Valencia', tag: 'Sales', done: false },\n  { id: 6, title: 'Update the team on the release', tag: 'Work', done: true }\n];\nlet nextId = 7;\nlet current = 0;\nlet filter = 'all';\nlet renaming = null;            // the id of the task being renamed\nconst FILTERS = [['all', 'All'], ['todo', 'To do'], ['done', 'Done']];\nconst history = [];\nconst remember = () => { history.push(JSON.stringify(tasks)); if (history.length > 30) history.shift(); };\n\nconst visible = () => tasks.filter((t) => filter === 'all' || (filter === 'done') === t.done);\nconst selected = () => visible()[current] || null;\n\n// ── The interface ──\nconst field = await slice.build('Input', {\n  label: 'New task', size: 'sm',\n  onEnter: (text, event) => {\n    if (event.ctrlKey || event.metaKey) return;          // Ctrl+Enter is a shortcut, not \"add\"\n    const title = text.trim();\n    if (!title) return;\n    remember();\n    if (renaming !== null) {\n      tasks = tasks.map((t) => (t.id === renaming ? { ...t, title } : t));\n      say('Renamed · U to undo');\n      renaming = null;\n      field.label = 'New task';\n    } else {\n      tasks = [{ id: nextId++, title, tag: 'Inbox', done: false }, ...tasks];\n      filter = filter === 'done' ? 'all' : filter;\n      current = 0;\n      say('Added · U to undo');\n    }\n    field.value = '';\n    paint();\n    box.focus();                                          // back to the list: the keys work again\n  }\n});\nconst filterBadge = await slice.build('Badge', { label: 'All', tone: 'accent' });\nconst list = document.createElement('div');\nlist.setAttribute('role', 'listbox');\nlist.setAttribute('aria-label', 'Tasks');\nlist.style.cssText = 'display:grid;gap:4px';\nconst status = document.createElement('small');\nstatus.style.cssText = 'opacity:.75;min-height:1.4em';\nconst say = (text) => { status.textContent = text; };\n\nconst paint = () => {\n  const items = visible();\n  current = Math.max(0, Math.min(current, items.length - 1));\n  filterBadge.label = FILTERS.find(([value]) => value === filter)[1];\n  list.replaceChildren(...items.map((task, i) => {\n    const row = document.createElement('div');\n    row.setAttribute('role', 'option');\n    row.setAttribute('aria-selected', String(i === current));\n    const on = i === current;\n    row.style.cssText = `display:flex;gap:10px;align-items:center;padding:8px 12px;border-radius:8px;border:1px solid ${on ? 'var(--primary-color)' : 'var(--primary-color-shade)'};${on ? 'background:color-mix(in srgb, var(--primary-color) 14%, transparent);' : ''}`;\n    const mark = document.createElement('span');\n    mark.textContent = task.done ? '✓' : '○';\n    mark.style.cssText = `width:1.2em;text-align:center;${task.done ? 'color:var(--success-color)' : 'opacity:.6'}`;\n    const title = document.createElement('span');\n    title.textContent = task.title;\n    title.style.cssText = `flex:1;${task.done ? 'text-decoration:line-through;opacity:.65' : ''}`;\n    const tag = document.createElement('small');\n    tag.textContent = task.tag;\n    tag.style.opacity = '.7';\n    row.append(mark, title, tag);\n    return row;\n  }));\n  if (!items.length) list.textContent = filter === 'done' ? 'Nothing done yet.' : 'Nothing to do.';\n};\n\n// ── A dialog that takes the keyboard while it is open ──\nconst openDialog = async (title, content, onKeys) => {\n  const dialog = await slice.build('Modal', { title, size: 'sm', content });\n  document.body.append(dialog);\n  keys.activate(dialog);                 // the task shortcuts wait\n  const shown = dialog.show();\n  onKeys?.(dialog);\n  const { returnValue } = await shown;\n  keys.deactivate(dialog);\n  slice.controller.destroyComponent(dialog);\n  return returnValue;\n};\n\nconst openHelp = () => {\n  const rows = document.createElement('div');\n  rows.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:6px 16px;align-items:center';\n  let group = '';\n  for (const shortcut of keys.list().filter((s) => s.label)) {\n    if (shortcut.group !== group) {\n      group = shortcut.group;\n      const heading = document.createElement('strong');\n      heading.textContent = group;\n      heading.style.cssText = 'grid-column:1 / -1;margin-top:6px';\n      rows.append(heading);\n    }\n    const k = document.createElement('kbd');\n    k.textContent = shortcut.keys.join(' / ');\n    const label = document.createElement('span');\n    label.textContent = shortcut.label;\n    rows.append(k, label);\n  }\n  return openDialog('Keyboard shortcuts', rows);\n};\n\n// The palette lists the same commands, runs the chosen one after it closes.\nconst openPalette = async () => {\n  const wrap = document.createElement('div');\n  wrap.style.cssText = 'display:grid;gap:8px';\n  const results = document.createElement('div');\n  results.setAttribute('role', 'listbox');\n  results.style.cssText = 'display:grid;gap:2px;max-height:300px;overflow:auto';\n  let matches = [];\n  let pick = 0;\n  const show = (query) => {\n    const q = query.trim().toLowerCase();\n    matches = commands.filter((c) => c.combo !== 'mod+k' && (!q || `${c.label} ${c.group}`.toLowerCase().includes(q)));\n    pick = Math.min(pick, Math.max(0, matches.length - 1));\n    results.replaceChildren(...matches.map((c, i) => {\n      const row = document.createElement('div');\n      row.setAttribute('role', 'option');\n      row.setAttribute('aria-selected', String(i === pick));\n      row.style.cssText = `display:flex;justify-content:space-between;gap:12px;padding:6px 10px;border-radius:6px;${i === pick ? 'background:color-mix(in srgb, var(--primary-color) 14%, transparent)' : ''}`;\n      const name = document.createElement('span');\n      name.textContent = c.label;\n      const k = document.createElement('kbd');\n      k.textContent = keys.format(c.combo);\n      row.append(name, k);\n      return row;\n    }));\n    if (!matches.length) results.textContent = 'No command matches.';\n  };\n  const search = await slice.build('Input', { label: 'Type a command', size: 'sm', onChange: (text) => { pick = 0; show(text); } });\n  wrap.append(search, results);\n  show('');\n  let chosen = null;\n  const answer = await openDialog('Commands', wrap, (dialog) => {\n    search.focus();\n    // Arrows and Enter are how this list works (its own keyboard model), not shortcuts.\n    search.addEventListener('keydown', (event) => {\n      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {\n        event.preventDefault();\n        pick = (pick + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % Math.max(1, matches.length);\n        show(search.value);\n      } else if (event.key === 'Enter' && matches[pick]) {\n        chosen = matches[pick];\n        dialog.close('run');\n      }\n    });\n  });\n  if (answer === 'run' && chosen) {\n    box.focus();\n    chosen.run();\n  }\n};\n\n// ── The commands: one list for the shortcuts, the palette and the help ──\nconst move = (step) => { current = Math.max(0, Math.min(visible().length - 1, current + step)); paint(); };\nconst hasTask = () => selected() !== null;\nconst setFilter = (value) => { filter = value; current = 0; paint(); };\nconst stepFilter = (step) => setFilter(FILTERS[(FILTERS.findIndex(([v]) => v === filter) + step + FILTERS.length) % FILTERS.length][0]);\nconst inField = () => document.activeElement?.closest?.('slice-input') === field;\nconst commands = [\n  // Ctrl only where an app is expected to take it (override: the browser uses Ctrl+K too).\n  { combo: 'mod+k', label: 'Command palette', group: 'General', override: true, typing: true, run: openPalette },\n  { combo: 'shift+?', label: 'Keyboard shortcuts', group: 'General', run: openHelp },\n  { combo: 'j', label: 'Next task', group: 'Move', repeat: true, run: () => move(1) },\n  { combo: 'k', label: 'Previous task', group: 'Move', repeat: true, run: () => move(-1) },\n  { combo: 'mod+enter', label: 'Done / not done', group: 'Tasks', when: hasTask, typing: false, run: () => {\n    const task = selected();\n    remember();\n    tasks = tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t));\n    say(`${task.done ? 'Back to do' : 'Done'} · U to undo`);\n    paint();\n  } },\n  { combo: 'n', label: 'New task', group: 'Tasks', run: () => { renaming = null; field.label = 'New task'; field.focus(); } },\n  { combo: 'e', label: 'Rename task', group: 'Tasks', when: hasTask, run: () => {\n    const task = selected();\n    renaming = task.id;\n    field.label = 'Rename task (Enter to save, Esc to cancel)';\n    field.value = task.title;\n    field.focus();\n  } },\n  { combo: 'escape', label: 'Leave the field', group: 'Tasks', when: inField, typing: true, run: () => {\n    renaming = null;\n    field.label = 'New task';\n    field.value = '';\n    box.focus();\n  } },\n  { combo: 'delete', label: 'Delete task', group: 'Tasks', when: hasTask, run: () => {\n    const task = selected();\n    remember();\n    tasks = tasks.filter((t) => t.id !== task.id);\n    say(`Deleted \"${task.title}\" · U to undo`);\n    paint();\n  } },\n  { combo: 'u', label: 'Undo', group: 'Tasks', run: () => {\n    const before = history.pop();\n    if (!before) { say('Nothing to undo.'); return; }\n    tasks = JSON.parse(before);\n    say('Undone.');\n    paint();\n  } },\n  { combo: ']', label: 'Next filter', group: 'View', run: () => stepFilter(1) },\n  { combo: '[', label: 'Previous filter', group: 'View', run: () => stepFilter(-1) },\n  { combo: 'g a', label: 'Show all', group: 'View', run: () => setFilter('all') },\n  { combo: 'g t', label: 'Show to do', group: 'View', run: () => setFilter('todo') },\n  { combo: 'g d', label: 'Show done', group: 'View', run: () => setFilter('done') }\n];\n\n// Registered on the field (they go when this example does), only with focus inside it.\nfor (const command of commands) {\n  keys.add(command.combo, field, () => command.run(), {\n    within: box, label: command.label, group: command.group, repeat: command.repeat, when: command.when,\n    override: command.override,\n    // In the field: plain keys only type; Ctrl+K and Esc still work, Ctrl+Enter does not.\n    inInputs: command.typing\n  });\n}\n\nconst head = document.createElement('div');\nhead.style.cssText = 'display:flex;gap:10px;align-items:end';\nfield.style.flex = '1';\nhead.append(field, filterBadge);\npaint();\nsay(`${keys.format('mod+k')} for every command · ? for the shortcuts`);\nbox.append(head, list, status);\nreturn box;\n:::\n\n### A dialog that takes the keyboard\nActivate the dialog as its scope when it opens: the page's `j`, `k`, `e` stop working, the dialog's `mod+enter` works, and a `global` shortcut (search) still does. Deactivate it when it closes; if it is destroyed instead, the page gets the keyboard back anyway.\n\n```js\nconst editor = await slice.build('Modal', { title: 'New message', content: form });\ndocument.body.append(editor);\n\nkeys.add('mod+enter', editor, () => send(), { scope: editor, label: 'Send', inInputs: true });\nkeys.activate(editor);\nawait editor.show();\nkeys.deactivate(editor);\n```\n\n### Shortcuts that only exist while something is selected\n```js\nkeys.add('delete', this, () => this.removeSelected(), {\n  label: 'Delete selected',\n  when: () => this.$table.selected.length > 0,\n});\n```\n\n### An editor's own shortcuts\n`within` limits them to focus inside the element, `inInputs: true` lets them fire while typing there, and `override: true` says that taking the browser's Ctrl+B (bookmarks in Firefox) is meant inside an editor.\n\n```js\nkeys.add('mod+b', this, () => this.toggleBold(), { within: this.$editor, inInputs: true, override: true, label: 'Bold', group: 'Editor' });\n```\n\n## Best practices\n:::tip\n- One service for the app (`singleton: true`), and every shortcut added by the component it belongs to: it goes away with it.\n- Give each shortcut a `label`, and offer `?` with `list()`: shortcuts nobody can discover are not used.\n- Use Ctrl/⌘ only where people expect an app to take it (`mod+k` for a palette, `mod+enter` to send); almost every other Ctrl+letter is the browser's. Plain keys and sequences (`j`, `e`, `g i`), with a `within` or a `scope`, are what Gmail, GitHub or Linear use for the rest.\n- Read the warnings: when the service says a key is the browser's, choose another, or pass `override: true` only when taking it is the point.\n:::\n\n## Pitfalls\n:::warning\nDo not take keys the browser or the screen reader relies on (Tab, Ctrl+L, Ctrl+F, F6, Alt+arrows for history). `preventDefault` would take them away from people who depend on them. Some (Ctrl+T, Ctrl+W, Ctrl+N) the browser never gives to a page at all; the service warns about both while you develop.\n:::\n\n:::warning\nA single-letter shortcut fires anywhere on the page that is not a text field. In pages with many custom widgets, give it a `scope` or a `within`, or use a sequence.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'shortcuts' });\n\nkeys.add('mod+k', this, () => this.openSearch(), { label: 'Search', group: 'General', override: true });\nkeys.add('g o', this, () => slice.router.navigate('/orders'), { label: 'Go to orders', group: 'Navigation' });\nkeys.add('shift+?', this, () => this.showShortcuts(), { label: 'Keyboard shortcuts', group: 'General' });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const keys = await slice.build('ShortcutService', { singleton: true, sliceId: 'shortcuts' });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const lines = ["| Prop | Type | Default | Description |","| --- | --- | --- | --- |","| `sequenceTimeout` | `number` | `1000` | Ms between the keys of a sequence (`g` then `o`). |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const lines = ["| You write | It means |","| --- | --- |","| `mod+k` | ⌘K on Mac, Ctrl+K elsewhere |","| `ctrl+k`, `meta+k`, `alt+k`, `shift+k` | that exact modifier (`cmd`, `option`, `control` also work) |","| `mod+shift+p` | several modifiers |","| `escape`, `enter`, `space`, `arrowup`, `delete`, `f2` | named keys (`esc`, `up`, `del`… also work) |","| `shift+?`, `/`, `[` | punctuation: Shift is not required to match, because keyboards differ |","| `g o` | a sequence: G, then O |","| `['mod+k', 'ctrl+p']` | any of them |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Method | Returns | Description |","| --- | --- | --- |","| `add(combo, component, handler, options?)` | `() => void` | Calls `handler(event, shortcut)` when the keys are pressed, while `component` lives. Returns a function that removes it. |","| `removeAll(component)` | — | Removes the component's shortcuts now (they also go when it is destroyed). |","| `activate(component)` | — | The component takes the keyboard: only its shortcuts (`scope: component`) and the `global` ones fire. Scopes stack. |","| `deactivate(component)` | — | Gives the keyboard back. A destroyed scope is dropped by itself. |","| `activeScope` | component \\| `null` | The scope on top (`null`: the page). |","| `list({ all }?)` | `[{ keys, label, group, scope }]` | The shortcuts that would fire now (`all: true`: every one), with keys formatted for this platform. |","| `format(combo)` | `string` | `'mod+shift+k'` → `⌘⇧K` / `Ctrl+Shift+K`. |","| `pause()` / `resume()` | — | Stops every shortcut (while recording a new one, during a game). Calls nest. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const lines = ["| Option | Default | Description |","| --- | --- | --- |","| `label`, `group` | `''` | What `list()` shows. |","| `scope` | `null` | A component: fires only while it is the active scope. Without it, the shortcut belongs to the page. |","| `global` | `false` | Fires whatever scope is active (search, help). |","| `within` | `null` | An element: fires only when focus is inside it (an editor's own shortcuts). |","| `inInputs` | combinations only | `true`: also while typing in a field. `false`: never while typing. By default, combinations with Ctrl, ⌘ or Alt fire while typing, except the keys that edit text (`mod+z`, `mod+backspace`, `mod+arrows`…). |","| `override` | `false` | `true`: taking keys the browser uses is meant (a palette on `mod+k`, bold on `mod+b` in an editor), so no warning. |","| `preventDefault` | `true` | The browser's own action for those keys does not run. |","| `repeat` | `false` | Holding the keys down fires once; `true` fires on every repeat (arrows). |","| `when()` | — | Fires only when it returns `true` (something is selected, a tab is open). |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const editor = await slice.build('Modal', { title: 'New message', content: form });\ndocument.body.append(editor);\n\nkeys.add('mod+enter', editor, () => send(), { scope: editor, label: 'Send', inInputs: true });\nkeys.activate(editor);\nawait editor.show();\nkeys.deactivate(editor);",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-9"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "keys.add('delete', this, () => this.removeSelected(), {\n  label: 'Delete selected',\n  when: () => this.$table.selected.length > 0,\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-10"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "keys.add('mod+b', this, () => this.toggleBold(), { within: this.$editor, inInputs: true, override: true, label: 'Bold', group: 'Editor' });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

   beforeDestroy() {
     for (const link of this._inlineLinks) {
       slice.controller.destroyComponent(link);
     }
     this._inlineLinks = [];
   }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: 'Copy as markdown'
    });

    container.appendChild(copyMenu);
  }

  async renderScriptScenarios() {
    if (!Array.isArray(this.scriptScenarios) || this.scriptScenarios.length === 0) return;
    const host = this.querySelector('.documentation-content');
    if (!host) return;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

      // Render where the author put the :::script blocks.
      //
      // The markdown parser already emits one <div class="script-block"> at the
      // position of each block, in document order, and those divs come from the same
      // parse as this.scriptScenarios â€” so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all â€” the divs
      // were never filled, nothing in the repo reads .script-block â€” the real demos were
      // exiled below the props table, and 38 of 53 pages showed the heading twice.
      const blocks = [...this.querySelectorAll('.script-block')];
      const inPlace = blocks.length === this.scriptScenarios.length;

      const section = document.createElement('section');
      if (!inPlace) {
         // Fallback, kept so a future parser change that desyncs the two cannot
         // silently drop every demo. An author-placed heading already exists in the
         // in-place case, so only invent one when we are building the section.
         section.classList.add('doc-script-scenarios');

         const title = document.createElement('h2');
         title.textContent = 'Prop Scenarios';
         section.appendChild(title);

         const subtitle = document.createElement('p');
         subtitle.classList.add('doc-script-subtitle');
         subtitle.textContent = 'Interactive demos validating component behavior.';
         section.appendChild(subtitle);
      }
      for (const [index, scenario] of this.scriptScenarios.entries()) {
      const demobox = await slice.build('DemoBox', {
        label: scenario.label,
        expected: scenario.expected || ''
      });

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });

      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        demobox.clear();
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed var(--warning-color)';
          fallback.style.borderRadius = '8px';
          fallback.style.background = 'color-mix(in srgb, var(--primary-background-color) 85%, var(--warning-color))';
          fallback.style.color = 'var(--font-primary-color)';
          fallback.textContent = String(name || '')
            ? 'Component "' + String(name) + '" is not registered in this build yet.'
            : 'Requested component is not registered in this build yet.';
          return fallback;
        };

        const safeSlice = Object.create(slice);
        safeSlice.build = async (name, props) => {
          const built = await slice.build(name, props);
          if (built instanceof Node) {
            return built;
          }
          if (Array.isArray(built)) {
            const fragment = document.createDocumentFragment();
            let hasNode = false;
            built.forEach((item) => {
              if (item instanceof Node) {
                fragment.appendChild(item);
                hasNode = true;
              }
            });
            if (hasNode) {
              return fragment;
            }
          }
          return built ?? createBuildFallbackNode(name);
        };

        const mount = (node) => {
          if (node instanceof Node) {
            demobox.appendDemo(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

          if (result instanceof Node) {
            demobox.appendDemo(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                demobox.appendDemo(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };
      (inPlace ? blocks[index] : section).appendChild(demobox);
      demobox.appendCode(code);
      (inPlace ? blocks[index] : section).appendChild(errorMessage);

      await executeScenario();
    }
      if (!inPlace) host.appendChild(section);
  }
}

customElements.define('slice-shortcutservicedocumentation', ShortcutServiceDocumentation);
