---
title: Textarea
route: /docs/input/textarea
navLabel: Textarea
section: Input Components
group: Basic
order: 13
description: Multi-line text field that shares Input's label, looks and validation, with auto-grow up to a limit, a counter and Ctrl+Enter to submit.
component: TextareaDocumentation
generate: true
tags: [textarea, input, forms, multiline, validation]
---

# Textarea

## Overview
`Textarea` is the multi-line sibling of [Input](/docs/input/input), and the two are built to be one family. They share:
- the label: floating, or above the field;
- the variants and sizes;
- the help / error line and the counter;
- the validation rules and when errors show;
- the floating-label animation and the error shake, which are the same rules in both stylesheets.

On top of that, Textarea adds what multi-line text needs: auto-grow with a ceiling, resize control and Ctrl+Enter to submit.

## Core Behavior
- `value` reads and sets the text. `onChange(value)` fires on every keystroke, or once after a pause with `debounce`.
- `rows` is the starting height in lines.
- `autoGrow` makes the field grow with its content. `maxRows` stops it growing at that many lines; past that, it scrolls.
- `resize`: `'vertical'` (default), `'none'`, `'both'` or `'horizontal'`. Auto-grow turns the handle off.
- `onSubmit(value, event)` fires on Ctrl+Enter (⌘+Enter on a Mac). That is the usual "send" shortcut for a comment or a message, and plain Enter still makes a new line.
- `name` makes it part of a native `<form>`.
- `readonly` shows text people can select and copy but not edit, such as generated code or an ID. `disabled` would also take it out of the tab order and stop selection.
- `focus()`, `blur()`, `select()` and `clear()` work as on Input.

## Shared with Input
These work exactly as they do on [Input](/docs/input/input):
- `label`, `labelPlacement`, `placeholder`, `required` and `ariaLabel`;
- `variant` (`outlined`, `filled`, `ghost`) and `size` (`sm`, `md`, `lg`);
- `help`, `error`, `invalid`, `showCount`, `minlength` and `maxlength`;
- `validator`, `conditions`, `messages`, `validateOn`, `validate()`, `validationMessage` and `isValid`.

An error shows when the person leaves the field and then follows the value live, so it goes away as soon as the text is fixed. An empty field is never turned red on its own: `required` and `minlength` wait for `validate()` (a submit).

## Live Preview
:::component name="Textarea"
{
  "label": "Bio",
  "help": "Shown on your profile",
  "maxlength": 160,
  "showCount": true,
  "autoGrow": true,
  "maxRows": 6
}
:::

## Examples
:::script label="Comments" expected="the box grows as you type (up to 6 lines); Ctrl+Enter or Comment posts it to the list; the button wakes up once there is text"
const list = document.createElement('div');
list.style.cssText = 'display:flex;flex-direction:column;gap:12px';

const addComment = async (text) => {
  const item = document.createElement('div');
  item.style.cssText = 'display:flex;gap:10px;align-items:flex-start';
  const avatar = document.createElement('span');
  avatar.textContent = 'AL';
  avatar.style.cssText = 'flex:none;display:inline-grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--primary-color);color:var(--primary-color-contrast);font-size:12px;font-weight:700';
  const body = document.createElement('div');
  const who = document.createElement('div');
  who.style.cssText = 'font-size:.8rem;font-weight:600';
  who.textContent = 'Ana López · just now';
  const p = document.createElement('p');
  p.style.cssText = 'margin:2px 0 0;white-space:pre-wrap;font-size:.9rem;line-height:1.5';
  p.textContent = text;
  body.append(who, p);
  item.append(avatar, body);
  list.prepend(item);
};

const post = () => {
  const text = box.value.trim();
  if (!text) return;
  addComment(text);
  box.clear();
  sync();
  box.focus();
};
const box = await slice.build('Textarea', {
  label: 'Add a comment',
  placeholder: 'Ctrl+Enter to post',
  rows: 2,
  autoGrow: true,
  maxRows: 6,
  maxlength: 280,
  showCount: true,
  onSubmit: post
});
const button = await slice.build('Button', { value: 'Comment', size: 'sm', onClick: post });
const sync = () => { button.$button.disabled = box.value.trim() === ''; };
box.onChange = sync;
sync();

const actions = document.createElement('div');
actions.style.cssText = 'display:flex;justify-content:flex-end';
actions.append(button);
const wrap = document.createElement('div');
wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;width:100%;max-width:560px';
wrap.append(box, actions, list);
return wrap;
:::

:::script label="Feedback in a Modal" expected="a rating and a required comment of at least 20 characters; Send stays in the modal until both are valid"
const toasts = await slice.build('ToastProvider', { singleton: true });
const open = async () => {
  const rating = await slice.build('RadioGroup', {
    label: 'How was it?',
    orientation: 'horizontal',
    options: ['Bad', 'Okay', 'Good', 'Great']
  });
  const comment = await slice.build('Textarea', {
    label: 'Tell us more',
    required: true,
    minlength: 20,
    rows: 4,
    showCount: true,
    messages: { minlength: 'A few more words, please ({minlength} characters at least)' }
  });
  const body = document.createElement('div');
  body.style.cssText = 'display:flex;flex-direction:column;gap:20px';
  body.append(rating, comment);

  const modal = await slice.build('Modal', {
    title: 'Send feedback',
    icon: 'bell',
    content: body,
    destroyOnClose: true,
    mobileLayout: 'sheet',
    actions: [
      { value: 'Cancel', variant: 'ghost' },
      {
        value: 'Send',
        onClick: () => {
          if (!rating.value) { toasts.show('Pick a rating first', { type: 'warning' }); return false; }
          if (!comment.validate()) { comment.focus(); return false; }
          toasts.show(`Thanks! (${rating.value})`, { type: 'success' });
        },
        close: true
      }
    ]
  });
  document.body.appendChild(modal);
  modal.open = true;
};
return await slice.build('Button', { value: 'Give feedback', icon: 'bell', variant: 'outlined', onClick: open });
:::

:::script label="Generated output, read-only" expected="editing the fields rewrites the JSON below; the read-only box can be selected and copied but not edited"
const toasts = await slice.build('ToastProvider', { singleton: true });
const name = await slice.build('Input', { label: 'Project name', value: 'website-redesign' });
const owner = await slice.build('Input', { label: 'Owner', type: 'email', value: 'ana@acme.dev' });
const isPublic = await slice.build('Switch', { label: 'Public', checked: false, labelPlacement: 'left' });
const output = await slice.build('Textarea', {
  label: 'project.json',
  readonly: true,
  autoGrow: true,
  resize: 'none'
});
const render = () => {
  output.value = JSON.stringify({ name: name.value, owner: owner.value, public: isPublic.checked }, null, 2);
};
name.onChange = render;
owner.onChange = render;
isPublic.onChange = render;
render();
const copy = await slice.build('Button', {
  value: 'Copy JSON', size: 'sm', variant: 'outlined',
  onClick: async () => {
    try { await navigator.clipboard.writeText(output.value); toasts.show('Copied', { type: 'success' }); }
    catch { output.select(); toasts.show('Press Ctrl+C to copy', { type: 'info' }); }
  }
});
const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;align-items:end;width:100%';
grid.append(name, owner, isPublic);
const wrap = document.createElement('div');
wrap.style.cssText = 'display:flex;flex-direction:column;gap:18px;width:100%';
const row = document.createElement('div');
row.style.cssText = 'display:flex;justify-content:flex-end';
row.append(copy);
wrap.append(grid, output, row);
return wrap;
:::

:::script label="Looks at a glance" expected="variants, sizes, the label above, an error and a disabled field"
const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px 18px;width:100%';
const specs = [
  { label: 'Outlined', value: 'Default look' },
  { label: 'Filled', variant: 'filled', value: 'Tinted, no border' },
  { label: 'Ghost', variant: 'ghost', placeholder: 'Shows on hover' },
  { label: 'Small', size: 'sm' },
  { label: 'Large', size: 'lg' },
  { label: 'Label above', labelPlacement: 'above', placeholder: 'Static label' },
  { label: 'With an error', error: 'Please describe the problem' },
  { label: 'Disabled', disabled: true, value: 'Not editable' }
];
for (const props of specs) grid.appendChild(await slice.build('Textarea', { rows: 2, ...props }));
return grid;
:::

## Best Practices
:::tip
Use `autoGrow` with a `maxRows` for anything people write freely (comments, messages, descriptions). It starts compact, grows as they write, and stops before it pushes the rest of the page away.
:::

:::tip
Offer Ctrl+Enter (`onSubmit`) wherever there is a send button. People who write a lot expect it, and plain Enter still makes a new line.
:::

## Pitfalls
:::warning
Textareas no longer carry a 20px margin. Spacing belongs to whatever holds them. To get it back on one field, set `--control-margin-block: 20px` on it.
:::

:::warning
`autoGrow` measures the text, and a field that is not on the page (or is inside something with `display: none`) has nothing to measure. It keeps its last good height and measures again as soon as it is shown, so you do not need to call `grow()` yourself.
:::