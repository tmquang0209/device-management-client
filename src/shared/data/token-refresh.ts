import { IBasicUser, IResponse } from "../interfaces";
import { useAuthStore } from "../store/auth.store";
import { api } from "./api";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });

  failedQueue = [];
};

export const refreshToken = async (): Promise<string> => {
  const { user, setUser, logout } = useAuthStore.getState();

  if (!user?.refreshToken) {
    throw new Error("No refresh token available");
  }

  if (isRefreshing) {
    // If refresh is already in progress, queue this request
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const response = await api.post<IResponse<IBasicUser>>(
      "/auth/refresh",
      {},
      {
        headers: {
          Authorization: `Bearer ${user.refreshToken}`,
        },
      },
    );

    // Update tokens in store
    setUser(response.data);

    // Process queued requests
    processQueue(null, response.data.accessToken);

    return response.data.accessToken;
  } catch (error) {
    // Token refresh failed, logout user
    logout();
    processQueue(new Error("Token refresh failed"), null);
    throw error;
  } finally {
    isRefreshing = false;
  }
};

export const setupTokenRefresh = () => {
  // This can be called to set up automatic token refresh
  // You might want to set up a timer here to refresh tokens before they expire
  const { user } = useAuthStore.getState();

  if (user?.accessToken) {
    // Example: Set up a timer to refresh token every 50 minutes (assuming 1-hour expiry)
    // setInterval(refreshToken, 50 * 60 * 1000);
  }
};
