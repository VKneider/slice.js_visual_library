<div align="center">
  <img src="src/images/Slice.js-logo.png" alt="Slice.js logo" width="150" />
  <h1>Slice.js Visual Library</h1>
  <p>Official Visual Components Library and Documentation Registry for Slice.js</p>
  <p>
    <a href="https://components.slicejs.com"><strong>Explore the docs »</strong></a>
    <br />
    <a href="https://github.com/VKneider/slice.js">Framework Repository</a>
    ·
    <a href="https://github.com/VKneider/slicejs-cli">CLI Repository</a>
    ·
    <a href="https://github.com/VKneider/slice.js_visual_library/issues/new">Report Bug</a>
  </p>
</div>

## About this repository

_Deployment note:_ this repository is configured for Vercel serverless routing through `api/index`.

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
| `npm run run` | Start development server (port 3001) |
| `npm run docs:generate` | Generate documentation pages from markdown |
| `npm run docs:lint-md` | Validate markdown front matter and structure |
| `npm run docs:sync-registry` | Sync registry, index and routes without full regeneration |

## Writing component documentation

Documentation sources live in `src/markdown/` — every official Visual and Service component has a
markdown file. The **single source of truth** for the format (required front matter, supported
`:::` blocks, the `:::script` live-example contract, and generation rules) is:

- **[`src/markdown/parser-rules.md`](src/markdown/parser-rules.md)** — the full contract (also
  rendered in the live docs at `/docs/internal/markdown-parser-rules`)
- **[`src/markdown/_TEMPLATE.md`](src/markdown/_TEMPLATE.md)** — a copy-paste scaffold for a new page

Use the **canonical** component prop names in examples — see
[`COMPONENT_API_STANDARDS.md`](COMPONENT_API_STANDARDS.md). Keep `parser-rules.md` authoritative;
don't duplicate the parser rules here.

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

We welcome contributions to the component library and documentation.

- **Docs workflow** — [CONTRIBUTING.md](CONTRIBUTING.md)
- **Component authoring rules** (prop naming, deprecation/alias policy, CSS encapsulation, a11y) — [COMPONENT_API_STANDARDS.md](COMPONENT_API_STANDARDS.md)

> ⚠️ This repository **is the published component registry** — the CLI downloads components from
> it. Any prop rename is a public API change, so never remove an old prop name without keeping it
> working as a deprecated alias.

### Quick steps (docs)
1. Edit markdown in `src/markdown/`
2. Run `npm run docs:lint-md` to validate
3. Run `npm run docs:generate` to regenerate outputs
4. Preview with `npm run run`
5. Submit a pull request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Links

- 📘 Documentation: https://components.slicejs.com
- 🐙 GitHub: https://github.com/VKneider/slice.js_visual_library
- 🧩 Framework: https://github.com/VKneider/slice.js
- 🛠️ CLI: https://github.com/VKneider/slicejs-cli
