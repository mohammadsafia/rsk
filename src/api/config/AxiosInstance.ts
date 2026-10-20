import axios, { type AxiosInstance, isAxiosError } from 'axios';

import { notifyUnauthorized, readSession } from '@contexts';
import { APP_CONFIGURATIONS } from '@app-config';

const instance: AxiosInstance = axios.create({
  baseURL: APP_CONFIGURATIONS.VITE_APP_API_URL,
});

// Requests that ask for it (httpClient's default) carry the session token.
instance.interceptors.request.use((req) => {
  const token = req.withToken ? readSession()?.token : undefined;

  if (token) req.headers.set('Authorization', `Bearer ${token}`);

  return req;
});

// A 401 on a request that carried the token means the session is over: sign out (the guard then asks to sign in again).
// A 401 without a token (a wrong password at sign-in) is the caller's to show.
instance.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 401 && error.config?.withToken) {
    // The token this request carried: a 401 for an older session must not end a newer one.
    const sent = String(error.config.headers?.Authorization ?? '').replace(/^Bearer /, '');
    notifyUnauthorized(sent || undefined);
  }

  return Promise.reject(error);
});

export default instance;
