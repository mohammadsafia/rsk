// tests/visual/date-field-typing.visual.ts — typing a date into a FormDatePicker that started with a value, in a real
// browser, key by key, as a person does.
//
// The defect: while a date is half typed the field told the form it had no date (undefined). react-hook-form reads a
// field set to undefined back as the form's default value, so the field saw "a new value from outside" and filled the
// box with the date the form opened with. The first change of a field hid it (the default is the value it already
// held); the second change of the same field was replaced, from its first key, by the opening date.
import { expect, type Page, test } from '@playwright/test';

/** A fixed "now", as in components.visual.ts. */
const NOW = new Date('2026-10-13T10:30:00');

/** The "In a sheet" example's field: "Visit date" opens on 10/16/2026 (MM/dd/yyyy), the form's default value. */
const visitDate = (page: Page) => page.getByRole('dialog', { name: 'Change the visit' }).getByRole('textbox', { name: 'Visit date' });

test.beforeEach(async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(NOW);
  await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/docs/components/form-date');
  // The first page a run opens waits for the dev server to build the docs site, which can take most of a minute.
  const open = page.getByRole('button', { name: 'Change the visit' });
  await expect(open).toBeVisible({ timeout: 60_000 });
  await open.click();
  await expect(visitDate(page)).toHaveValue('10/16/2026');
});

/** Select what the box holds and type `text` one key at a time; returns what the box read after each key. */
async function retype(page: Page, text: string): Promise<string[]> {
  const box = visitDate(page);
  await box.click();
  await box.press('ControlOrMeta+a');
  const seen: string[] = [];
  for (const key of text) {
    await page.keyboard.type(key);
    seen.push(await box.inputValue());
  }
  return seen;
}

test('a date field changed twice keeps what is typed the second time', { tag: '@behaviour' }, async ({ page }) => {
  expect(await retype(page, '10202026')).toEqual(['1', '10', '10/2', '10/20', '10/20/2', '10/20/20', '10/20/202', '10/20/2026']);

  // The second change: every key lands in the box, and none of them brings back the opening date, 10/16/2026.
  expect(await retype(page, '10252026')).toEqual(['1', '10', '10/2', '10/25', '10/25/2', '10/25/20', '10/25/202', '10/25/2026']);

  // Leaving the field keeps it.
  await page.keyboard.press('Tab');
  await expect(visitDate(page)).toHaveValue('10/25/2026');
});

test('a third change, and one after a cleared box, keep what is typed too', { tag: '@behaviour' }, async ({ page }) => {
  await retype(page, '10202026');
  await retype(page, '10252026');
  expect((await retype(page, '11032026')).at(-1)).toBe('11/03/2026');

  // Emptied by the person and typed again: still their date, not the opening one.
  const box = visitDate(page);
  await box.press('ControlOrMeta+a');
  await box.press('Backspace');
  await expect(box).toHaveValue('');
  expect(await retype(page, '10302026')).toEqual(['1', '10', '10/3', '10/30', '10/30/2', '10/30/20', '10/30/202', '10/30/2026']);
});

// The same fault reached the mouse: the clear button gave the form undefined, which read back as the opening date.
test('the clear button, clicked, empties a field that opened with a date', { tag: '@behaviour' }, async ({ page }) => {
  const sheet = page.getByRole('dialog', { name: 'Change the visit' });
  await sheet.getByRole('button', { name: 'Clear' }).click();
  await expect(visitDate(page)).toHaveValue('');
  await expect(sheet.getByRole('button', { name: 'Clear' })).toHaveCount(0);

  // And a day typed after it is the person's.
  expect((await retype(page, '10222026')).at(-1)).toBe('10/22/2026');
});
