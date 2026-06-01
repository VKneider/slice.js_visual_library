# Contributing

## Docs workflow

1. Edit markdown sources in `src/markdown/`.
2. Run markdown validation:

```bash
npm run docs:lint-md
```

3. Regenerate documentation outputs:

```bash
npm run docs:generate
```

4. Run parser tests:

```bash
node --test parser/tests/index.test.js
```

5. Review generated changes in:
   - `src/Components/DocumentationPages/`
   - `src/Components/AppComponents/ComponentsPage/docsIndex.js`
   - `src/Components/AppComponents/ComponentsPage/documentationRoutes.generated.js`
   - `src/Components/components.js`

6. Open a PR using `.github/pull_request_template.md` and complete the verification checklist.

## Component standards

When adding or modifying components, follow **[`COMPONENT_API_STANDARDS.md`](./COMPONENT_API_STANDARDS.md)**:
prop naming (`onClick` / `onChange`, `customColor: { background, text, accent }`), the
backward-compatible deprecation/alias pattern, CSS encapsulation under the element tag,
lifecycle/cleanup, and the accessibility baseline. New or changed components should pass its
§13 checklist.

> ⚠️ This repository **is the published component registry** — the CLI downloads components
> from it. Any prop rename is a public API change, so never remove an old prop name without
> keeping it working as a deprecated alias (see §7).

## Notes

- Keep component documentation as the single source of truth in this repository.
- Avoid manual edits to generated files unless the generator requires a fix.
