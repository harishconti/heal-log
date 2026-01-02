import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * API Client Configuration
 *
 * SECURITY NOTE: Tokens are currently stored in sessionStorage for simplicity.
 * This provides some protection as tokens are cleared when the browser tab closes.
 *
 * For enhanced security in production:
 * - Consider implementing HttpOnly cookies for token storage (requires backend changes)
 * - Enable CSRF protection
 * - Use shorter access token expiration times
 * - Implement token rotation on each request
 *
 * sessionStorage is used over localStorage because:
 * - Tokens are cleared when the tab/browser closes
 * - Not shared across tabs (reduces attack surface)
 * - Still vulnerable to XSS, but has smaller window of exposure
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Token storage keys - centralized for consistency
const TOKEN_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
} as const;

/**
 * Secure token management utilities
 */
export const tokenManager = {
  getAccessToken: (): string | null => {
    try {
      return sessionStorage.getItem(TOKEN_KEYS.ACCESS);
    } catch {
      console.error('Failed to access sessionStorage');
      return null;
    }
  },

  getRefreshToken: (): string | null => {
    try {
      return sessionStorage.getItem(TOKEN_KEYS.REFRESH);
    } catch {
      console.error('Failed to access sessionStorage');
      return null;
    }
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    try {
      sessionStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
      sessionStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  },

  clearTokens: (): void => {
    try {
      sessionStorage.removeItem(TOKEN_KEYS.ACCESS);
      sessionStorage.removeItem(TOKEN_KEYS.REFRESH);
      // Clear any other session data
      sessionStorage.removeItem('user');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  },

  hasValidToken: (): boolean => {
    const token = tokenManager.getAccessToken();
    if (!token) return false;

    // Basic JWT structure validation (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return false; // Token expired
      }
      return true;
    } catch {
      return false;
    }
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable credentials for future cookie-based auth
  withCredentials: true,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;
          tokenManager.setTokens(access_token, newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Clear tokens and redirect to login
          console.error('Token refresh failed:', refreshError);
          tokenManager.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);
