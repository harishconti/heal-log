import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * User plan types - matches backend UserPlan enum
 */
export type UserPlan = 'basic' | 'pro';

/**
 * Subscription status types - matches backend SubscriptionStatus enum
 */
export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'past_due';

/**
 * User role types - matches backend UserRole enum
 */
export type UserRole = 'admin' | 'doctor' | 'patient';

/**
 * User interface - matches backend User schema
 */
export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  medical_specialty: string;
  plan: UserPlan;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  subscription_end_date: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  profile_photo?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  hapticEnabled: boolean;
  offlineMode: boolean;
  autoSync: boolean;
  contactsSync: boolean;
}

interface LoadingState {
  patients: boolean;
  profile: boolean;
  subscription: boolean;
  stats: boolean;
  patientDetails: boolean;
  sync: boolean;
  auth: boolean;
  upload: boolean;
}

interface ErrorState {
  patients: string | null;
  profile: string | null;
  subscription: string | null;
  stats: string | null;
  patientDetails: string | null;
  sync: string | null;
  auth: string | null;
  upload: string | null;
}

interface AppState {
  // User data
  user: User | null;

  // Search and filter state
  searchQuery: string;
  selectedFilter: string;

  // Granular loading states
  loading: LoadingState;

  // Error states
  errors: ErrorState;

  // App state
  isOffline: boolean;
  lastSyncTime: string | null;
  settings: AppSettings;

  // Actions
  setUser: (user: User | null) => void;

  // Search and filter actions
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: string) => void;

  // Granular loading state actions
  setLoading: (key: keyof LoadingState, loading: boolean) => void;
  setError: (key: keyof ErrorState, error: string | null) => void;
  clearError: (key: keyof ErrorState) => void;
  clearAllErrors: () => void;

  // App state actions
  setOffline: (offline: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Convenience getters
  isAnyLoading: () => boolean;
  hasAnyError: () => boolean;
  getLoadingKeys: () => (keyof LoadingState)[];
  getErrorKeys: () => (keyof ErrorState)[];
}

const defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 'medium',
  hapticEnabled: true,
  offlineMode: true,
  autoSync: true,
  contactsSync: false
};

const initialLoadingState: LoadingState = {
  patients: false,
  profile: false,
  subscription: false,
  stats: false,
  patientDetails: false,
  sync: false,
  auth: false,
  upload: false,
};

const initialErrorState: ErrorState = {
  patients: null,
  profile: null,
  subscription: null,
  stats: null,
  patientDetails: null,
  sync: null,
  auth: null,
  upload: null,
};

export const useAppStore = create(
  persist<AppState>(
    (set, get) => ({
      // Initial state
      user: null,
      searchQuery: '',
      selectedFilter: 'all',
      loading: initialLoadingState,
      errors: initialErrorState,
      isOffline: false,
      lastSyncTime: null,
      settings: defaultSettings,

      // User actions
      setUser: (user) => set({ user }),

      // Search and filter actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedFilter: (filter) => set({ selectedFilter: filter }),

      // Granular loading state actions
      setLoading: (key, loading) => {
        const currentLoading = get().loading;
        set({ loading: { ...currentLoading, [key]: loading } });
      },

      setError: (key, error) => {
        const currentErrors = get().errors;
        set({ errors: { ...currentErrors, [key]: error } });
      },

      clearError: (key) => {
        const currentErrors = get().errors;
        set({ errors: { ...currentErrors, [key]: null } });
      },

      clearAllErrors: () => {
        set({ errors: initialErrorState });
      },

      // App state actions
      setOffline: (isOffline) => set({ isOffline }),
      updateSettings: (newSettings) => {
        const settings = { ...get().settings, ...newSettings };
        set({ settings });
      },

      // Convenience getters
      isAnyLoading: () => {
        const loading = get().loading;
        return Object.values(loading).some(Boolean);
      },

      hasAnyError: () => {
        const errors = get().errors;
        return Object.values(errors).some(Boolean);
      },

      getLoadingKeys: () => {
        const loading = get().loading;
        return Object.entries(loading)
          .filter(([_, isLoading]) => isLoading)
          .map(([key, _]) => key as keyof LoadingState);
      },

      getErrorKeys: () => {
        const errors = get().errors;
        return Object.entries(errors)
          .filter(([_, error]) => error !== null)
          .map(([key, _]) => key as keyof ErrorState);
      }
    }),
    {
      name: 'medical-contacts-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        settings: state.settings,
        lastSyncTime: state.lastSyncTime,
        searchQuery: state.searchQuery,
        selectedFilter: state.selectedFilter,
        isOffline: state.isOffline,
      }),
    }
  )
);