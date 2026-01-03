import { apiClient } from './client';

export interface GrowthData {
  date: string;
  count: number;
}

export interface WeeklyActivity {
  day: string;
  patients: number;
  notes: number;
}

export interface Demographics {
  by_group: { group: string; count: number }[];
  by_month: { month: string; count: number }[];
}

export const analyticsApi = {
  getPatientGrowth: async (days = 30): Promise<GrowthData[]> => {
    const params = new URLSearchParams({ days: String(days) });
    const response = await apiClient.get<GrowthData[]>(`/analytics/patient-growth?${params}`);
    return response.data;
  },

  getNotesActivity: async (days = 30): Promise<GrowthData[]> => {
    const params = new URLSearchParams({ days: String(days) });
    const response = await apiClient.get<GrowthData[]>(`/analytics/notes-activity?${params}`);
    return response.data;
  },

  getWeeklyActivity: async (): Promise<WeeklyActivity[]> => {
    const response = await apiClient.get<WeeklyActivity[]>('/analytics/weekly-activity');
    return response.data;
  },

  getDemographics: async (): Promise<Demographics> => {
    const response = await apiClient.get<Demographics>('/analytics/demographics');
    return response.data;
  },

  exportAnalytics: async (): Promise<Blob> => {
    const response = await apiClient.get('/analytics/export', {
      responseType: 'blob',
    });
    return response.data;
  },
};
