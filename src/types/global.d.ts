import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    apiVersion?: number;
    withToken?: boolean;
  }
}
