import { apiClient } from './client';
import type { Patient, ClinicalNote, PaginatedResponse, PatientStats } from '../types';

export interface PatientFilters {
  search?: string;
  group?: string;
  is_favorite?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreatePatientData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  location?: string;
  initial_complaint?: string;
  initial_diagnosis?: string;
  group?: string;
  is_favorite?: boolean;
}

export interface CreateNoteData {
  content: string;
  visit_type: 'regular' | 'follow-up' | 'emergency';
}

export const patientsApi = {
  getPatients: async (filters: PatientFilters = {}): Promise<PaginatedResponse<Patient>> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.group) params.append('group', filters.group);
    if (filters.is_favorite !== undefined) params.append('is_favorite', String(filters.is_favorite));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.page_size) params.append('page_size', String(filters.page_size));
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const response = await apiClient.get<PaginatedResponse<Patient>>(`/patients/?${params.toString()}`);
    return response.data;
  },

  getPatient: async (id: string): Promise<Patient> => {
    const response = await apiClient.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (data: CreatePatientData): Promise<Patient> => {
    const response = await apiClient.post<Patient>('/patients/', data);
    return response.data;
  },

  updatePatient: async (id: string, data: Partial<CreatePatientData>): Promise<Patient> => {
    const response = await apiClient.put<Patient>(`/patients/${id}`, data);
    return response.data;
  },

  deletePatient: async (id: string): Promise<void> => {
    await apiClient.delete(`/patients/${id}`);
  },

  getStats: async (): Promise<PatientStats> => {
    const response = await apiClient.get<PatientStats>('/patients/stats/');
    return response.data;
  },

  getGroups: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/patients/groups/');
    return response.data;
  },

  // Clinical Notes
  getNotes: async (patientId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<ClinicalNote>> => {
    const response = await apiClient.get<PaginatedResponse<ClinicalNote>>(
      `/patients/${patientId}/notes?page=${page}&page_size=${pageSize}`
    );
    return response.data;
  },

  createNote: async (patientId: string, data: CreateNoteData): Promise<ClinicalNote> => {
    const response = await apiClient.post<ClinicalNote>(`/patients/${patientId}/notes`, data);
    return response.data;
  },
};
