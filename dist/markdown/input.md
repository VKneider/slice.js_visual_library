---
title: Input
route: /docs/input/input
navLabel: Input
section: Input Components
group: Basic
order: 11
description: Input component documentation with practical setup examples.
component: InputDocumentation
generate: true
tags: [input, forms]
---

# Input

## Overview
`Input` supports placeholder, value, type, required, disabled, secret and validation conditions.

## Core Behavior
- `Input` handles standard text entry, typed inputs, and optional required-state feedback.
- Password flows can expose/hide value with `secret` while preserving form semantics.
- Validation behavior is scenario-driven; use script blocks to verify condition checks in realistic forms.

## Basic Usage
```javascript title="Build input"
const input = await slice.build('Input', {
  placeholder: 'Email address',
  type: 'email',
  required: true
});

this.appendChild(input);
```

## Practical Setups
:::script label="Login form fields" expected="email + password fields with proper input types"
const wrapper = document.createElement('div');

const email = await slice.build('Input', {
  placeholder: 'Email',
  type: 'email',
  required: true
});

const password = await slice.build('Input', {
  placeholder: 'Password',
  type: 'password',
  secret: true,
  required: true
});

wrapper.appendChild(email);
wrapper.appendChild(password);
return wrapper;
:::

:::script label="Search + filter toolbar" expected="search input paired with select control"
const row = document.createElement('div');

const search = await slice.build('Input', {
  placeholder: 'Search components',
  type: 'text'
});

const category = await slice.build('Select', {
  label: 'Category',
  visibleProp: 'label',
  options: [
    { label: 'All', value: 'all' },
    { label: 'Input', value: 'input' },
    { label: 'Layout', value: 'layout' }
  ]
});

row.appendChild(search);
row.appendChild(category);
return row;
:::

:::script label="Validation ready email field" expected="input with regex conditions and status button"
const wrapper = document.createElement('div');

const email = await slice.build('Input', {
  placeholder: 'Work email',
  required: true,
  conditions: {
    regex: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
  }
});

const validate = await slice.build('Button', {
  value: 'Validate',
  onClickCallback: () => {
    email.validateValue();
  }
});

wrapper.appendChild(email);
wrapper.appendChild(validate);
return wrapper;
:::

:::script label="Disabled prefilled field" expected="readonly-like field for immutable values"
const input = await slice.build('Input', {
  placeholder: 'Workspace ID',
  value: 'SLC-WS-0021',
  disabled: true
});

return input;
:::

:::script label="API key input with reveal" expected="secret field can be toggled in secure workflows"
const apiKey = await slice.build('Input', {
  placeholder: 'API Key',
  type: 'password',
  secret: true,
  required: true
});

return apiKey;
:::

:::script label="Quick create form row" expected="two inputs and action button compose a compact form"
const host = document.createElement('div');

const name = await slice.build('Input', {
  placeholder: 'Project name',
  type: 'text',
  required: true
});

const slug = await slice.build('Input', {
  placeholder: 'project-slug',
  type: 'text'
});

const create = await slice.build('Button', {
  value: 'Create'
});

host.appendChild(name);
host.appendChild(slug);
host.appendChild(create);
return host;
:::
