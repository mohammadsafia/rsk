import axios, { type AxiosInstance } from 'axios';

import { getPersistentData } from '@utils';
import {APP_CONFIGURATIONS } from '@app-config';

const instance: AxiosInstance = axios.create({
  baseURL: APP_CONFIGURATIONS.VITE_APP_API_URL,
});

instance.interceptors.request.use((req) => {
  const storageTokenKey = getPersistentData<string>(APP_CONFIGURATIONS.TOKEN_KEY);

  if (req.withToken && storageTokenKey) req.headers.set('Authorization', storageTokenKey);

  return req;
});

export default instance;
