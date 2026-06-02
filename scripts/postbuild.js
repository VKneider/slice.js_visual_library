import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const DIST = path.join(ROOT, 'dist');

const BUNDLES_DIR = path.join(DIST, 'bundles');
const COMPONENT_DIR = path.join(DIST, 'Components', 'AppComponents', 'ComponentsPage');

const filesToCopy = [
  'docsIndex.js',
  'documentationRoutes.generated.js',
];

for (const file of filesToCopy) {
  const src = path.join(COMPONENT_DIR, file);
  const dest = path.join(BUNDLES_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✅ Copied ${file} to dist/bundles/`);
  } else {
    console.warn(`  ⚠️ ${file} not found at ${src}`);
  }
}
