import { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import AxiosInstance from './AxiosInstance';

type HttpClientRequestConfig<TConfig = any> = AxiosRequestConfig<TConfig>;
type HttpClientResponse<TData = any> = AxiosResponse<TData>;
type HttpClientError = AxiosError<{ message: string }>;

export type HttpClient = {
  get<T, D = any>(url: string, config?: HttpClientRequestConfig<D>): Promise<T>;
  post<T, D = any>(url: string, data?: D, config?: HttpClientRequestConfig<D>): Promise<T>;
  put<T, D = any>(url: string, data?: D, config?: HttpClientRequestConfig<D>): Promise<T>;
  delete<T, D = any>(url: string, config?: HttpClientRequestConfig<D>): Promise<T>;
  patch<T, D = any>(url: string, data?: D, config?: HttpClientRequestConfig<D>): Promise<T>;
};

const BASE_CONFIG: HttpClientRequestConfig = {
  withToken: true,
};

const responseBody = <T>(response: HttpClientResponse<T>) => response.data;

const responseError = <T>(error: HttpClientError | T) => {
  if (error instanceof AxiosError && error.response) throw error.response.data;

  throw error;
};

export const httpClient: HttpClient = {
  async get<T, D = any>(url: string, config: HttpClientRequestConfig<D> = BASE_CONFIG) {
    return await AxiosInstance.get<T>(url, { ...BASE_CONFIG, ...config })
      .then(responseBody)
      .catch(responseError);
  },
  async post<T, D = any>(url: string, data?: D, config: HttpClientRequestConfig<D> = BASE_CONFIG) {
    return await AxiosInstance.post<T>(url, data, { ...BASE_CONFIG, ...config })
      .then(responseBody)
      .catch(responseError);
  },
  async put<T, D = any>(url: string, data?: D, config: HttpClientRequestConfig<D> = BASE_CONFIG) {
    return await AxiosInstance.put<T>(url, data, { ...BASE_CONFIG, ...config })
      .then(responseBody)
      .catch(responseError);
  },
  async delete<T, D = any>(url: string, config: HttpClientRequestConfig<D> = BASE_CONFIG) {
    return await AxiosInstance.delete<T>(url, { ...BASE_CONFIG, ...config })
      .then(responseBody)
      .catch(responseError);
  },
  async patch<T, D = any>(url: string, data?: D, config: HttpClientRequestConfig<D> = BASE_CONFIG) {
    return await AxiosInstance.patch<T>(url, data, { ...BASE_CONFIG, ...config })
      .then(responseBody)
      .catch(responseError);
  },
};
