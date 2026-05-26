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

## Notes

- Keep component documentation as the single source of truth in this repository.
- Avoid manual edits to generated files unless the generator requires a fix.
