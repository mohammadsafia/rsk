import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { formResolver } from './formResolver';
import { optionalEmail } from './schemas';

const schema = z.object({ email: optionalEmail('Enter a valid email address') });
const resolve = formResolver<{ email: string }>(schema);
const options = { fields: {}, shouldUseNativeValidation: false } as const;

describe('optionalEmail', () => {
  it('accepts an empty box and a valid address (trimmed)', async () => {
    expect((await resolve({ email: '' }, undefined, options)).errors).toEqual({});
    expect((await resolve({ email: '  sara@clinic.jo ' }, undefined, options)).values).toEqual({ email: 'sara@clinic.jo' });
  });

  it('shows our message for an invalid address, never a generic union error', async () => {
    const result = await resolve({ email: 'sara@' }, undefined, options);
    expect(result.errors.email?.message).toBe('Enter a valid email address');
  });
});
