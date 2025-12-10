import { useEffect } from 'react';
import { setupTokenRefresh } from '../data/token-refresh';
import { useAuthStore } from '../store/auth.store';

/**
 * Hook to initialize authentication and token refresh
 * Call this in your app's root component or layout
 */
export const useAuthInitialization = () => {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated()) {
      // Set up automatic token refresh
      setupTokenRefresh();
    }
  }, [user, isAuthenticated]);

  return {
    user,
    isAuthenticated: isAuthenticated(),
  };
};

/**
 * Hook to get authentication state and actions
 */
export const useAuth = () => {
  const {
    user,
    setUser,
    logout,
    setTokens,
    setAccessToken,
    clearTokens,
    clearAccessToken,
    isAuthenticated,
    getAccessToken,
  } = useAuthStore();

  return {
    user,
    setUser,
    logout,
    setTokens,
    setAccessToken,
    clearTokens,
    clearAccessToken,
    isAuthenticated: isAuthenticated(),
    getAccessToken,
  };
};