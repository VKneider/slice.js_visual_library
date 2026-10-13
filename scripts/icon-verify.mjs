import * as m from '../src/Components/Visual/Icon/icons.generated.js';

const legacy = m.LEGACY_NODES;
const values = Object.values(legacy);
console.log('names total          :', m.NAMES.length);
console.log('legacy entries       :', values.length);
console.log('authoring debris left:', values.filter((v) => /<style|<title|\sid=|\sclass=/.test(v)).length);
console.log('hard-coded hex fills :', values.filter((v) => /fill="#[0-9a-f]{3}/i.test(v)).length);
console.log('non-currentColor fill:', values.filter((v) => /fill="#|fill="#|rgb\(/i.test(v)).length);
for (const k of ['sliceLogo', 'github', 'apple']) {
  console.log(`\n${k} =>`, String(legacy[k]).slice(0, 160));
}