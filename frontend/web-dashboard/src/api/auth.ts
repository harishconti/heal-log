import { apiClient } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);

    const response = await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<{ message: string; user_id: string }> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', { email, otp_code: otp });
    return response.data;
  },

  resendOtp: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/resend-otp', { email });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};
