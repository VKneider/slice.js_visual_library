// api/index.js — server entrypoint.
//
// Everything the app adds goes between createSliceServer() and start(). The
// framework owns the mechanics (security, static, bundles, SPA fallback, SEO
// head, 404); this app only provides the generated artifacts: seo.json and the
// social cards the image generator writes under public/og/.
//
// `--production` is what `slice start` passes; the framework also honours
// NODE_ENV, so either works when running the file by hand.

import { createSliceServer } from 'slicejs-web-framework/api/framework/server.js';

const production = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const mode = production ? 'production' : 'development';

const { app, start } = createSliceServer({
  mode,
  seo: {
    // Relative paths resolve inside the deployed public/ folder, so the same
    // config works for src/ in development and dist/ in production.
    manifest: 'seo.json',
    images: 'og/manifest.json'
  }
});

await start();

export default app;
