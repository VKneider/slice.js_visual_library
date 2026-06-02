# CI/CD

This project uses GitHub Actions to run the test suites, validate markdown docs, generate
artifacts, and trigger Render deploys automatically. There are two workflows:

1. **Component & logic tests** (`component-tests.yml`) — the PR quality gate.
2. **Docs parse + render deploy** (`docs-render-cicd.yml`) — validates/generates docs and deploys.

## Component & logic tests workflow

File:
- `.github/workflows/component-tests.yml`

Triggers:
- Pull Request to `master`
- Push to `master`
- Manual run (`workflow_dispatch`)

Uses **pnpm** (the project's pinned package manager). Pipeline stages:
1. `pnpm install --frozen-lockfile`
2. `pnpm test` — node:test (parser, routes, services)
3. `pnpm exec playwright install --with-deps chromium`
4. `pnpm run test:e2e` — Playwright component tests. Playwright's `webServer` auto-starts the dev
   server (`pnpm run dev`, port 3001) before the run and stops it after.

This is the **PR gate**: a PR stays red until both suites pass. The Playwright HTML report is
uploaded as a build artifact for inspection.

> The visual-regression project (`@visual` screenshots) is opt-in and **not** part of this gate —
> baselines are environment-sensitive and should be generated in a deterministic environment.

## Docs parse + render deploy workflow

File:
- `.github/workflows/docs-render-cicd.yml`

Triggers:
- Pull Request to `master`
- Push to `master`
- Manual run (`workflow_dispatch`)

Pipeline stages:
1. `npm ci`
2. `npm run docs:lint-md`
3. `npm run docs:generate`

Behavior by event:
- **PR**: fails if generated files changed (forces contributor to commit generated output).
- **Push to `master`**: commits generated artifacts automatically if needed.
- **Push to `master`**: triggers Render deploy hook if configured.

## Required Secret

Add repository secret:
- `RENDER_DEPLOY_HOOK_URL`

How to get it:
1. Open your Render service.
2. Go to **Settings** -> **Deploy Hook**.
3. Create/copy deploy hook URL.
4. In GitHub repo: **Settings** -> **Secrets and variables** -> **Actions** -> add secret.

## Notes

- Generated files include docs components, docs index/routes, and synced styles.
- If you add new markdown files under `src/markdown`, CI validates and generates automatically.
- Keep routes in `src/routes.js` aligned with `/docs/...` paths used by markdown front matter.
