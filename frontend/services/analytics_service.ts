import api from './api';

export interface GrowthData {
    period: string;
    count: number;
}

export interface NotesData {
    period: string;
    count: number;
}

export interface ActivityData {
    day: string;
    count: number;
}

export interface DemographicsData {
    group: string;
    count: number;
}

export interface AnalyticsExport {
    growth: GrowthData[];
    notes: NotesData[];
    activity: ActivityData[];
    demographics: DemographicsData[];
    exported_at: string;
}

export const AnalyticsService = {
    async getPatientGrowth(): Promise<GrowthData[]> {
        try {
            const response = await api.get('/api/analytics/patient-growth');
            return response.data;
        } catch (error) {
            console.error('Error fetching patient growth:', error);
            throw error;
        }
    },

    async getNotesActivity(): Promise<NotesData[]> {
        try {
            const response = await api.get('/api/analytics/notes-activity');
            return response.data;
        } catch (error) {
            console.error('Error fetching notes activity:', error);
            throw error;
        }
    },

    async getWeeklyActivity(): Promise<ActivityData[]> {
        try {
            const response = await api.get('/api/analytics/weekly-activity');
            return response.data;
        } catch (error) {
            console.error('Error fetching weekly activity:', error);
            throw error;
        }
    },

    async getDemographics(): Promise<DemographicsData[]> {
        try {
            const response = await api.get('/api/analytics/demographics');
            return response.data;
        } catch (error) {
            console.error('Error fetching demographics:', error);
            throw error;
        }
    },

    async exportAnalytics(): Promise<AnalyticsExport> {
        try {
            const response = await api.get('/api/analytics/export');
            return response.data;
        } catch (error) {
            console.error('Error exporting analytics:', error);
            throw error;
        }
    },
};
