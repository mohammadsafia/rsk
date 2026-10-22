export const TENANT_CONFIG_STORAGE_KEY_PREFIX = 'TENANT_CONFIG' as const;

/** `basePath` from useBasePath(); call it in an effect or handler, never while rendering (it reads the host). */
export const getTenantConfigStorageKey = (basePath: string): string =>
  `${TENANT_CONFIG_STORAGE_KEY_PREFIX}:${window.location.host}:${basePath}`;
