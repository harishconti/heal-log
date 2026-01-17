export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  condition: string;
  status: 'Critical' | 'Stable' | 'Recovering';
  notes: string; // Raw clinical notes
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  PATIENTS = 'PATIENTS',
  ANALYTICS = 'ANALYTICS',
  AI_SCRIBE = 'AI_SCRIBE',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS'
}