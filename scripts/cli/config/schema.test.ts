import { describe, expect, it } from 'vite-plus/test';

import { DtoGenConfigSchema } from './schema';

const endpoint = { name: 'api', url: 'https://example.com/swagger.json', outputDir: 'src/types/api' };

describe('DTO generator config schema', () => {
  it('fills every default when only endpoints are given (formatting defaults included)', () => {
    expect(DtoGenConfigSchema.parse({ endpoints: [endpoint] })).toEqual({
      endpoints: [endpoint],
      enumStrategy: 'type-literal',
      formatting: { format: true, lint: true },
      dryRun: false,
    });
  });

  it('maps legacy prettier / eslint keys onto format / lint', () => {
    expect(DtoGenConfigSchema.parse({ endpoints: [endpoint], formatting: { prettier: false, eslint: true } }).formatting).toEqual({
      format: false,
      lint: true,
    });
  });

  it('accepts selected schemas per endpoint, as a list or "all"', () => {
    const parsed = DtoGenConfigSchema.parse({ endpoints: [endpoint], selectedSchemas: { api: ['Patient'], other: 'all' } });
    expect(parsed.selectedSchemas).toEqual({ api: ['Patient'], other: 'all' });
  });
});
