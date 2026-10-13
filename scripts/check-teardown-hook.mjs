// Fails if any component declares a teardown method the framework will never call.
//
// The framework invokes exactly one hook: `beforeDestroy()`. A method named
// `destroy()` looks like it works and silently never runs — so its listeners,
// timers and registry entries outlive the component forever. This repo shipped
// that mistake three times before it was caught by review, which means review
// is not enough.
//
// Run via `pnpm run check:teardown`, and as part of `pnpm run test:gate`.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', 'src', 'Components');

// Names a reader would reasonably mistake for the framework's teardown hook.
// Deliberately NARROW:
//   - `dispose` is the Three.js convention, not a Slice one (kit/targets.js).
//   - `cleanup` is almost always a private helper the hook calls into —
//     ToolTip.cleanup() is invoked from beforeDestroy and is correct.
// Only the names that genuinely read as "the framework calls this" are listed.
const DEAD_HOOKS = ['destroy', 'willDestroy', 'unmount'];

// `beforeDestroy` is fine. A private `_destroy` helper is fine (not a hook).
// A `destroy()` that only delegates to another object is someone else's API.
const DECLARATION = new RegExp(
   String.raw`^\s{2,}(?:async\s+)?(?:_?${DEAD_HOOKS.join(String.raw`|_?`)})\s*\(\s*\)\s*\{`,
   'm'
);

// The file itself is allowed to mention the names in prose.
function isCommentOnlyLine(line) {
   const trimmed = line.trim();
   return (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('/*')
   );
}

async function* walk(dir) {
   for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
         yield* walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
         yield full;
      }
   }
}

const offenders = [];

for await (const file of walk(ROOT)) {
   const source = await readFile(file, 'utf8');
   const lines = source.split('\n');

   lines.forEach((line, index) => {
      if (isCommentOnlyLine(line)) return;
      if (!DECLARATION.test(line)) return;

      // `slice.controller.destroyComponent` / `service.destroy()` are calls,
      // not declarations: require the name to be followed by an empty paren
      // pair and an opening brace, which the regex above already enforces.
      offenders.push({
         file: path.relative(path.resolve(import.meta.dirname, '..'), file),
         line: index + 1,
         text: line.trim(),
      });
   });
}

if (offenders.length > 0) {
   console.error('\n  ✗ Found teardown methods the framework never calls.\n');
   for (const o of offenders) {
      console.error(`    ${o.file}:${o.line}  ${o.text}`);
   }
   console.error(
      '\n  The controller invokes only `beforeDestroy()`. Rename these, or the cleanup\n' +
      '  silently never runs and the component leaks its listeners and registry entry.\n'
   );
   process.exit(1);
}

console.log('OK - every teardown hook is named beforeDestroy().');
