// tests/visual/components.visual.ts — every component docs page, light/English and dark/Arabic (both themes, both
// directions): its first example, the open panel for overlays, and the focus ring of the core controls. A changed
// baseline is a review: accept it with pnpm visual:update.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, type Page, test } from '@playwright/test';

const DOCS = path.resolve('src/component-docs');
const CATEGORIES = ['ui', 'forms', 'shared', 'tables', 'calendar', 'charts', 'molecules', 'organisms', 'templates'];

/** Every component page's id, from its frontmatter. */
const pages = CATEGORIES.flatMap((category) =>
  readdirSync(path.join(DOCS, category))
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => readFileSync(path.join(DOCS, category, file), 'utf8').match(/^id:\s*['"]?([\w-]+)/m)?.[1])
    .filter((id): id is string => !!id),
).sort();

/** Pages whose first example is a trigger: the shot is of what it opens (portaled outside the preview). */
const OVERLAYS: Record<string, 'click' | 'hover'> = {
  dialog: 'click',
  'invite-members-dialog': 'click',
  sheet: 'click',
  popover: 'click',
  'dropdown-menu': 'click',
  select: 'click',
  combobox: 'click',
  'confirm-dialog': 'click',
  toast: 'click',
  toaster: 'click',
  tooltip: 'hover',
  'count-tooltip': 'hover',
};
const OPEN_PANEL = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [data-slot="toast"]';

/** Wide components are shot in a wider window, so their last columns aren't cropped. */
const WIDE = /^(data-table|table|calendar-|chart|area-chart|bar-chart|line-chart|scheduler)/;

/** Controls whose keyboard focus ring is part of the design. */
const FOCUSABLE = ['button', 'inputs', 'checkbox', 'switch', 'tabs', 'radio-group'];

const COMBOS = [
  { name: 'light-en', theme: 'light', lang: 'en' },
  { name: 'dark-ar', theme: 'dark', lang: 'ar' },
] as const;

/** A fixed "now", so calendars, timelines and relative dates draw the same every run. */
const NOW = new Date('2026-10-13T10:30:00');
/** Stands in for any image from the internet (avatars), so a shot never depends on the network. */
const IMAGE = path.resolve('public/icon-192.png');

const open = async (page: Page, id: string) => {
  await page.setViewportSize({ width: WIDE.test(id) ? 1680 : 1280, height: 900 });
  await page.goto(`/docs/components/${id}`, { waitUntil: 'networkidle' });
  const preview = page.locator('[data-slot="docs-example-preview"]').first();
  await expect(preview).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return preview;
};

for (const combo of COMBOS) {
  test.describe(combo.name, () => {
    test.beforeEach(async ({ page }) => {
      await page.clock.setFixedTime(NOW);
      await page.route(/^https?:\/\/(?!localhost)/, (route) =>
        route.request().resourceType() === 'image' ? route.fulfill({ path: IMAGE }) : route.abort(),
      );
      await page.addInitScript(({ theme, lang }) => {
        localStorage.setItem('vite-ui-theme', JSON.stringify(theme));
        localStorage.setItem('i18nextLng', lang);
      }, combo);
    });

    for (const id of pages) {
      test(id, async ({ page }) => {
        const preview = await open(page, id);
        const how = OVERLAYS[id];
        if (!how) {
          await expect(preview).toHaveScreenshot(`${id}-${combo.name}.png`);
          return;
        }
        const trigger = preview.locator('[data-slot="tooltip-trigger"], button, [role="combobox"]').first();
        if (how === 'hover') await trigger.hover();
        else await trigger.click();
        const panel = page.locator(OPEN_PANEL).last();
        await expect(panel).toBeVisible();
        await expect(panel).toHaveScreenshot(`${id}-open-${combo.name}.png`);
      });
    }

    for (const id of FOCUSABLE) {
      test(`${id} focus`, async ({ page }) => {
        const preview = await open(page, id);
        // Keyboard focus (what :focus-visible draws a ring for), on the example's first control.
        await preview.locator('button, input, [role="switch"], [role="tab"], [role="radio"], [role="checkbox"]').first().focus();
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Tab');
        await expect(preview).toHaveScreenshot(`${id}-focus-${combo.name}.png`);
      });
    }
  });
}

test('finds the component pages', () => {
  expect(pages.length).toBeGreaterThan(60);
  for (const id of [...Object.keys(OVERLAYS), ...FOCUSABLE]) expect(pages).toContain(id);
});
