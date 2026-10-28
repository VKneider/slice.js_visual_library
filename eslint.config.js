import slice, { nodeGlobals, sliceGlobals } from 'slicejs-cli/eslint-config.js';

export default [
  ...slice,
  // Two corners of this repo deliberately mix Node with browser code: the docs
  // parser embeds browser components (parser/templates), and the OG generator
  // drives a headless browser. Everything else under parser/ and scripts/ stays
  // Node-only.
  {
    files: ['parser/**/*.js'],
    languageOptions: { globals: { ...nodeGlobals, ...sliceGlobals } }
  },
  {
    files: ['scripts/og/**/*.mjs'],
    languageOptions: { globals: { ...nodeGlobals, ...sliceGlobals } }
  }
];
