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
  backgroundSyncEnabled: boolean;
  biometricEnabled: boolean;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'pending';

export interface SyncState {
  status: SyncStatus;
  pendingChanges: number;
  lastSyncAttempt: string | null;
  consecutiveFailures: number;
  progress: number; // 0-100
  totalRecords: number;
  syncedRecords: number;
  currentOperation: 'pull' | 'push' | 'idle';
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

  // Sync state
  syncState: SyncState;

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
  setLastSyncTime: (time: string | null) => void;

  // Sync state actions
  setSyncStatus: (status: SyncStatus) => void;
  setPendingChanges: (count: number) => void;
  incrementPendingChanges: () => void;
  decrementPendingChanges: () => void;
  recordSyncAttempt: (success: boolean) => void;
  resetSyncState: () => void;
  updateSyncProgress: (progress: number, syncedRecords?: number, totalRecords?: number) => void;
  setSyncOperation: (operation: 'pull' | 'push' | 'idle') => void;

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
  contactsSync: false,
  backgroundSyncEnabled: true,
  biometricEnabled: false,
};

const initialSyncState: SyncState = {
  status: 'idle',
  pendingChanges: 0,
  lastSyncAttempt: null,
  consecutiveFailures: 0,
  progress: 0,
  totalRecords: 0,
  syncedRecords: 0,
  currentOperation: 'idle',
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
      syncState: initialSyncState,

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
      setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),

      // Sync state actions
      setSyncStatus: (status) => {
        const syncState = { ...get().syncState, status };
        set({ syncState });
      },
      setPendingChanges: (count) => {
        const syncState = { ...get().syncState, pendingChanges: count };
        set({ syncState });
      },
      incrementPendingChanges: () => {
        const current = get().syncState;
        set({ syncState: { ...current, pendingChanges: current.pendingChanges + 1 } });
      },
      decrementPendingChanges: () => {
        const current = get().syncState;
        set({ syncState: { ...current, pendingChanges: Math.max(0, current.pendingChanges - 1) } });
      },
      recordSyncAttempt: (success) => {
        const current = get().syncState;
        set({
          syncState: {
            ...current,
            lastSyncAttempt: new Date().toISOString(),
            consecutiveFailures: success ? 0 : current.consecutiveFailures + 1,
            status: success ? 'success' : 'error',
          },
          lastSyncTime: success ? new Date().toISOString() : get().lastSyncTime,
        });
      },
      resetSyncState: () => set({ syncState: initialSyncState }),
      updateSyncProgress: (progress, syncedRecords, totalRecords) => {
        const current = get().syncState;
        set({
          syncState: {
            ...current,
            progress,
            syncedRecords: syncedRecords ?? current.syncedRecords,
            totalRecords: totalRecords ?? current.totalRecords,
          },
        });
      },
      setSyncOperation: (operation) => {
        const current = get().syncState;
        set({
          syncState: {
            ...current,
            currentOperation: operation,
            status: operation === 'idle' ? current.status : 'syncing',
          },
        });
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
        syncState: state.syncState,
      }),
    }
  )
);