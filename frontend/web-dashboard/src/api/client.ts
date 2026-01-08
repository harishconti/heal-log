import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { logger } from '../utils/logger';

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

// Token refresh state - mutex to prevent concurrent refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
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
 * Secure token management utilities
 */
export const tokenManager = {
  getAccessToken: (): string | null => {
    try {
      return sessionStorage.getItem(TOKEN_KEYS.ACCESS);
    } catch (error) {
      logger.error('Failed to access sessionStorage', error);
      return null;
    }
  },

  getRefreshToken: (): string | null => {
    try {
      return sessionStorage.getItem(TOKEN_KEYS.REFRESH);
    } catch (error) {
      logger.error('Failed to access sessionStorage', error);
      return null;
    }
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    try {
      sessionStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
      sessionStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
    } catch (error) {
      logger.error('Failed to store tokens', error);
    }
  },

  clearTokens: (): void => {
    try {
      sessionStorage.removeItem(TOKEN_KEYS.ACCESS);
      sessionStorage.removeItem(TOKEN_KEYS.REFRESH);
      // Clear any other session data
      sessionStorage.removeItem('user');
    } catch (error) {
      logger.error('Failed to clear tokens', error);
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

// Response interceptor for token refresh with mutex to prevent concurrent refreshes
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints to prevent loops
      const authEndpoints = ['/auth/login', '/auth/refresh', '/auth/register'];
      if (authEndpoints.some((endpoint) => originalRequest.url?.includes(endpoint))) {
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;
          tokenManager.setTokens(access_token, newRefreshToken);

          // Process queued requests with new token
          processQueue(null, access_token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Process queue with error
          processQueue(refreshError, null);

          // Clear tokens and redirect to login
          logger.error('Token refresh failed', refreshError);
          tokenManager.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token, clear and redirect
        isRefreshing = false;
        tokenManager.clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
