---
title: Select
route: /docs/input/select
navLabel: Select
section: Input Components
group: Basic
order: 12
description: Combobox with search, groups, multiple selection with chips, creatable options, server-loaded options and virtual scrolling.
component: SelectDocumentation
generate: true
tags: [select, combobox, forms, multiselect, autocomplete]
---

# Select

## Overview
`Select` lets people pick one value, or several, from a list. The list can be searched, grouped, loaded from a server as they type, extended by typing something new, and long enough to need virtual scrolling. The field follows the WAI-ARIA combobox pattern, so it works from the keyboard and with screen readers. The list floats above everything, so a parent with `overflow: hidden` never clips it.

## Options
`options` is an array of strings, numbers or objects:

- `{ value, label }`: `value` is what you get back and `label` is what is shown. `text`, or whatever `visibleProp` names, also works as the label. An object without a `value` uses its `id`, else its label.
- `disabled`, `icon` (an `Icon` name) and `description` (a quieter second line) are optional on any option.
- `{ label, options: [...] }` is a group under a small heading.

## Value
- `selected` is the clean way to read and set it: the option's value for a single select, an array of values for `multiple`, `null` (or `[]`) when empty.
- `selectedOptions` gives you the option objects you passed in, in the order they were picked.
- `value` keeps its old shape for existing code: the option object (single), an array of them (multiple), or `[]` when empty.
- Setting `selected` or `value` accepts any form: a value, an array of values, an option object, or an array of them. The order of the props does not matter; a value given before the options waits for them.
- `onChange(selected, selectedOptions)` fires on every change, with `this` set to the Select. `onOptionSelect` is its older name.
- `open()`, `close()`, `clear()` and `focus()` work from code. `isOpen` tells you whether the list is open.

## Behavior
- **Keyboard**:
  - **↓ / ↑** open the list and move through it, skipping disabled options; **PageUp / PageDown** jump.
  - **Enter** picks the highlighted option. **Escape** closes the list, or clears a `clearable` field.
  - **Tab** leaves.
  - In a field you cannot type in, letters jump to the matching option.
- `searchable` filters as you type. Accents and capitals do not matter ("espa" finds "España"), and the matching text is highlighted.
- `multiple` shows the picks as chips inside the field. Remove one with its ✕, or remove the last one with **Backspace**. The list stays open while you pick. `selectAll` adds a "Select all" row (a dash means some are picked) and `max` caps how many can be picked.
- `creatable` offers "Create …" for text that matches no option. `onCreate(label)` can shape the new option, or return `false` to refuse it.
- `loadOptions(query, { signal })` fetches options from a server. It runs when the list opens and again as the user types (after a short pause), and aborts the previous request. A loading row shows meanwhile. Values given before the options load keep their label.
- Lists longer than 150 options render only the rows in view (`virtual: 'auto'`; `'on'` and `'off'` force it).
- `clearable` adds a ✕ that empties the field.
- `name` writes hidden inputs, so a plain `<form>` submits the value(s).

## Looks
- `variant`: `'outlined'` (default), `'filled'` or `'ghost'`, the same names `Button` uses.
- `size`: `'sm'`, `'md'` (default) or `'lg'`.
- `label` floats above the field once there is a value or the list is open; `placeholder` shows inside the field after that.
- `help` adds a hint under the field. `error` replaces the hint, marks the field invalid (`aria-invalid`) and turns it red. `required` adds an asterisk and `aria-required`.

## Live Preview
:::component name="Select"
{
  "label": "Framework",
  "options": [
    { "value": "slice", "label": "Slice.js" },
    { "value": "react", "label": "React" },
    { "value": "vue", "label": "Vue" }
  ]
}
:::

## Prop Scenarios
:::script label="Searchable, grouped, with descriptions" expected="type to filter; groups keep their headings; France is disabled"
const select = await slice.build('Select', {
  label: 'Country',
  placeholder: 'Type to search',
  searchable: true,
  clearable: true,
  options: [
    {
      label: 'Americas', options: [
        { value: 'ar', label: 'Argentina', description: 'Buenos Aires' },
        { value: 'br', label: 'Brasil', description: 'Brasília' },
        { value: 'mx', label: 'México', description: 'Ciudad de México' },
        { value: 've', label: 'Venezuela', description: 'Caracas' }
      ]
    },
    {
      label: 'Europe', options: [
        { value: 'es', label: 'España', description: 'Madrid' },
        { value: 'fr', label: 'France', description: 'Not available yet', disabled: true }
      ]
    }
  ],
  selected: 've'
});
select.style.maxWidth = '320px';
return select;
:::

:::script label="Multiple with chips, Select all and a limit" expected="picks show as chips; at most three"
const result = document.createElement('p');
const select = await slice.build('Select', {
  label: 'Skills (up to 3)',
  multiple: true,
  searchable: true,
  selectAll: true,
  max: 3,
  options: ['JavaScript', 'TypeScript', 'CSS', 'Node.js', 'Rust', 'Go'],
  selected: ['JavaScript', 'CSS'],
  onChange: (values) => { result.textContent = `Selected: ${values.join(', ') || 'none'}`; }
});
select.style.maxWidth = '360px';
const box = document.createElement('div');
box.style.width = '100%';
box.append(select, result);
return box;
:::

:::script label="Creatable tags" expected="type a new tag and press Enter to create it"
const select = await slice.build('Select', {
  label: 'Tags',
  multiple: true,
  creatable: true,
  options: ['bug', 'feature', 'docs'],
  selected: ['bug'],
  help: 'Type a tag that does not exist and press Enter'
});
select.style.maxWidth = '360px';
return select;
:::

:::script label="Options from a server" expected="typing asks a (simulated) server; Loading… shows meanwhile"
const people = ['Ana López', 'Andrés Pérez', 'Beatriz Ruiz', 'Bruno Díaz', 'Carla Méndez', 'Carlos Rivas', 'Daniela Torres'];
const select = await slice.build('Select', {
  label: 'Assignee',
  placeholder: 'Type a name',
  clearable: true,
  loadOptions: async (query, { signal }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (signal.aborted) return [];
    return people
      .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
      .map((name) => ({ value: name.toLowerCase().replace(/\s+/g, '-'), label: name }));
  }
});
select.style.maxWidth = '320px';
return select;
:::

:::script label="Variants, sizes and states" expected="outlined, filled and ghost; small and large; an error and a hint"
const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px 16px;width:100%';
const options = ['Draft', 'In review', 'Published'];
const fields = [
  { label: 'Outlined', variant: 'outlined', selected: 'Draft' },
  { label: 'Filled', variant: 'filled', selected: 'In review' },
  { label: 'Ghost', variant: 'ghost', selected: 'Published' },
  { label: 'Small', size: 'sm' },
  { label: 'Large', size: 'lg', help: 'A hint under the field' },
  { label: 'Status', required: true, error: 'Choose a status to continue' }
];
for (const props of fields) grid.appendChild(await slice.build('Select', { options, ...props }));
return grid;
:::

:::script label="5,000 options" expected="the list scrolls smoothly; type a letter to jump"
const options = Array.from({ length: 5000 }, (_, i) => ({ value: i + 1, label: `Order #${String(i + 1).padStart(5, '0')}` }));
const select = await slice.build('Select', { label: 'Order', options, searchable: true });
select.style.maxWidth = '320px';
return select;
:::

## Best Practices
:::tip
Use `selected` and `onChange(selected)` in new code: you work with plain values (`'ve'`, `[1, 2]`) instead of option objects.
:::

:::tip
Turn on `searchable` once a list has more than about ten options; nobody wants to scroll through 200 countries.
:::

## Pitfalls
:::warning
`loadOptions` replaces the options on every query. Keep your option values stable between queries (a database id, not an index), or a picked value will not be recognised when it comes back.
:::

:::warning
`value` keeps returning option objects for compatibility. Reading `select.value.value` works for a single select but not for a multiple one; `selected` has no such trap.
:::