import { IBasicUser } from "@/shared/interfaces";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: IBasicUser | null;
  setUser: (user: IBasicUser) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearTokens: () => void;
  clearAccessToken: () => void;
  isAuthenticated: () => boolean;
  getAccessToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      setAccessToken: (accessToken) =>
        set((state) => ({
          user: state.user ? { ...state.user, accessToken } : null,
        })),
      setTokens: (accessToken: string, refreshToken: string) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, accessToken, refreshToken }
            : null,
        })),
      clearTokens: () => set({ user: null }),
      clearAccessToken: () =>
        set((state) => ({
          user: state.user ? { ...state.user, accessToken: " " } : null,
        })),
      isAuthenticated: (): boolean => {
        const state = get();
        return !!(
          state.user?.accessToken && state.user.accessToken.trim() !== ""
        );
      },
      getAccessToken: (): string | null => {
        const state = get();
        return state.user?.accessToken || null;
      },
    }),
    {
      name: "auth-storage",
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    },
  ),
);
