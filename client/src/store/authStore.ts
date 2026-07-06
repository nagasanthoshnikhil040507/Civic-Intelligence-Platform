import { create } from 'zustand';

interface AuthState {
  user: null | Record<string, any>;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: any, accessToken: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // true by default to wait for initial session check
  login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true, isLoading: false }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setLoading: (isLoading) => set({ isLoading }),
}));
