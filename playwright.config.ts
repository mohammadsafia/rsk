// Screenshot tests for the kit's components (pnpm visual:test; pnpm visual:update after an intended change).
// They shoot the docs site, which only exists in development, so they start their own dev server.
import { defineConfig } from '@playwright/test';

// Its own port, never another dev server's: a server left running from another branch would be tested instead.
const PORT = Number(process.env.VISUAL_PORT ?? 5181);

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
    // A few pixels of anti-aliasing noise, not a changed token: threshold is how different one pixel's colour may be
    // (Playwright's default 0.2 lets subtle colour shifts through), maxDiffPixels how many may differ at all. Measured:
    // unchanged code differs by 0 pixels; a button's radius going from 6 to 8px moves 5.
    toHaveScreenshot: { threshold: 0.05, maxDiffPixels: 2, animations: 'disabled', caret: 'hide' },
  },
  webServer: {
    command: `corepack pnpm@10.34.7 exec vp dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/docs`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
