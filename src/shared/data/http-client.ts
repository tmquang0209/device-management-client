export interface HttpClientConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface HttpClient {
  get<T>(url: string, config?: HttpClientConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: HttpClientConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: HttpClientConfig): Promise<T>;
  delete<T>(url: string, config?: HttpClientConfig): Promise<T>;
}
