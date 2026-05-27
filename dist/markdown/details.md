---
title: Details
route: /docs/layout/details
navLabel: Details
section: Layout
group: Containers
order: 21
description: Details component documentation with collapsible content scenarios.
component: DetailsDocumentation
generate: true
tags: [details, disclosure, layout]
---

# Details

## Overview
`Details` renders expandable sections for progressive disclosure of content.

## Core Behavior
- `title` defines the summary header.
- `text` provides the default expanded description body.
- `addDetail(node)` appends richer custom content into the expanded area.

## Basic Usage
```javascript title="Build details"
const details = await slice.build('Details', {
  title: 'What is included?',
  text: 'Source code, tests, and docs.'
});

this.appendChild(details);
```

## Prop Scenarios
:::script label="faq item" expected="details renders title and expandable answer"
const details = await slice.build('Details', {
  title: 'Can I use this in production?',
  text: 'Yes, this component is intended for production usage.'
});

return details;
:::

:::script label="details with custom node" expected="addDetail appends custom structured content"
const details = await slice.build('Details', {
  title: 'Release checklist',
  text: 'Main steps before deployment.'
});

const list = document.createElement('ul');
['Run tests', 'Generate docs', 'Verify routes'].forEach((item) => {
  const li = document.createElement('li');
  li.textContent = item;
  list.appendChild(li);
});

details.addDetail(list);
return details;
:::

:::script label="multiple details blocks" expected="independent disclosure blocks can coexist"
const host = document.createElement('div');

const billing = await slice.build('Details', {
  title: 'Billing policy',
  text: 'Invoices are generated monthly.'
});

const support = await slice.build('Details', {
  title: 'Support policy',
  text: 'Support available Monday to Friday.'
});

host.appendChild(billing);
host.appendChild(support);
return host;
:::
