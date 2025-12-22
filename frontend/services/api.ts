import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authEvents } from '@/utils/events';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://doctor-log-production.up.railway.app';

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Helper to get token (web compatible)
const getToken = async () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('token'); // ✅ Changed from 'auth_token' to 'token'
    }
    return null;
  } else {
    return await SecureStore.getItemAsync('token'); // ✅ Changed from 'auth_token' to 'token'
  }
};

// Request interceptor to add token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📤 [API] Request:', config.url);
      console.log('🔑 [API] Token added:', `${token.substring(0, 10)}...`);
    } else {
      console.warn('⚠️ [API] No token found for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log('✅ [API] Response:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error('❌ [API] Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      console.warn('🔐 [API] 401 Unauthorized - Token might be invalid');
      // Clear invalid token
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('token');
        }
      } else {
        await SecureStore.deleteItemAsync('token');
      }

      // Notify app to logout
      authEvents.emit('auth:logout');
    }

    if (error.response?.status === 500) {
      console.error('🔥 [API] 500 Server Error:', error.response?.data);
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
    // Map frontend Feedback to backend BetaFeedbackIn structure if needed, 
    // or just use the existing endpoint if it matches.
    // Based on backend/app/api/feedback.py, it expects BetaFeedbackIn.
    // Let's assume for now we are using the simple feedback endpoint or mapping it.
    // Actually, looking at backend/app/api/feedback.py, it uses BetaFeedbackIn which is quite strict.
    // Let's update the frontend to match the backend expectation or map it here.

    const payload = {
      feedback_type: feedback.feedbackType === 'feature' ? 'suggestion' : feedback.feedbackType,
      description: feedback.description,
      device_info: {
        os_version: Platform.OS + ' ' + Platform.Version,
        app_version: '1.0.0', // TODO: Get real version
        device_model: 'Unknown' // TODO: Get real model
      }
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
    const message = error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to verify OTP';
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
    const message = error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to resend OTP';
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
    const message = error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to send reset email';
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
    const message = error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to reset password';
    throw new Error(message);
  }
};

export default api;
