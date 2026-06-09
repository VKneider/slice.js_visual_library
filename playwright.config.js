import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Keep the browser binary INSIDE the project (node_modules/.../.local-browsers)
// instead of the machine-level cache (~/.cache/ms-playwright). Fully project-local;
// removed when node_modules is removed. Set before any browser launch.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '0';

// Component tests run against the REAL Slice runtime served by the dev server.
// Playwright boots the slicejs dev server via `webServer`. To avoid port
// collisions with a production server (e.g. on the configured port), we read
// sliceConfig.json and offset the port by +5. Override via SLICE_TEST_PORT.
const sliceConfig = JSON.parse(
   readFileSync(resolve(__dirname, 'src/sliceConfig.json'), 'utf-8'),
);
const SLICE_PORT = sliceConfig?.server?.port ?? 3001;
const PORT = Number(process.env.SLICE_TEST_PORT) || (SLICE_PORT + 5);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
   testDir: './',
   testMatch: '**/*.spec.js',
   testIgnore: ['**/node_modules/**', '**/playwright-report/**', '**/test-results/**'],

   fullyParallel: true,
   forbidOnly: !!process.env.CI,
   retries: process.env.CI ? 1 : 0,
   workers: process.env.CI ? 2 : undefined,
   timeout: 30_000,
   expect: { timeout: 5_000 },

   reporter: process.env.CI
      ? [['github'], ['html', { open: 'never' }]]
      : [['list'], ['html', { open: 'never' }]],

   use: {
      baseURL,
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
   },

   projects: [
      // Default gate: DOM + behaviour + a11y. No screenshots, fully deterministic,
      // needs no baseline images. This is what CI runs by default.
      {
         name: 'components',
         grepInvert: /@visual/,
         use: { ...devices['Desktop Chrome'] },
      },
      // Opt-in visual regression. Run with `pnpm run test:e2e:visual`
      // (and `:update` to (re)generate baselines). Fixed viewport for stable shots.
      {
         name: 'visual',
         grep: /@visual/,
         use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
      },
   ],

   webServer: {
      command: `node ./node_modules/slicejs-cli/client.js dev --port ${PORT}`,
      url: `${baseURL}/api/status`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
   },
});
