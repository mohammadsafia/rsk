import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const LOCALES = fileURLToPath(new URL('../../src/locales/', import.meta.url));

// Arabic needs more plural forms than English; compare plural keys by their base name.
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

const flatKeys = (value: unknown, prefix = ''): string[] =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, child]) => flatKeys(child, prefix ? `${prefix}.${key}` : key))
    : [prefix.replace(PLURAL_SUFFIX, '')];

const keysOf = (locale: string, file: string) =>
  [...new Set(flatKeys(JSON.parse(readFileSync(`${LOCALES}${locale}/${file}`, 'utf8'))))].sort();

describe('i18n parity', () => {
  for (const file of readdirSync(`${LOCALES}en`).filter((name) => name.endsWith('.json'))) {
    it(`en and ar ${file} define the same keys`, () => {
      expect(keysOf('ar', file)).toEqual(keysOf('en', file));
    });
  }

  it('common defines every Plan B key', () => {
    expect(keysOf('en', 'common.json')).toEqual(
      expect.arrayContaining([
        'moreInfo',
        'pagination.label',
        'pagination.morePages',
        'pagination.previousPage',
        'pagination.nextPage',
        'calendar.previousMonth',
        'calendar.nextMonth',
        'timePicker.placeholder',
        'timePicker.hours',
        'timePicker.minutes',
        'timePicker.period',
        'number.increment',
        'number.decrement',
      ]),
    );
  });
});
