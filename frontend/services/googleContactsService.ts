/**
 * Google Contacts Sync Service
 *
 * Handles all API interactions for Google Contacts synchronization including:
 * - OAuth flow (connect, disconnect)
 * - Sync operations (start, poll status, cancel)
 * - Duplicate management (list, resolve, batch resolve)
 */

import api from './api';

// ============== Types ==============

export type SyncJobStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type SyncJobType = 'initial' | 'incremental';
export type DuplicateStatus = 'pending' | 'resolved' | 'skipped';
export type DuplicateResolution = 'keep_existing' | 'replace' | 'merge' | 'create_new';

export interface GoogleContactsConnectionStatus {
  is_connected: boolean;
  connected_at: string | null;
  last_sync_at: string | null;
  total_synced_patients: number;
}

export interface DuplicateMatch {
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  confidence: number;
  match_reasons: string[];
}

export interface GoogleContact {
  resource_name: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  photo_url: string | null;
}

export interface DuplicateRecord {
  id: string;
  sync_job_id: string;
  google_contact: GoogleContact;
  matched_patients: DuplicateMatch[];
  status: DuplicateStatus;
  resolution: DuplicateResolution | null;
  resolved_patient_id: string | null;
  highest_confidence: number;
  match_reasons: string[];
  created_at: string;
}

export interface SyncJobProgress {
  id: string;
  status: SyncJobStatus;
  job_type: SyncJobType;
  total_contacts: number;
  processed_contacts: number;
  created_patients: number;
  updated_patients: number;
  skipped_contacts: number;
  duplicates_found: number;
  duplicates_resolved: number;
  pending_duplicates_count: number;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface AuthUrlResponse {
  auth_url: string;
  state: string;
}

export interface ResolveDuplicateRequest {
  resolution: DuplicateResolution;
  merge_fields?: Record<string, 'google' | 'existing'>;
}

export interface BatchResolveResult {
  success: number;
  failed: number;
  details: Array<{
    id: string;
    status: 'success' | 'failed';
    patient_id?: string;
  }>;
}

// ============== API Base Path ==============

const BASE_PATH = '/api/integrations/google-contacts';

// ============== Connection Status ==============

/**
 * Get the current Google Contacts connection status
 */
export async function getConnectionStatus(): Promise<GoogleContactsConnectionStatus> {
  const response = await api.get<GoogleContactsConnectionStatus>(`${BASE_PATH}/status`);
  return response.data;
}

// ============== OAuth Flow ==============

/**
 * Get the Google OAuth authorization URL
 */
export async function getAuthUrl(): Promise<AuthUrlResponse> {
  const response = await api.get<AuthUrlResponse>(`${BASE_PATH}/auth-url`);
  return response.data;
}

/**
 * Handle OAuth callback - exchange code for tokens
 */
export async function handleOAuthCallback(code: string, state: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`${BASE_PATH}/callback`, null, {
    params: { code, state },
  });
  return response.data;
}

/**
 * Disconnect Google account
 */
export async function disconnectGoogle(): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`${BASE_PATH}/disconnect`);
  return response.data;
}

// ============== Sync Operations ==============

/**
 * Start a new sync job
 */
export async function startSync(jobType: SyncJobType = 'initial'): Promise<SyncJobProgress> {
  const response = await api.post<SyncJobProgress>(`${BASE_PATH}/sync`, {
    job_type: jobType,
  });
  return response.data;
}

/**
 * Get sync job status
 */
export async function getSyncStatus(jobId: string): Promise<SyncJobProgress> {
  const response = await api.get<SyncJobProgress>(`${BASE_PATH}/sync-status/${jobId}`);
  return response.data;
}

/**
 * Cancel a running sync job
 */
export async function cancelSync(jobId: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`${BASE_PATH}/sync/cancel/${jobId}`);
  return response.data;
}

/**
 * Get sync history
 */
export async function getSyncHistory(limit: number = 10): Promise<SyncJobProgress[]> {
  const response = await api.get<SyncJobProgress[]>(`${BASE_PATH}/sync/history`, {
    params: { limit },
  });
  return response.data;
}

// ============== Duplicate Management ==============

/**
 * Get pending duplicates
 */
export async function getPendingDuplicates(
  limit: number = 50,
  offset: number = 0
): Promise<DuplicateRecord[]> {
  const response = await api.get<DuplicateRecord[]>(`${BASE_PATH}/duplicates`, {
    params: { limit, offset },
  });
  return response.data;
}

/**
 * Get count of pending duplicates
 */
export async function getPendingDuplicatesCount(): Promise<number> {
  const response = await api.get<{ count: number }>(`${BASE_PATH}/duplicates/count`);
  return response.data.count;
}

/**
 * Resolve a single duplicate
 */
export async function resolveDuplicate(
  duplicateId: string,
  request: ResolveDuplicateRequest
): Promise<{ success: boolean; patient_id: string; resolution: DuplicateResolution }> {
  const response = await api.post(`${BASE_PATH}/duplicates/${duplicateId}/resolve`, request);
  return response.data;
}

/**
 * Skip a duplicate without resolving
 */
export async function skipDuplicate(duplicateId: string): Promise<{ success: boolean }> {
  const response = await api.post(`${BASE_PATH}/duplicates/${duplicateId}/skip`);
  return response.data;
}

/**
 * Batch resolve multiple duplicates
 */
export async function batchResolveDuplicates(
  resolutions: Array<{ id: string; resolution: DuplicateResolution; merge_fields?: Record<string, string> }>
): Promise<BatchResolveResult> {
  const response = await api.post<BatchResolveResult>(`${BASE_PATH}/duplicates/batch-resolve`, {
    resolutions,
  });
  return response.data;
}

/**
 * Skip all pending duplicates
 */
export async function skipAllDuplicates(): Promise<{ success: boolean; skipped_count: number }> {
  const response = await api.post(`${BASE_PATH}/duplicates/skip-all`);
  return response.data;
}

// ============== Helper Functions ==============

/**
 * Get a human-readable status message
 */
export function getStatusMessage(status: SyncJobStatus): string {
  switch (status) {
    case 'pending':
      return 'Preparing to sync...';
    case 'in_progress':
      return 'Syncing contacts...';
    case 'completed':
      return 'Sync completed';
    case 'failed':
      return 'Sync failed';
    case 'cancelled':
      return 'Sync cancelled';
    default:
      return 'Unknown status';
  }
}

/**
 * Format confidence level for display
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Get a human-readable match reason
 */
export function formatMatchReason(reason: string): string {
  switch (reason) {
    case 'phone_exact':
      return 'Exact phone match';
    case 'phone_last_10':
      return 'Phone match (without country code)';
    case 'email_exact':
      return 'Exact email match';
    default:
      if (reason.startsWith('name_fuzzy_')) {
        const percent = reason.replace('name_fuzzy_', '');
        return `Name similarity (${percent}%)`;
      }
      return reason;
  }
}

// Export all functions as a service object for convenience
export const GoogleContactsService = {
  // Connection
  getConnectionStatus,
  getAuthUrl,
  handleOAuthCallback,
  disconnectGoogle,

  // Sync
  startSync,
  getSyncStatus,
  cancelSync,
  getSyncHistory,

  // Duplicates
  getPendingDuplicates,
  getPendingDuplicatesCount,
  resolveDuplicate,
  skipDuplicate,
  batchResolveDuplicates,
  skipAllDuplicates,

  // Helpers
  getStatusMessage,
  formatConfidence,
  formatMatchReason,
};

export default GoogleContactsService;
