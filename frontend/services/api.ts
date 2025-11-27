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
    if (error.response?.status === 401) {
      // Token expired or invalid - we might want to clear it here or let AuthContext handle it
      console.warn('API: Auth token invalid or expired (401)');
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
