import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from '@/services/api'; // Use centralized api
import { useAppStore, User } from '@/store/useAppStore';

// Platform-specific secure storage
const SecureStorageAdapter = {
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } else {
      // Use SecureStore for native platforms
      await SecureStore.setItemAsync(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } else {
      // Use SecureStore for native platforms
      return await SecureStore.getItemAsync(key);
    }
  },

  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } else {
      // Use SecureStore for native platforms
      await SecureStore.deleteItemAsync(key);
    }
  }
};

// Types
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  phone: string;
  password: string;
  full_name: string;
  medical_specialty: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Rehydrate the store first to get persisted user data
        if (useAppStore.persist) {
          await useAppStore.persist.rehydrate();
        }

        const storedUser = useAppStore.getState().user;
        const storedToken = await SecureStorageAdapter.getItem('auth_token');

        console.warn('Init: Stored Token exists?', !!storedToken);
        console.warn('Init: Stored User exists?', !!storedUser);

        if (storedToken) {
          // No need to set header manually, interceptor handles it

          if (storedUser) {
            // OPTIMISTIC AUTH: We have a user and a token. Let them in.
            console.warn('Optimistic Auth: Using persisted user data.');
            setToken(storedToken);
            setUser(storedUser);

            // Verify in background (non-blocking)
            refreshUser().catch(err => console.warn('Background refresh failed:', err));
          } else {
            // No user data, must fetch
            try {
              console.warn('Fetching user data (blocking)...');
              const response = await api.get('/api/auth/me');
              setToken(storedToken);
              setUser(response.data);
            } catch (error: any) {
              console.error('Blocking auth failed:', error);
              if (error.response?.status === 401) {
                await logout();
              } else {
                console.warn('Server error without cached user. Keeping token but user is null.');
              }
            }
          }
        }
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const login = async (email: string, password: string) => {
    console.warn('Attempting login...');
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, user: userData } = response.data;

      // Store auth data
      await SecureStorageAdapter.setItem('auth_token', access_token);

      setToken(access_token);
      setUser(userData);

      // Interceptor will pick up the token from SecureStorage for next requests

    } catch (error: any) {
      console.warn('Login error details:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post('/api/auth/register', userData);

      const { access_token, user: newUser } = response.data;

      // Store auth data
      await SecureStorageAdapter.setItem('auth_token', access_token);

      setToken(access_token);
      setUser(newUser);

    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      // First, clear stored data - this is the critical part
      const storageCleanupResults = await Promise.allSettled([
        SecureStorageAdapter.removeItem('auth_token'),
        AsyncStorage.removeItem('patients_cache'),
        AsyncStorage.removeItem('medical_call_logs'),
        AsyncStorage.removeItem('contacts_sync_enabled'),
      ]);

      // Log any storage cleanup failures for debugging
      storageCleanupResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          const keys = ['auth_token', 'patients_cache', 'medical_call_logs', 'contacts_sync_enabled'];
          console.warn(`Failed to clear ${keys[index]}:`, result.reason);
        }
      });

      // Only clear app state after storage is cleaned
      setToken(null);
      setUser(null);

      console.log('Logout completed successfully');

    } catch (error) {
      console.error('Critical error during logout:', error);

      // If storage cleanup completely fails, still clear app state
      // but warn user about potential data remnants
      setToken(null);
      setUser(null);

      // In production, you might want to show a warning to the user
      // about manually clearing app data if logout issues persist
      throw new Error('Logout may not have completed fully. Please clear app data manually if issues persist.');
    }
  };

  const refreshUser = async () => {
    try {
      if (!token) return;

      const response = await api.get('/api/auth/me');
      const userData = response.data.user;

      setUser(userData);

    } catch (error) {
      console.error('Error refreshing user data:', error);
      // If refresh fails, logout user
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};