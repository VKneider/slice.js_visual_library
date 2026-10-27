// api/index.js — server entrypoint.
//
// Everything the app adds goes between createSliceServer() and start(). The
// framework owns the mechanics (security, static, bundles, SPA fallback, SEO
// head, 404); this app only provides the content: see api/seo.js.
//
// `--production` is what `slice start` passes; the framework also honours
// NODE_ENV, so either works when running the file by hand.

import { createSliceServer } from 'slicejs-web-framework/api/framework/server.js';
import { loadSeoManifest } from './seo.js';

const production = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const mode = production ? 'production' : 'development';

const { app, start } = createSliceServer({
  mode,
  seo: { manifest: loadSeoManifest(production ? 'dist' : 'src') }
});

await start();

export default app;
