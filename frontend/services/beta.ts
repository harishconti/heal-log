import api from './api';

export interface KnownIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'investigating' | 'in_progress' | 'fixed';
  reported_date: string; // Comes as ISO string
  workaround?: string;
}

export const getKnownIssues = async (): Promise<KnownIssue[]> => {
  try {
    const response = await api.get('/api/beta/known-issues');
    return response.data;
  } catch (error) {
    console.error('Error fetching known issues:', error);
    // In a real app, you might want to handle this more gracefully
    // For now, re-throwing the error is fine.
    throw error;
  }
};
