// @vitest-environment happy-dom
import { describe, expect, it } from 'vite-plus/test';

import { getTenantConfigStorageKey } from './StorageKeys';

describe('getTenantConfigStorageKey', () => {
  it('still takes no argument, as apps from before the router adapter call it (the base path defaults to "/")', () => {
    expect(getTenantConfigStorageKey()).toBe(`TENANT_CONFIG:${window.location.host}:/`);
    expect(getTenantConfigStorageKey('/app/')).toBe(`TENANT_CONFIG:${window.location.host}:/app/`);
  });
});
