---
title: Select
route: /docs/input/select
navLabel: Select
section: Input Components
group: Basic
order: 12
description: Select component documentation with practical setup examples.
component: SelectDocumentation
generate: true
tags: [select, forms]
---

# Select

## Overview
`Select` supports single/multiple options, custom display property and callback on selection.

## Core Behavior
- `Select` supports single and multiple selection flows from a structured options source.
- `visibleProp` maps option objects to user-facing labels without reshaping backend payloads.
- Use the scenarios below to validate selection behavior in forms and filter toolbars.

## Search, clear & keyboard
- `searchable` (boolean) — type into the field to filter options by their `visibleProp` text; a
  "No results" row appears when nothing matches. `placeholder` sets the hint shown while searching.
- `clearable` (boolean) — shows a clear button once something is selected; clicking it resets the
  value and fires `onChange`.
- Keyboard: **↑/↓** move the highlight, **Enter** selects the highlighted option (or toggles the menu),
  **Home/End** jump to the first/last option, **Esc** closes. `aria-expanded` / `aria-selected` are kept
  in sync.

## Live Preview
:::component name="Select"
{
  "label": "Role",
  "visibleProp": "label",
  "options": [
    {
      "label": "Admin",
      "value": "admin"
    },
    {
      "label": "Editor",
      "value": "editor"
    },
    {
      "label": "Viewer",
      "value": "viewer"
    }
  ]
}
:::

## Practical Setups
:::script label="Searchable + clearable country picker" expected="type to filter, clear button resets"
const select = await slice.build('Select', {
  label: 'Country',
  searchable: true,
  clearable: true,
  placeholder: 'Type to search…',
  visibleProp: 'name',
  options: [
    { name: 'Argentina', code: 'AR' },
    { name: 'Brazil', code: 'BR' },
    { name: 'Canada', code: 'CA' },
    { name: 'Denmark', code: 'DK' },
    { name: 'Egypt', code: 'EG' }
  ]
});

return select;
:::

:::script label="User role selector" expected="single select for role assignment"
const select = await slice.build('Select', {
  label: 'Role',
  visibleProp: 'label',
  options: [
    { label: 'Owner', value: 'owner' },
    { label: 'Editor', value: 'editor' },
    { label: 'Viewer', value: 'viewer' }
  ]
});

return select;
:::

:::script label="Tag picker (multiple)" expected="multi-select setup for content tags"
const select = await slice.build('Select', {
  label: 'Tags',
  multiple: true,
  visibleProp: 'label',
  options: [
    { label: 'Frontend', id: 1 },
    { label: 'Backend', id: 2 },
    { label: 'Documentation', id: 3 },
    { label: 'Release', id: 4 }
  ]
});

return select;
:::

:::script label="Select inside filter row" expected="select combined with search + action"
const row = document.createElement('div');

const search = await slice.build('Input', {
  placeholder: 'Search docs',
  type: 'text'
});

const select = await slice.build('Select', {
  label: 'Section',
  visibleProp: 'label',
  options: [
    { label: 'All', key: 'all' },
    { label: 'Input', key: 'input' },
    { label: 'Layout', key: 'layout' }
  ]
});

const apply = await slice.build('Button', {
  value: 'Apply'
});

row.appendChild(search);
row.appendChild(select);
row.appendChild(apply);
return row;
:::

:::script label="Controlled default selection" expected="value can be initialized from option objects"
const options = [
  { label: 'Daily', key: 'daily' },
  { label: 'Weekly', key: 'weekly' },
  { label: 'Monthly', key: 'monthly' }
];

const select = await slice.build('Select', {
  label: 'Report cadence',
  visibleProp: 'label',
  options
});

select.value = [options[1]];
return select;
:::

:::script label="Multi-select + submit action" expected="selected values can be consumed by a follow-up action"
const options = [
  { label: 'Frontend', id: 'fe' },
  { label: 'Backend', id: 'be' },
  { label: 'Design', id: 'design' }
];

const picker = await slice.build('Select', {
  label: 'Team roles',
  multiple: true,
  visibleProp: 'label',
  options
});

const submit = await slice.build('Button', {
  value: 'Save roles',
  onClick: () => {
    const selected = picker.value;
    if (Array.isArray(selected)) {
      console.log('Selected roles:', selected.map((item) => item.label));
    }
  }
});

const host = document.createElement('div');
host.appendChild(picker);
host.appendChild(submit);
return host;
:::
