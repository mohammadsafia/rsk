import axios, { AxiosError, type AxiosInstance, type AxiosResponse, HttpStatusCode, type InternalAxiosRequestConfig } from 'axios';
import { store } from 'stores';
import { APP_CONFIGURATIONS } from 'config';
import { getAccessToken } from 'api';
import { SnackbarUtils, triggerLogout } from 'utils';
import { AUTH } from 'app-constants';
import { getIsLoggingOut } from 'hooks/auth/useLogout';

import type { ApiError } from 'types';

const sleep = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

const instance: AxiosInstance = axios.create();

instance.defaults.baseURL = APP_CONFIGURATIONS.VITE_APP_BASE_URL;

instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();

  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

// Append the API version to the request URL
instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.apiVersion) {
    const url = new URL(config.url!, window.location.origin);

    url.searchParams.set('api-version', config.apiVersion.toString());

    config.url = url.toString().replace(window.location.origin, '');
  }

  return config;
});

instance.interceptors.response.use(
  async (response) => {
    if (import.meta.env.MODE === 'development') {
      await sleep(500);
    }
    return response;
  },
  (error: AxiosError) => {
    const { data, status } = error?.response as AxiosResponse<ApiError>;

    console.info('🌐 [AXIOS INTERCEPTOR] Error response:', {
      status,
      url: error?.config?.url,
      method: error?.config?.method,
      isLoggingOut: getIsLoggingOut(),
    });

    // Don't trigger logout if we're already in the logout process
    // This prevents infinite loops when logout is in progress
    if (getIsLoggingOut()) {
      console.info('⏸️ [AXIOS] Ignoring error during logout:', status);
      return Promise.reject(data);
    }
    
    const isTenantError = data?.code?.startsWith('Tenant');

    switch (status) {
      case HttpStatusCode.Unauthorized: {
        if (isTenantError) {
          // Tenant issue - show descriptive message and logout
          console.warn("🔒 [AXIOS] 401 Tenant error:", data?.code);
          SnackbarUtils.error(data?.message);
          triggerLogout().catch(console.error);
        } else {
          // Check if this is authorization (permissions) or authentication (token) issue
          const message = data?.message?.toLowerCase() || '';
          const isAuthorizationError =
            message.includes('permission') ||
            message.includes('authorized') ||
            message.includes('not allowed') ||
            message.includes('access denied');

          if (isAuthorizationError) {
            // Authorization failure - user is authenticated but lacks permissions
            // Don't logout, just show error
            console.warn("🔒 [AXIOS] 401 Authorization failure (insufficient permissions)");
            SnackbarUtils.error("You don't have permission to perform this action");
          } else {
            // Authentication failure - token expired or invalid
            // Trigger logout
            console.warn("🔒 [AXIOS] 401 Authentication failure - triggering logout");
            triggerLogout().catch(console.error);
            SnackbarUtils.error("Your session has expired. Please login again.");
          }
        }
        break;
      }
      case HttpStatusCode.Forbidden: {
        if (isTenantError) {
          // Tenant user disabled or deleted - show descriptive message and logout
          console.warn("🔒 [AXIOS] 403 Tenant error:", data?.code);
          SnackbarUtils.error(data?.message);
          triggerLogout().catch(console.error);
        } else if (data.code === "Forbidden" && data.message.includes(AUTH.YOUR_ACCOUNT_IS_DISABLED_KEY)) {
          const DISABLED_ACCOUNT_ID = "disabled-account";
          SnackbarUtils.DismissToast("login-id");
          SnackbarUtils.DismissToast(DISABLED_ACCOUNT_ID);
        }
        break;
      }
      case HttpStatusCode.InternalServerError:
        store.errorStore.setServerError(data);
        break;
    }
    return Promise.reject(data);
  }
);

export default instance;
