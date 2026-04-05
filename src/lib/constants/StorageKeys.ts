export const TENANT_CONFIG_STORAGE_KEY_PREFIX = 'TENANT_CONFIG' as const;

export const getTenantConfigStorageKey = (): string => {
  const host = window.location.host;
  const baseUrl = import.meta.env.BASE_URL;
  return `${TENANT_CONFIG_STORAGE_KEY_PREFIX}:${host}:${baseUrl}`;
};
