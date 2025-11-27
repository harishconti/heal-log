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
