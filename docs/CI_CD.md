# CI/CD for Markdown Parsing and Render Deploy

This project uses GitHub Actions to validate markdown docs, generate artifacts, and trigger Render deploys automatically.

## Workflow

File:
- `.github/workflows/docs-render-cicd.yml`

Triggers:
- Pull Request to `main`
- Push to `main`
- Manual run (`workflow_dispatch`)

Pipeline stages:
1. `npm ci`
2. `npm run docs:lint-md`
3. `npm run docs:generate`

Behavior by event:
- **PR**: fails if generated files changed (forces contributor to commit generated output).
- **Push to main**: commits generated artifacts automatically if needed.
- **Push to main**: triggers Render deploy hook if configured.

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
