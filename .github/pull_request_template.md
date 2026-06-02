## Summary
-

## Scope
- [ ] New component (includes its `<Component>.spec.js` **and** a docs page)
- [ ] Change to an existing component (API / behaviour)
- [ ] Tests only (`*.spec.js` / `*.test.js`)
- [ ] Visual library docs pages (`src/markdown/` and generated outputs)
- [ ] Parser logic (`parser/`)
- [ ] Routes/index sync (`documentationRoutes.generated.js`, `docsIndex.js`, `components.js`)

## Verification
**Tests** (CI gate)
- [ ] `pnpm test` passes (node:test: parser + routes + services)
- [ ] `pnpm run test:e2e` passes (Playwright: component render + behaviour + a11y)
- [ ] Added/updated a `<Component>.spec.js` for any component change

**Docs** (only if touched)
- [ ] `pnpm run docs:lint-md`
- [ ] `pnpm run docs:generate` (generated outputs committed)

## Breaking Changes
- [ ] None
- [ ] Yes (describe below)

> Reminder: this repo is the live registry. Per §7 of `COMPONENT_API_STANDARDS.md`, a public prop
> rename/removal must keep the old name working as a deprecated alias — otherwise it's breaking.

## Screenshots / UI Notes
-

## Additional Context
-
