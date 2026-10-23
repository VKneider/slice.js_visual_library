---
title: ToolTip
route: /docs/display/tooltip
navLabel: ToolTip
section: Display
group: Overlay
order: 10
description: Explains a control on hover, keyboard focus or a long press. Title, text and shortcut, twelve placements with an arrow that follows the trigger, three looks, a toggletip mode for an ⓘ with links, and it shows above modals.
component: ToolTipDocumentation
generate: true
tags: [tooltip, toggletip, hint, overlay, display]
---

# ToolTip

## Overview
A `ToolTip` explains the control it wraps: what an icon button does, the keyboard shortcut, or why a button is disabled. It shows on hover after a short delay, on keyboard focus right away, and on a long press on touch screens.

```javascript
const tip = await slice.build('ToolTip', { text: 'Bold', shortcut: '⌘B' });
tip.appendChild(boldButton);
```

### When to use it
- Icon buttons, whose icon alone may not say enough.
- Keyboard shortcuts, next to the action's name.
- A disabled control, to say why it is disabled.
- An abbreviation or a term, wrapped in text.

### When not to use it
- **Information people need to complete a task.** Put it on the page, as a field's `help` text for example. A tooltip is hidden until someone looks for it.
- **Anything to click** (a link, a button) belongs in a **toggletip** (`mode: 'toggletip'`), or a [Modal](/docs/feedback/modal).
- **Many plain-text tooltips** on one page (a toolbar, a table) are cheaper with [ToolTipProvider](/docs/services/tooltip-provider), which shares one bubble.

## Core Behavior

### The trigger
Whatever you put inside the ToolTip is its trigger.
- **A focusable control** (a Button, a link, an input) keeps its own place in the Tab order and gets `aria-describedby`. The ToolTip adds no tab stop, so a toolbar is not twice as long to tab through.
- **Text, or a disabled control,** has nothing to focus, so the ToolTip itself becomes focusable. That is how a disabled button can still say why, to the mouse and to the keyboard.

### Showing and hiding
- **Hover:** shows after `showDelay` (400ms by default), so it does not flash while the pointer crosses the page. Once one tooltip has shown, its neighbours show at once for a moment, so moving along a toolbar reads every label without waiting.
- **Keyboard focus:** shows at once. A mouse click that happens to focus the control does not show it.
- **Touch:** a long press shows it, and it stays a moment after the finger lifts.
- **Clicking the control** does what the control does, and the tooltip steps aside.
- The bubble can be hovered without closing, so it can be read and selected (WCAG 1.4.13). It closes `hideDelay` (100ms) after the pointer leaves both the trigger and the bubble.
- **Escape** closes it from anywhere. That Escape is used up: a tooltip open in a Modal takes the first Escape, and the Modal the second.
- It also closes when the trigger scrolls out of view or leaves the page. Only one tooltip is open at a time.
- `show()`, `hide()` and `toggle()` work from code, and `onOpenChange(open)` reports changes. `disabled` switches it off.

### Above everything
The bubble is a popover, so it renders in the browser's top layer: above a [Modal](/docs/feedback/modal), a Drawer or a calendar, and never clipped by an ancestor's `overflow: hidden`.

### Content
- `text` is the description.
- `title` adds a bold line above it, for a richer tooltip.
- `shortcut` shows a key combination (`'⌘B'`, `'Ctrl+S'`) in a `<kbd>`.
- `content` takes a node instead of `text`.

Changing any of them while the tooltip is open updates it in place ("Copy" → "Copied!").

### Toggletip
`mode: 'toggletip'` is for an ⓘ button that explains something and may hold a link.
- A click opens and closes it. Hover does nothing.
- The trigger gets `aria-expanded`.
- The bubble sits right after the trigger, so **Tab** goes from the ⓘ into its links.
- **Escape** closes it and puts the focus back on the ⓘ. Tabbing out or clicking elsewhere closes it too.

## Looks
- `placement`: `'top'` (default), `'bottom'`, `'left'` or `'right'`, each with `-start` or `-end` to align with an edge of the trigger (`'bottom-start'`).
  - When the side has no room, it flips to the other side, then shifts into the screen.
  - The arrow keeps pointing at the trigger's centre after a shift. `arrow: false` removes it.
- `variant`:
  - `'inverse'` (default): dark on a light theme, light on a dark one;
  - `'light'`: a raised surface with a border;
  - `'accent'`: the primary colour.
- `size`: `'sm'` or `'md'` (default).
- `offset` (8px) is the gap to the trigger. `maxWidth` (280px) wraps long text.
- `customColor: { background, text, border }` retints one tooltip.

## Live Preview
:::component name="ToolTip"
{
  "text": "Save your work before leaving",
  "showDelay": 0
}
:::

## Examples
:::script label="Editor toolbar" expected="a toolbar of buttons, each with its name and shortcut; after the first tooltip, moving along the toolbar shows the others at once; Tab moves button to button with no extra stops"
const tools = [
  { label: 'Bold', icon: 'letter-bold', shortcut: '⌘B' },
  { label: 'Italic', icon: 'letter-italic', shortcut: '⌘I' },
  { label: 'Underline', icon: 'letter-underline', shortcut: '⌘U' },
  { label: 'Insert link', icon: 'link', shortcut: '⌘K' },
  { label: 'Undo', icon: 'undo', shortcut: '⌘Z' }
];
const toasts = await slice.build('ToastProvider', { singleton: true });
const bar = document.createElement('div');
bar.setAttribute('role', 'toolbar');
bar.setAttribute('aria-label', 'Formatting');
bar.style.cssText = 'display:inline-flex;gap:4px;padding:6px;border:1px solid var(--slice-border-raised);border-radius:12px';

for (const tool of tools) {
  // Icon only: no label on screen, the name in ariaLabel.
  const button = await slice.build('Button', {
    value: '', ariaLabel: tool.label, icon: tool.icon, variant: 'ghost', size: 'sm',
    onClick: () => toasts.show(tool.label, { duration: 1200 })
  });
  const tip = await slice.build('ToolTip', { text: tool.label, shortcut: tool.shortcut, placement: 'bottom' });
  tip.appendChild(button);
  bar.appendChild(tip);
}
return bar;
:::

:::script label="Why is it disabled?" expected="a disabled Publish button whose tooltip says the title is missing (on hover, or by tabbing to it); typing a title enables it and the tooltip changes to its shortcut"
const toasts = await slice.build('ToastProvider', { singleton: true });
const publish = await slice.build('Button', {
  value: 'Publish', icon: 'upload', disabled: true,
  onClick: () => toasts.show(`Published “${title.value}”`, { type: 'success' })
});
const tip = await slice.build('ToolTip', { text: 'Add a title to publish', placement: 'right' });
tip.appendChild(publish);

const title = await slice.build('Input', {
  label: 'Title',
  onChange: (value) => {
    const ready = value.trim().length > 0;
    publish.disabled = !ready;
    // The same tooltip, saying something else once the button works.
    tip.text = ready ? 'Publish now' : 'Add a title to publish';
    tip.shortcut = ready ? '⌘↵' : '';
  }
});

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:14px;max-width:420px;width:100%;justify-items:start';
box.append(title, tip);
return box;
:::

:::script label="A field with a toggletip" expected="a phone field with an ⓘ beside its label; clicking the ⓘ explains why the number is asked for, with a link Tab can reach; Escape closes it and returns to the ⓘ"
const why = document.createElement('div');
why.innerHTML = 'We only use it to text you about this delivery. <a href="#privacy">Read the privacy policy</a>';

const info = await slice.build('ToolTip', { mode: 'toggletip', title: 'Why we ask', content: why, variant: 'light', placement: 'top-start' });
const button = await slice.build('Button', { value: '', ariaLabel: 'Why we ask for your phone', icon: 'info-circle', variant: 'ghost', size: 'sm' });
info.appendChild(button);

const label = document.createElement('div');
label.style.cssText = 'display:flex;align-items:center;gap:2px;font-weight:600;font-size:.9rem';
label.append('Phone', info);

const phone = await slice.build('Input', { ariaLabel: 'Phone', type: 'tel', placeholder: '+58 412 000 0000', labelPlacement: 'above' });
const card = await slice.build('Card', { title: 'Delivery details', content: [label, phone] });
card.style.maxWidth = '420px';
return card;
:::

:::script label="Copy with feedback" expected="a Copy link button; clicking it copies the link and the tooltip says 'Copied!' for a moment, then goes back to 'Copy link'"
const link = 'https://slice.dev/invite/7f3a';
const field = await slice.build('Input', { value: link, readonly: true, ariaLabel: 'Invite link' });
field.style.flex = '1';
const tip = await slice.build('ToolTip', { text: 'Copy link', placement: 'top' });
const copy = await slice.build('Button', {
  value: 'Copy', icon: 'file-clone', variant: 'outlined',
  onClick: async () => {
    try { await navigator.clipboard.writeText(link); } catch { /* the docs page may not allow it */ }
    tip.text = 'Copied!';
    tip.show();
    setTimeout(() => { tip.hide(); tip.text = 'Copy link'; }, 1200);
  }
});
tip.appendChild(copy);
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;align-items:center;max-width:480px;width:100%';
row.append(field, tip);
return row;
:::

:::script label="Inside a Modal" expected="a button opens a Modal whose icon buttons have tooltips, shown above the dialog; the first Escape closes the tooltip, the second the Modal"
const open = async () => {
  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:8px';
  for (const [label, icon] of [['Download', 'download'], ['Share', 'share-nodes'], ['Move to trash', 'trash-bin']]) {
    const button = await slice.build('Button', { value: '', ariaLabel: label, icon, variant: 'outlined', size: 'sm' });
    const tip = await slice.build('ToolTip', { text: label, showDelay: 200 });
    tip.appendChild(button);
    actions.appendChild(tip);
  }
  const modal = await slice.build('Modal', { title: 'quarterly-report.pdf', icon: 'file-lines', content: ['2.4 MB · edited yesterday', actions], destroyOnClose: true });
  document.body.appendChild(modal);
  modal.show();
};
return await slice.build('Button', { value: 'Open file', onClick: open });
:::

:::script label="Looks at a glance" expected="the three variants, the small size, a rich tooltip with a title, and twelve placements; hover each to see it"
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:22px;width:100%';
const row = () => {
  const r = document.createElement('div');
  r.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px';
  box.appendChild(r);
  return r;
};
const add = async (target, label, props) => {
  const tip = await slice.build('ToolTip', { showDelay: 0, ...props });
  tip.appendChild(await slice.build('Button', { value: label, variant: 'outlined', size: 'sm' }));
  target.appendChild(tip);
};
const looks = row();
for (const variant of ['inverse', 'light', 'accent']) await add(looks, variant, { text: `variant: '${variant}'`, variant });
await add(looks, 'size sm', { text: 'A small tooltip', size: 'sm' });
await add(looks, 'rich', { title: 'Version history', text: 'See every change, and restore an earlier version.', shortcut: '⌥⌘H', maxWidth: 240 });
await add(looks, 'no arrow', { text: 'No arrow', arrow: false });

const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,max-content);gap:10px;padding:30px 0';
for (const side of ['top', 'bottom', 'left', 'right']) {
  for (const align of ['-start', '', '-end']) await add(grid, `${side}${align}`, { text: `placement: '${side}${align}'`, placement: `${side}${align}` });
}
box.appendChild(grid);
return box;
:::

## Best Practices
:::tip
Keep it short: a name, or a sentence. If it needs a paragraph, it belongs on the page or in a toggletip.
:::

:::tip
Explain disabled buttons. "Add a title to publish" saves people from guessing what is missing.
:::

:::tip
Show the shortcut. A tooltip is the one place people look for it, and `shortcut` styles it as a key.
:::

## Pitfalls
:::warning
Do not put links or buttons in a plain tooltip: it closes when the pointer leaves, and touch users barely see it. Use `mode: 'toggletip'`.
:::

:::warning
A tooltip is not a label. An icon-only button still needs its own accessible name (Button's `value`), and the tooltip describes it.
:::