import { create } from 'zustand';
import type { User } from '../types';
import { tokenManager } from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingVerificationEmail: string | null;
  setUser: (user: User | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setPendingVerificationEmail: (email: string | null) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  pendingVerificationEmail: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setPendingVerificationEmail: (email) => set({ pendingVerificationEmail: email }),

  login: (user, accessToken, refreshToken) => {
    // Use centralized token manager for consistent token handling
    tokenManager.setTokens(accessToken, refreshToken);
    set({ user, isAuthenticated: true, isLoading: false, pendingVerificationEmail: null });
  },

  logout: () => {
    // Use centralized token manager for consistent token handling
    tokenManager.clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false, pendingVerificationEmail: null });
  },

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));
