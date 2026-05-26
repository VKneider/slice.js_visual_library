# Contributing Docs

Quick guide for adding or updating component documentation in `slice.js_visual_library`.

## 1) Create or update markdown
- Location: `src/markdown/`
- Use `_TEMPLATE.md` as base.
- Keep routes under `/docs/...`.

## 2) Required front matter
Every generated page must include:
- `title`
- `route`
- `section`
- `group`
- `order`
- `component`

## 3) Write practical examples
- Prefer real use cases over synthetic tests.
- Use `:::script` blocks for **code + live result** examples.
- Return a node from scripts whenever possible.

## 4) Use supported blocks
- Headings, paragraphs, lists
- Fenced code blocks
- Tables
- `:::tip`, `:::warning`, `:::details`
- `:::component`
- `:::script`

## 5) Validate markdown
```bash
npm run docs:lint-md
```

## 6) Generate docs artifacts
```bash
npm run docs:generate
```

This updates:
- `src/Components/DocumentationPages/...`
- `src/Components/AppComponents/ComponentsPage/docsIndex.js`
- `src/Components/AppComponents/ComponentsPage/documentationRoutes.generated.js`
- `src/Components/components.js`
- `src/Styles/DocumentationBase.css`

## 7) Ensure route mapping exists
- Verify `src/routes.js` includes your `/docs/...` paths mapped to `ComponentsPage`.

## 8) Check visual dependencies
- If docs use components like `Table`, `CodeVisualizer`, etc., ensure they are present and registered in `src/Components/components.js`.

## 9) Manual smoke check
- Open app and navigate to your docs route.
- Confirm:
  - code block renders
  - live preview renders
  - no runtime errors in console

## 10) Keep docs professional
- Avoid heavy nested container styling in examples.
- Favor clean spacing and readable setups in light mode.
- Keep examples concise and production-oriented.
