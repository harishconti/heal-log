/**
 * useGoogleContactsSync Hook
 *
 * Provides a complete interface for managing Google Contacts synchronization:
 * - Connection state (connect, disconnect)
 * - Sync operations (start, poll, cancel)
 * - Duplicate management
 * - Loading and error states
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleContactsService,
  GoogleContactsConnectionStatus,
  SyncJobProgress,
  DuplicateRecord,
  DuplicateResolution,
  SyncJobStatus,
} from '@/services/googleContactsService';

// Polling interval for sync status (ms)
const POLL_INTERVAL = 2000;

export interface UseGoogleContactsSyncReturn {
  // Connection state
  isConnected: boolean;
  connectionStatus: GoogleContactsConnectionStatus | null;
  connectionLoading: boolean;
  connectionError: string | null;

  // Sync state
  syncJob: SyncJobProgress | null;
  syncLoading: boolean;
  syncError: string | null;
  isSyncing: boolean;

  // Duplicates state
  duplicates: DuplicateRecord[];
  duplicatesCount: number;
  duplicatesLoading: boolean;
  duplicatesError: string | null;
  hasPendingDuplicates: boolean;

  // Connection actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshConnectionStatus: () => Promise<void>;

  // Sync actions
  startSync: (incremental?: boolean) => Promise<void>;
  cancelSync: () => Promise<void>;

  // Duplicate actions
  loadDuplicates: () => Promise<void>;
  resolveDuplicate: (
    duplicateId: string,
    resolution: DuplicateResolution,
    mergeFields?: Record<string, 'google' | 'existing'>
  ) => Promise<void>;
  skipDuplicate: (duplicateId: string) => Promise<void>;
  skipAllDuplicates: () => Promise<void>;

  // Helpers
  canSync: boolean;
  reset: () => void;
}

export function useGoogleContactsSync(): UseGoogleContactsSyncReturn {
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<GoogleContactsConnectionStatus | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Sync state
  const [syncJob, setSyncJob] = useState<SyncJobProgress | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Duplicates state
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [duplicatesError, setDuplicatesError] = useState<string | null>(null);

  // Refs for polling
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Derived state
  const isConnected = connectionStatus?.is_connected ?? false;
  const isSyncing = syncJob?.status === 'pending' || syncJob?.status === 'in_progress';
  const hasPendingDuplicates = duplicatesCount > 0;
  const canSync = isConnected && !isSyncing;

  // ============== Connection Actions ==============

  const refreshConnectionStatus = useCallback(async () => {
    if (!isMountedRef.current) return;

    setConnectionLoading(true);
    setConnectionError(null);

    try {
      const status = await GoogleContactsService.getConnectionStatus();
      if (isMountedRef.current) {
        setConnectionStatus(status);
      }
    } catch (error: any) {
      console.error('Error fetching connection status:', error);
      if (isMountedRef.current) {
        setConnectionError(error.message || 'Failed to check connection status');
      }
    } finally {
      if (isMountedRef.current) {
        setConnectionLoading(false);
      }
    }
  }, []);

  const connect = useCallback(async () => {
    setConnectionLoading(true);
    setConnectionError(null);

    try {
      // Get auth URL
      const { auth_url, state } = await GoogleContactsService.getAuthUrl();

      // Open browser for OAuth
      if (Platform.OS === 'web') {
        // For web, open in new window and listen for callback
        window.open(auth_url, '_blank', 'width=500,height=600');
        // Note: Web callback handling would need to be implemented separately
      } else {
        // For native, use WebBrowser
        const result = await WebBrowser.openAuthSessionAsync(
          auth_url,
          'heallog://google-contacts/callback'
        );

        if (result.type === 'success' && result.url) {
          // Parse the callback URL
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          const returnedState = url.searchParams.get('state');

          if (code && returnedState) {
            // Exchange code for tokens
            await GoogleContactsService.handleOAuthCallback(code, returnedState);
            await refreshConnectionStatus();
          }
        } else if (result.type === 'cancel') {
          throw new Error('OAuth flow was cancelled');
        }
      }
    } catch (error: any) {
      console.error('Error connecting Google:', error);
      if (isMountedRef.current) {
        setConnectionError(error.message || 'Failed to connect Google account');
      }
    } finally {
      if (isMountedRef.current) {
        setConnectionLoading(false);
      }
    }
  }, [refreshConnectionStatus]);

  const disconnect = useCallback(async () => {
    setConnectionLoading(true);
    setConnectionError(null);

    try {
      await GoogleContactsService.disconnectGoogle();
      if (isMountedRef.current) {
        setConnectionStatus({
          is_connected: false,
          connected_at: null,
          last_sync_at: null,
          total_synced_patients: 0,
        });
        setSyncJob(null);
        setDuplicates([]);
        setDuplicatesCount(0);
      }
    } catch (error: any) {
      console.error('Error disconnecting Google:', error);
      if (isMountedRef.current) {
        setConnectionError(error.message || 'Failed to disconnect Google account');
      }
    } finally {
      if (isMountedRef.current) {
        setConnectionLoading(false);
      }
    }
  }, []);

  // ============== Sync Actions ==============

  const pollSyncStatus = useCallback(async (jobId: string) => {
    try {
      const status = await GoogleContactsService.getSyncStatus(jobId);
      if (isMountedRef.current) {
        setSyncJob(status);

        // Stop polling if sync is complete
        if (status.status !== 'pending' && status.status !== 'in_progress') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // Load duplicates if any were found
          if (status.pending_duplicates_count > 0) {
            loadDuplicates();
          }

          // Refresh connection status to update last_sync_at
          refreshConnectionStatus();
        }
      }
    } catch (error) {
      console.error('Error polling sync status:', error);
    }
  }, [refreshConnectionStatus]);

  const startSync = useCallback(async (incremental: boolean = false) => {
    setSyncLoading(true);
    setSyncError(null);

    try {
      const job = await GoogleContactsService.startSync(incremental ? 'incremental' : 'initial');
      if (isMountedRef.current) {
        setSyncJob(job);

        // Start polling
        pollIntervalRef.current = setInterval(() => {
          pollSyncStatus(job.id);
        }, POLL_INTERVAL);
      }
    } catch (error: any) {
      console.error('Error starting sync:', error);
      if (isMountedRef.current) {
        setSyncError(error.response?.data?.detail || error.message || 'Failed to start sync');
      }
    } finally {
      if (isMountedRef.current) {
        setSyncLoading(false);
      }
    }
  }, [pollSyncStatus]);

  const cancelSync = useCallback(async () => {
    if (!syncJob) return;

    try {
      await GoogleContactsService.cancelSync(syncJob.id);
      // The poll will pick up the cancelled status
    } catch (error: any) {
      console.error('Error cancelling sync:', error);
      if (isMountedRef.current) {
        setSyncError(error.message || 'Failed to cancel sync');
      }
    }
  }, [syncJob]);

  // ============== Duplicate Actions ==============

  const loadDuplicates = useCallback(async () => {
    setDuplicatesLoading(true);
    setDuplicatesError(null);

    try {
      const [dups, count] = await Promise.all([
        GoogleContactsService.getPendingDuplicates(),
        GoogleContactsService.getPendingDuplicatesCount(),
      ]);

      if (isMountedRef.current) {
        setDuplicates(dups);
        setDuplicatesCount(count);
      }
    } catch (error: any) {
      console.error('Error loading duplicates:', error);
      if (isMountedRef.current) {
        setDuplicatesError(error.message || 'Failed to load duplicates');
      }
    } finally {
      if (isMountedRef.current) {
        setDuplicatesLoading(false);
      }
    }
  }, []);

  const resolveDuplicate = useCallback(async (
    duplicateId: string,
    resolution: DuplicateResolution,
    mergeFields?: Record<string, 'google' | 'existing'>
  ) => {
    try {
      await GoogleContactsService.resolveDuplicate(duplicateId, {
        resolution,
        merge_fields: mergeFields,
      });

      // Remove from local state
      if (isMountedRef.current) {
        setDuplicates(prev => prev.filter(d => d.id !== duplicateId));
        setDuplicatesCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error('Error resolving duplicate:', error);
      throw error;
    }
  }, []);

  const skipDuplicate = useCallback(async (duplicateId: string) => {
    try {
      await GoogleContactsService.skipDuplicate(duplicateId);

      // Remove from local state
      if (isMountedRef.current) {
        setDuplicates(prev => prev.filter(d => d.id !== duplicateId));
        setDuplicatesCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error('Error skipping duplicate:', error);
      throw error;
    }
  }, []);

  const skipAllDuplicates = useCallback(async () => {
    setDuplicatesLoading(true);

    try {
      await GoogleContactsService.skipAllDuplicates();

      if (isMountedRef.current) {
        setDuplicates([]);
        setDuplicatesCount(0);
      }
    } catch (error: any) {
      console.error('Error skipping all duplicates:', error);
      if (isMountedRef.current) {
        setDuplicatesError(error.message || 'Failed to skip duplicates');
      }
    } finally {
      if (isMountedRef.current) {
        setDuplicatesLoading(false);
      }
    }
  }, []);

  // ============== Reset ==============

  const reset = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    setConnectionStatus(null);
    setConnectionLoading(false);
    setConnectionError(null);
    setSyncJob(null);
    setSyncLoading(false);
    setSyncError(null);
    setDuplicates([]);
    setDuplicatesCount(0);
    setDuplicatesLoading(false);
    setDuplicatesError(null);
  }, []);

  // ============== Initial Load ==============

  useEffect(() => {
    refreshConnectionStatus();
  }, [refreshConnectionStatus]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    connectionLoading,
    connectionError,

    // Sync state
    syncJob,
    syncLoading,
    syncError,
    isSyncing,

    // Duplicates state
    duplicates,
    duplicatesCount,
    duplicatesLoading,
    duplicatesError,
    hasPendingDuplicates,

    // Connection actions
    connect,
    disconnect,
    refreshConnectionStatus,

    // Sync actions
    startSync,
    cancelSync,

    // Duplicate actions
    loadDuplicates,
    resolveDuplicate,
    skipDuplicate,
    skipAllDuplicates,

    // Helpers
    canSync,
    reset,
  };
}

export default useGoogleContactsSync;
