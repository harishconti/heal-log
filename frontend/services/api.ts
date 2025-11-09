import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
