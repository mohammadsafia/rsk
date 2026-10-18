import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { formResolver } from './formResolver';

type Form = { amount: number | null; note: string };
const schema = z.object({ amount: z.number({ error: 'Enter an amount' }).gt(0, 'Enter an amount'), note: z.string() });
const options = { fields: {}, shouldUseNativeValidation: false } as const;

describe('formResolver', () => {
  it('validates the form state with the schema and returns its messages', async () => {
    const resolve = formResolver<Form>(schema);
    const empty = await resolve({ amount: null, note: '' }, undefined, options);
    expect(empty.errors.amount?.message).toBe('Enter an amount');
    const ok = await resolve({ amount: 5, note: 'x' }, undefined, options);
    expect(ok.errors).toEqual({});
    expect(ok.values).toEqual({ amount: 5, note: 'x' });
  });
});
