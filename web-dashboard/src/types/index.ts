export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  medical_specialty?: string;
  plan: 'basic' | 'pro';
  role: 'doctor' | 'admin';
  subscription_status: 'trialing' | 'active' | 'canceled' | 'past_due';
  subscription_end_date?: string;
  is_verified: boolean;
  is_beta_tester: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  patient_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  location?: string;
  initial_complaint?: string;
  initial_diagnosis?: string;
  photo?: string;
  group?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  content: string;
  visit_type: 'regular' | 'follow-up' | 'emergency';
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  medical_specialty?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PatientStats {
  total_patients: number;
  total_favorites: number;
  total_groups: number;
  groups: string[];
}

export interface AnalyticsData {
  patient_growth: { date: string; count: number }[];
  notes_activity: { date: string; count: number }[];
  weekly_activity: { day: string; patients: number; notes: number }[];
  demographics: {
    by_group: { group: string; count: number }[];
    by_month: { month: string; count: number }[];
  };
}
