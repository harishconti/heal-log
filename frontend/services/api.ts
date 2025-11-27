import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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
      return window.localStorage.getItem('auth_token');
    }
    return null;
  } else {
    return await SecureStore.getItemAsync('auth_token');
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

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('❌ [API] Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      console.warn('🔐 [API] 401 Unauthorized - Token might be invalid');
      // We could trigger a logout here if we had access to the store/context
    }
    return Promise.reject(error);
  }
);

export interface Feedback {
  feedbackType: 'bug' | 'feature' | 'other';
  description: string;
  email?: string;
}

export const submitFeedback = async (feedback: Feedback) => {
  try {
    const response = await api.post('/api/feedback', feedback);
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

export default api;
