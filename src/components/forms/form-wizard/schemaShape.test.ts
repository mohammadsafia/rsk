// @vitest-environment happy-dom
// src/components/forms/form-wizard/schemaShape.test.ts
import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { schemaShape } from './FormWizard';

describe('schemaShape sees the fields behind wrappers', () => {
  const base = z.object({ name: z.string(), phone: z.string() });
  it.each([
    ['a plain object', base],
    ['a refined object', base.refine(() => true)],
    ['a transformed object', base.transform((value) => value)],
  ])('%s', (_, schema) => {
    expect(Object.keys(schemaShape(schema) ?? {})).toEqual(['name', 'phone']);
  });

  it('nothing for a non-object schema', () => {
    expect(schemaShape(z.string())).toBeUndefined();
  });
});
