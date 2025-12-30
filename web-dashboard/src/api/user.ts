import { apiClient } from './client';
import type { User } from '../types';

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  medical_specialty?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await apiClient.put<User>('/users/me', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await apiClient.post('/users/me/password', data);
    return response.data;
  },
};
