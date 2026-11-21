// tests/visual/calendar-keyboard.visual.ts — the calendar's month buttons, pressed with the keyboard in a real browser.
// It lives with the screenshot tests because they are the kit's tests that run in a browser (pnpm visual:test): the
// fault depends on where the browser puts the focus when a popover opens inside a sheet, which happy-dom does not do.
import { expect, type Page, test } from '@playwright/test';

/** A fixed "now", as in components.visual.ts. */
const NOW = new Date('2026-10-13T10:30:00');

const focused = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName);
const grid = (page: Page) => page.locator('[data-slot="calendar"] [role="grid"]');

test.beforeEach(async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(NOW);
  await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/docs/components/form-date');

  // FormDatePicker's "In a sheet" example (visit date 16 Oct 2026): open the sheet, then the calendar, by keyboard.
  // The first page a run opens waits for the dev server to build the docs site, which can take most of a minute.
  const open = page.getByRole('button', { name: 'Change the visit' });
  await expect(open).toBeVisible({ timeout: 60_000 });
  await open.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Change the visit' })).toBeVisible();
  for (let i = 0; i < 6 && (await focused(page)) !== 'Open calendar'; i++) await page.keyboard.press('Tab');
  expect(await focused(page)).toBe('Open calendar');
  await page.keyboard.press('Enter');
  await expect(grid(page)).toHaveAttribute('aria-label', 'October 2026');
});

// A keyboard user presses "Next month" to look ahead, then again. The focus must stay on the button: when the calendar
// sent it into the new month's days, the second Enter picked a day the person never chose and closed the calendar.
test('"Next month" pressed with Enter keeps the focus, so it can be pressed again', async ({ page }) => {
  await page.keyboard.press('Tab');
  expect(await focused(page)).toBe('Next month');

  await page.keyboard.press('Enter');
  await expect(grid(page)).toHaveAttribute('aria-label', 'November 2026');
  expect(await focused(page)).toBe('Next month');

  await page.keyboard.press('Enter');
  await expect(grid(page)).toHaveAttribute('aria-label', 'December 2026');
  expect(await focused(page)).toBe('Next month');
});

test('"Previous month" pressed with Enter keeps the focus, so it can be pressed again', async ({ page }) => {
  expect(await focused(page)).toBe('Previous month');

  await page.keyboard.press('Enter');
  await expect(grid(page)).toHaveAttribute('aria-label', 'September 2026');
  expect(await focused(page)).toBe('Previous month');

  await page.keyboard.press('Enter');
  await expect(grid(page)).toHaveAttribute('aria-label', 'August 2026');
  expect(await focused(page)).toBe('Previous month');
});

// The days still take the focus when the person moves through them: an arrow key past the month's end shows the next
// month with the focus on its day.
test('the arrow keys still carry the focus from day to day, across a month', async ({ page }) => {
  for (let i = 0; i < 6 && !((await focused(page)) ?? '').endsWith('2026'); i++) await page.keyboard.press('Tab');
  expect(await focused(page)).toBe('Friday, October 16, 2026');

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(grid(page)).toHaveAttribute('aria-label', 'October 2026');
  expect(await focused(page)).toBe('Friday, October 30, 2026');

  await page.keyboard.press('ArrowDown');
  await expect(grid(page)).toHaveAttribute('aria-label', 'November 2026');
  expect(await focused(page)).toBe('Friday, November 6, 2026');
});
