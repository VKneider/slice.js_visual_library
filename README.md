<div align="center">
  <img src="src/images/Slice.js-logo.png" alt="Slice.js logo" width="150" />
  <h1>Slice.js Visual Library</h1>
  <p>Official Visual Components Library and Documentation Registry for Slice.js</p>
  <p>
    <a href="https://slice-js-docs.vercel.app/docs"><strong>Explore the docs »</strong></a>
    <br />
    <a href="https://github.com/VKneider/slice.js">Framework Repository</a>
    ·
    <a href="https://github.com/VKneider/slicejs-cli">CLI Repository</a>
    ·
    <a href="https://github.com/VKneider/slice.js_visual_library/issues/new">Report Bug</a>
  </p>
</div>

## About this repository

This repository contains the official visual components library for Slice.js. It serves as the source of truth for component documentation, hosting the markdown sources that generate interactive documentation pages with live examples, API tables, and usage guides.

The `slicejs-cli` registry points to this repository to resolve component metadata and documentation.

## Prerequisites

- Node.js >= 20
- npm or pnpm

## Local development

1. **Clone the repository**
   ```bash
   git clone https://github.com/VKneider/slice.js_visual_library.git
   cd slice.js_visual_library
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server** (for local preview)
   ```bash
   npm run run
   ```

## Available commands

| Command | Description |
|---------|-------------|
| `npm run run` | Start development server (port 3000) |
| `npm run docs:generate` | Generate documentation pages from markdown |
| `npm run docs:lint-md` | Validate markdown front matter and structure |
| `npm run docs:sync-registry` | Sync registry, index and routes without full regeneration |

## Writing component documentation

Documentation sources live in `src/markdown/`. Each component has a markdown file with front matter and optional custom blocks.

### Required front matter

```yaml
---
title: Component Name
route: /docs/component-name
section: Components
group: Input
order: 1
component: ComponentName
---
```

### Supported markdown blocks

| Block | Syntax | Description |
|-------|--------|-------------|
| Code | ```` ```language ```` | Syntax-highlighted code block |
| Tip | `:::tip` | Informational callout |
| Warning | `:::warning` | Warning callout |
| Details | `:::details title="Title"` | Expandable accordion |
| Component | `:::component name="MyComp"` | Embed a Slice.js component |
| Script | `:::script label="..." expected="..."` | Code block + live preview |
| HTML | `:::html` | Direct HTML injection |
| Tables | Standard markdown | Rendered as styled tables |

### Live examples with `:::script`

Script blocks render both the source code and an interactive live preview:

```markdown
:::script label="Basic usage" expected="Renders a button with label"
const btn = await slice.build('Button', { label: 'Click me' });
mount(btn);
:::
```

The `mount(node)` helper appends the rendered node to the preview area.

## Parser

The built-in parser converts markdown files into Slice.js documentation components:

```bash
npm run docs:generate
```

This:
- Generates JS, HTML, and CSS files in `src/Components/DocumentationPages/<Component>/`
- Updates route definitions in `src/routes.js`
- Updates the docs index at `src/Components/AppComponents/ComponentsPage/docsIndex.js`
- Syncs the component registry at `src/Components/components.js`
- Copies global styles and shared components

### Validation

```bash
npm run docs:lint-md
```

Validates that all markdown files have the required front matter fields (`title`, `route`, `section`, `group`, `order`, `component`) and flags manual props tables that should be removed.

## Project structure

```
slice.js_visual_library/
├── src/
│   ├── markdown/                    # Markdown documentation sources
│   ├── Components/
│   │   ├── DocumentationPages/      # Generated documentation components
│   │   ├── AppComponents/           # Shared app components
│   │   └── components.js           # Component registry
│   ├── routes.js                    # Main routes (auto-generated)
│   ├── App/                         # Application shell
│   └── Styles/                      # Global styles
├── parser/                          # Markdown → component parser
│   ├── index.js                     # Parser entry point
│   ├── lib/                         # markdownParser, generator, docsIndex, report, routesSync
│   ├── templates/                   # DocumentationBase.css, CopyMarkdownMenu
│   └── tests/                       # Parser tests
└── api/                             # API server
```

## Contributing

We welcome contributions to the component library and documentation. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full docs workflow.

### Quick steps
1. Edit markdown in `src/markdown/`
2. Run `npm run docs:lint-md` to validate
3. Run `npm run docs:generate` to regenerate outputs
4. Preview with `npm run run`
5. Submit a pull request

## License

Distributed under the ISC License. See `LICENSE` for more information.

## Links

- 📘 Documentation: https://slice-js-docs.vercel.app/docs
- 🐙 GitHub: https://github.com/VKneider/slice.js_visual_library
- 🧩 Framework: https://github.com/VKneider/slice.js
- 🛠️ CLI: https://github.com/VKneider/slicejs-cli
