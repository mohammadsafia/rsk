// tests/visual/components.visual.ts — the first example of every component docs page, light/English and
// dark/Arabic (both themes, both directions). A changed baseline is a review: accept it with pnpm visual:update.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const DOCS = path.resolve('src/component-docs');
const CATEGORIES = ['ui', 'forms', 'shared', 'tables', 'calendar', 'charts'];

/** Every component page's id, from its frontmatter. */
const pages = CATEGORIES.flatMap((category) =>
  readdirSync(path.join(DOCS, category))
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => readFileSync(path.join(DOCS, category, file), 'utf8').match(/^id:\s*['"]?([\w-]+)/m)?.[1])
    .filter((id): id is string => !!id),
).sort();

const COMBOS = [
  { name: 'light-en', theme: 'light', lang: 'en' },
  { name: 'dark-ar', theme: 'dark', lang: 'ar' },
] as const;

/** A fixed "now", so calendars, timelines and relative dates draw the same every run. */
const NOW = new Date('2026-10-13T10:30:00');

for (const combo of COMBOS) {
  test.describe(combo.name, () => {
    test.beforeEach(async ({ page }) => {
      await page.clock.setFixedTime(NOW);
      await page.addInitScript(({ theme, lang }) => {
        localStorage.setItem('vite-ui-theme', JSON.stringify(theme));
        localStorage.setItem('i18nextLng', lang);
      }, combo);
    });

    for (const id of pages) {
      test(id, async ({ page }) => {
        await page.goto(`/docs/components/${id}`, { waitUntil: 'networkidle' });
        const preview = page.locator('[data-slot="docs-example-preview"]').first();
        await expect(preview).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await expect(preview).toHaveScreenshot(`${id}-${combo.name}.png`);
      });
    }
  });
}

test('finds the component pages', () => {
  expect(pages.length).toBeGreaterThan(60);
});
