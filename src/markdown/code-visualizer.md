---
title: CodeVisualizer
route: /docs/display/code-visualizer
navLabel: CodeVisualizer
section: Display
group: Code
order: 10
description: CodeVisualizer documentation with syntax highlighting and copy scenarios.
component: CodeVisualizerDocumentation
generate: true
tags: [code, syntax, highlight, display]
---

# CodeVisualizer

## Overview
`CodeVisualizer` displays syntax-highlighted code blocks with a copy-to-clipboard button. Supports JavaScript, HTML, and CSS highlighting with token-based colorization.

## API and Behavior
- Accepts `value` (code string) and `language` (`javascript`, `html`, `css`, or `js`).
- Syntax highlighting is applied client-side via token extraction.
- Copy button writes the raw unformatted code to the clipboard.
- Button shows visual feedback on success or error.

## Basic Usage
```javascript title="Build code visualizer"
const code = await slice.build('CodeVisualizer', {
  value: 'const x = 42;',
  language: 'javascript'
});

this.appendChild(code);
```

## Prop Scenarios
:::script label="JavaScript highlighting" expected="renders JS code with keyword and string colors"
const code = await slice.build('CodeVisualizer', {
  value: `function greet(name) {
  const message = "Hello, " + name;
  console.log(message);
  return message;
}

greet("World");`,
  language: 'javascript'
});

return code;
:::

:::script label="HTML highlighting" expected="renders HTML code with tag and attribute colors"
const code = await slice.build('CodeVisualizer', {
  value: `<div class="container">
  <h1>Title</h1>
  <p>Description here</p>
</div>`,
  language: 'html'
});

return code;
:::

:::script label="CSS highlighting" expected="renders CSS with selector and property colors"
const code = await slice.build('CodeVisualizer', {
  value: `.container {
  display: flex;
  gap: 1rem;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 8px;
}`,
  language: 'css'
});

return code;
:::

:::script label="Unknown language fallback" expected="renders plain escaped code without colors"
const code = await slice.build('CodeVisualizer', {
  value: 'some raw text without highlighting',
  language: 'text'
});

return code;
:::

## Best Practices
:::tip
Use `CodeVisualizer` inside documentation pages or tutorials to show inline code examples with copy support.
:::

## Pitfalls
:::warning
Language must match exactly (`javascript`, `html`, or `css`). Unknown languages render unhighlighted escaped text.
:::
