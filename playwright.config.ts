// Screenshot tests for the kit's components (pnpm visual:test; pnpm visual:update after an intended change).
// They shoot the docs site, which only exists in development, so they start their own dev server.
import { defineConfig } from '@playwright/test';

const PORT = 5180;

export default defineConfig({
  testDir: 'tests/visual',
  testMatch: '**/*.visual.ts',
  // Baselines differ per OS (font rendering), so each platform keeps its own.
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{arg}{ext}',
  fullyParallel: true,
  workers: 4,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'visual-report' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  },
  expect: {
    // Tolerates anti-aliasing noise, not a moved border or a changed colour.
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide' },
  },
  webServer: {
    command: `corepack pnpm@10.34.7 exec vp dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/docs`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
