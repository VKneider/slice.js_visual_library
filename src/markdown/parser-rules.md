---
title: Markdown Parser Rules
route: /docs/internal/markdown-parser-rules
navLabel: Parser Rules
section: Internal
group: Documentation
order: 1
description: Contract, template, and generation rules for Slice.js documentation pages.
component: MarkdownParserRulesDocumentation
generate: true
tags: [docs, parser, rules]
---

# Markdown Parser Rules

## Scope
Documentation markdown files live in `src/markdown/` and are converted into Slice.js components in `src/Components/DocumentationPages/`.

## Required Front Matter
Every markdown file must include:

| Field | Required | Example |
| --- | --- | --- |
| `title` | yes | `Button` |
| `route` | yes | `/docs/input/button` |
| `section` | yes | `Input Components` |
| `group` | yes | `Basic` |
| `order` | yes | `10` |
| `component` | yes | `ButtonDocumentation` |

If any required field is missing, `npm run docs:lint-md` fails.

## Supported Blocks
- Headings, paragraphs, lists
- Fenced code blocks -> `CodeVisualizer`
- Tables -> `Table`
- `:::tip` / `:::warning`
- `:::details title="..."`
- `:::component name="Button"` with JSON props body
- `:::script ...` for interactive prop scenarios

## Script Scenario Contract
Use script blocks to validate component props through runnable scenarios:

```text
:::script label="scenario name" expected="expected outcome"
// JavaScript body with access to:
// component (documentation component instance)
// slice
// document
:::
```

The parser renders a **Run** button for each script and reports PASS/FAIL in the page.

## Registry and Styles
- Generated components are added to `src/Components/components.js` with category `DocumentationPages`.
- `CopyMarkdownMenu` is synced to `src/Components/AppComponents/CopyMarkdownMenu/`.
- Global docs style is synced to `src/Styles/DocumentationBase.css`.

## SEO Artifacts
`docs:generate` also writes two files from the same front matter, so they can never drift:

- `src/public/sitemap.xml` — one `<url>` per **real** page (the generated `docRoutes` plus `/`,
  `/docs` and `/theme-creator`), never a section index that has no page. `<lastmod>` is the
  markdown file's last **commit** date (not its mtime), so a fresh clone does not rewrite it.
- `src/public/seo.json` — per-route `title`, `description`, `robots`, `sitemap` and `jsonLd`.
  Internal routes (`/__test`, `/playground`, `/game`, `/404`) carry `robots: false` so they get
  served without being indexed, and the same file is what the framework's `seo` option reads.

Both are generated: edit `parser/lib/seo.js` or the front matter, never the XML/JSON by hand.
`parser/tests/seo.test.js` fails when the committed sitemap does not match the generated routes.

## Commands
```bash
npm run docs:lint-md
npm run docs:generate
npm run docs:sync-registry
```
