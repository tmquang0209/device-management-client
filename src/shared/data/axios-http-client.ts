import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { parseApiError } from "../helper/error";
import { useAuthStore } from "../store/auth.store";
import { HttpClient, HttpClientConfig } from "./http-client";
import { refreshToken } from "./token-refresh";

// Extend the InternalAxiosRequestConfig to include _retry flag
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export class AxiosHttpClient implements HttpClient {
  private readonly instance: AxiosInstance;

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "x-client": process.env.NEXT_PUBLIC_CLIENT_TYPE || "system",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        // Get tokens from Zustand store
        const { user } = useAuthStore.getState();
        const accessToken = user?.accessToken;
        const refreshTokenValue = user?.refreshToken;

        config.headers = config.headers || {};

        // If the endpoint is /auth/refresh, use refresh token
        if (
          config.url?.endsWith("/auth/refresh") &&
          refreshTokenValue &&
          refreshTokenValue.trim() !== ""
        ) {
          config.headers.Authorization = `Bearer ${refreshTokenValue}`;
        } else if (accessToken && accessToken.trim() !== "") {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      },
      (error: unknown) =>
        Promise.reject(
          error instanceof Error
            ? error
            : new Error("Request interceptor error"),
        ),
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: unknown) => {
        if (axios.isAxiosError(error)) {
          const originalRequest = error.config as ExtendedAxiosRequestConfig;

          // Handle 401 Unauthorized - token expired or invalid
          if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry
          ) {
            originalRequest._retry = true;

            try {
              // Try to refresh the token
              const newToken = await refreshToken();

              // Update the original request with the new token
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;

              // Retry the original request
              return this.instance(originalRequest);
            } catch (refreshError) {
              // Token refresh failed, logout user and redirect
              const { logout } = useAuthStore.getState();
              logout();

              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }

              // Log the refresh error for debugging
              console.error("Token refresh failed:", refreshError);

              return Promise.reject(new Error("Authentication failed"));
            }
          }

          // For non-401 errors, pass the original axios error to preserve response data
          return Promise.reject(error);
        }

        return Promise.reject(
          error instanceof Error ? error : new Error("Unknown error"),
        );
      },
    );
  }

  async get<T>(url: string, config?: HttpClientConfig): Promise<T> {
    try {
      const response = await this.instance.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: HttpClientConfig,
  ): Promise<T> {
    try {
      const response = await this.instance.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: HttpClientConfig,
  ): Promise<T> {
    try {
      const response = await this.instance.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: HttpClientConfig,
  ): Promise<T> {
    try {
      const response = await this.instance.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  }

  async delete<T>(url: string, config?: HttpClientConfig): Promise<T> {
    try {
      const response = await this.instance.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  }
}
