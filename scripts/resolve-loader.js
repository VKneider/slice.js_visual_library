import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const SRC = path.join(ROOT, 'src');

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('/')) {
    const filePath = path.join(SRC, specifier.slice(1));
    if (fs.existsSync(filePath)) {
      return nextResolve(pathToFileURL(filePath).href, context);
    }
  }
  return nextResolve(specifier, context);
}
