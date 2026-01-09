import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { authEvents } from '@/utils/events';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://doctor-log-production.up.railway.app';

// Token storage keys
const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Token refresh state - using promise-based singleton pattern to prevent race conditions
let refreshPromise: Promise<string | null> | null = null;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Platform-specific token storage
const TokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
      }
      return null;
    }
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async setAccessToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
      }
    } else {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
      }
      return null;
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
      }
    } else {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }
  },

  async clearTokens(): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  },

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.setAccessToken(accessToken);
    await this.setRefreshToken(refreshToken);
  },
};

// Export for use in other modules
export { TokenStorage };

// Process queued requests after token refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Refresh the access token using a singleton promise pattern.
 * This prevents race conditions when multiple concurrent requests trigger refresh.
 *
 * The pattern ensures:
 * 1. Only one refresh request is made at a time
 * 2. All concurrent requests wait for the same refresh to complete
 * 3. The promise is cleared after completion for future refreshes
 */
const refreshAccessToken = async (): Promise<string | null> => {
  // If a refresh is already in progress, return the existing promise
  // This is the key to preventing race conditions
  if (refreshPromise) {
    if (__DEV__) {
      console.log('🔄 [API] Token refresh already in progress, waiting...');
    }
    return refreshPromise;
  }

  // Create a new refresh promise
  refreshPromise = (async () => {
    try {
      const refreshToken = await TokenStorage.getRefreshToken();

      if (!refreshToken) {
        if (__DEV__) {
          console.log('🔐 [API] No refresh token available');
        }
        return null;
      }

      if (__DEV__) {
        console.log('🔄 [API] Attempting to refresh access token...');
      }

      // Use a fresh axios instance to avoid interceptor loops
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/refresh`,
        { refresh_token: refreshToken },
        { timeout: 10000 }
      );

      const { access_token, refresh_token: newRefreshToken } = response.data;

      // Save new tokens
      await TokenStorage.saveTokens(access_token, newRefreshToken);

      if (__DEV__) {
        console.log('✅ [API] Token refreshed successfully');
      }

      return access_token;
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [API] Token refresh failed:', error.message);
      }
      return null;
    } finally {
      // Clear the promise so future refreshes can occur
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Request interceptor to add token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await TokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (__DEV__) {
        console.log('📤 [API] Request:', config.url, '(authenticated)');
      }
    } else {
      if (__DEV__) {
        console.log('📤 [API] Request:', config.url, '(unauthenticated)');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('✅ [API] Response:', response.config.url, response.status);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (__DEV__) {
      console.error('❌ [API] Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: (error.response?.data as any)?.detail || error.message,
      });
    }

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints
      const authEndpoints = ['/api/auth/login', '/api/auth/refresh', '/api/auth/register', '/api/auth/logout'];
      if (authEndpoints.some((endpoint) => originalRequest.url?.includes(endpoint))) {
        return Promise.reject(error);
      }

      // Mark request as retried to prevent infinite loops
      originalRequest._retry = true;

      try {
        // Use the singleton promise pattern - this handles race conditions automatically
        // Multiple concurrent requests will all wait for the same refresh promise
        const newToken = await refreshAccessToken();

        if (newToken) {
          // Process any queued requests with new token
          processQueue(null, newToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          // Refresh failed, clear tokens and logout
          processQueue(error, null);
          await TokenStorage.clearTokens();
          authEvents.emit('auth:logout');
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        await TokenStorage.clearTokens();
        authEvents.emit('auth:logout');
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 500) {
      if (__DEV__) {
        console.error('🔥 [API] 500 Server Error');
      }
    }

    return Promise.reject(error);
  }
);

export interface Feedback {
  feedbackType: 'bug' | 'feature' | 'other';
  description: string;
  email?: string;
}

export interface BetaFeedback {
  feedback_type: 'bug' | 'suggestion' | 'general';
  description: string;
  steps_to_reproduce?: string;
  device_info: {
    os_version?: string;
    app_version?: string;
    device_model?: string;
  };
  screenshot?: string;
}

export interface KnownIssue {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  reported_date: string;
  workaround?: string;
}

export const submitFeedback = async (feedback: Feedback) => {
  try {
    const payload = {
      feedback_type:
        feedback.feedbackType === 'feature'
          ? 'suggestion'
          : feedback.feedbackType === 'other'
          ? 'general'
          : feedback.feedbackType,
      description: feedback.description,
      device_info: {
        os_version: Platform.OS + ' ' + Platform.Version,
        app_version: Constants.expoConfig?.version || '1.0.0',
        device_model: Device.modelName || 'Unknown',
      },
    };

    const response = await api.post('/api/feedback/submit', payload);
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

export const getKnownIssues = async (): Promise<KnownIssue[]> => {
  try {
    const response = await api.get('/api/beta/known-issues');
    return response.data;
  } catch (error) {
    console.error('Error fetching known issues:', error);
    throw error;
  }
};

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  medical_specialty?: string;
}

export const updateProfile = async (data: UserUpdate) => {
  try {
    const response = await api.put('/api/users/me', data);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    const response = await api.post('/api/users/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// ============== OTP & Password Reset APIs ==============

/**
 * Verify OTP code for email verification
 */
export const verifyOTP = async (email: string, otp_code: string) => {
  try {
    const response = await api.post('/api/auth/verify-otp', {
      email,
      otp_code,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    const message =
      error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to verify OTP';
    throw new Error(message);
  }
};

/**
 * Resend OTP code for email verification
 */
export const resendOTP = async (email: string) => {
  try {
    const response = await api.post('/api/auth/resend-otp', { email });
    return response.data;
  } catch (error: any) {
    console.error('Error resending OTP:', error);
    const message =
      error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to resend OTP';
    throw new Error(message);
  }
};

/**
 * Request password reset email
 */
export const forgotPassword = async (email: string) => {
  try {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  } catch (error: any) {
    console.error('Error requesting password reset:', error);
    const message =
      error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to send reset email';
    throw new Error(message);
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, new_password: string) => {
  try {
    const response = await api.post('/api/auth/reset-password', {
      token,
      new_password,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error resetting password:', error);
    const message =
      error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to reset password';
    throw new Error(message);
  }
};

/**
 * Logout the current user.
 *
 * This function:
 * 1. Calls the backend to revoke the current access token (prevents reuse)
 * 2. Clears local token storage
 * 3. Emits logout event
 *
 * Even if the backend call fails, tokens are cleared locally for security.
 */
export const logout = async (): Promise<void> => {
  try {
    // Try to revoke token on backend
    await api.post('/api/auth/logout');
    if (__DEV__) {
      console.log('✅ [API] Token revoked on server');
    }
  } catch (error: any) {
    // Log but don't throw - we still want to clear local tokens
    if (__DEV__) {
      console.warn('⚠️ [API] Failed to revoke token on server:', error.message);
    }
  } finally {
    // Always clear local tokens
    await TokenStorage.clearTokens();
    authEvents.emit('auth:logout');
    if (__DEV__) {
      console.log('✅ [API] Local tokens cleared, logout complete');
    }
  }
};

export default api;
