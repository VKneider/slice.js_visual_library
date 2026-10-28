import slice, { nodeGlobals } from 'slicejs-cli/eslint-config.js';

export default [
  ...slice,
  // The docs pipeline (parser/ and scripts/) runs in Node; the app does not.
  {
    files: ['parser/**/*.js'],
    languageOptions: { globals: nodeGlobals }
  }
];
