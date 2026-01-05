/**
 * useGoogleContactsSync Hook
 *
 * Provides a complete interface for managing Google Contacts synchronization:
 * - Connection state (connect, disconnect)
 * - Sync operations (start, poll, cancel)
 * - Duplicate management
 * - Loading and error states
 * - Offline queue support
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Linking, Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import NetInfo from '@react-native-community/netinfo';
import {
  GoogleContactsService,
  GoogleContactsConnectionStatus,
  SyncJobProgress,
  DuplicateRecord,
  DuplicateResolution,
  SyncJobStatus,
} from '@/services/googleContactsService';
import offlineQueueService from '@/services/offlineQueueService';

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
  isQueuedOffline: boolean;

  // Duplicates state
  duplicates: DuplicateRecord[];
  duplicatesCount: number;
  duplicatesLoading: boolean;
  duplicatesError: string | null;
  hasPendingDuplicates: boolean;

  // Network state
  isOnline: boolean;

  // Connection actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshConnectionStatus: () => Promise<void>;

  // Sync actions
  startSync: (incremental?: boolean) => Promise<void>;
  cancelSync: () => Promise<void>;
  cancelQueuedSync: () => Promise<void>;

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

  // Offline queue state
  const [isOnline, setIsOnline] = useState(true);
  const [isQueuedOffline, setIsQueuedOffline] = useState(false);
  const [queuedJobId, setQueuedJobId] = useState<string | null>(null);

  // Duplicates state
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [duplicatesError, setDuplicatesError] = useState<string | null>(null);

  // Refs for polling
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (isMountedRef.current) {
        setIsOnline(state.isConnected && state.isInternetReachable === true);
      }
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      if (isMountedRef.current) {
        setIsOnline(state.isConnected && state.isInternetReachable === true);
      }
    });

    return unsubscribe;
  }, []);

  // Check for queued jobs on mount
  useEffect(() => {
    const queuedJobs = offlineQueueService.getJobsByType('google_contacts_sync');
    const pendingJob = queuedJobs.find(j => j.status === 'pending' || j.status === 'processing');
    if (pendingJob) {
      setIsQueuedOffline(true);
      setQueuedJobId(pendingJob.id);
    }
  }, []);

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
  const canSync = isConnected && !isSyncing && !isQueuedOffline;

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

    // Check if online
    const netState = await NetInfo.fetch();
    const online = netState.isConnected && netState.isInternetReachable;

    if (!online) {
      // Queue for offline processing
      try {
        const jobId = await offlineQueueService.enqueue('google_contacts_sync', {
          incremental,
        });
        if (isMountedRef.current) {
          setIsQueuedOffline(true);
          setQueuedJobId(jobId);
          setSyncLoading(false);
        }
        Alert.alert(
          'Sync Queued',
          'You are currently offline. The sync will start automatically when you are back online.'
        );
        return;
      } catch (error: any) {
        console.error('Error queuing sync:', error);
        if (isMountedRef.current) {
          setSyncError('Failed to queue sync for offline');
          setSyncLoading(false);
        }
        return;
      }
    }

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

  // ============== Offline Queue Actions ==============

  const cancelQueuedSync = useCallback(async () => {
    if (!queuedJobId) return;

    try {
      const success = await offlineQueueService.cancel(queuedJobId);
      if (success && isMountedRef.current) {
        setIsQueuedOffline(false);
        setQueuedJobId(null);
      }
    } catch (error: any) {
      console.error('Error cancelling queued sync:', error);
    }
  }, [queuedJobId]);

  // Register handler for offline queue processing
  useEffect(() => {
    offlineQueueService.registerHandler('google_contacts_sync', async (job) => {
      const { incremental } = job.payload;
      const syncJob = await GoogleContactsService.startSync(incremental ? 'incremental' : 'initial');

      // Poll until complete
      let status = syncJob;
      while (status.status === 'pending' || status.status === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        status = await GoogleContactsService.getSyncStatus(syncJob.id);
      }

      if (isMountedRef.current) {
        setSyncJob(status);
        setIsQueuedOffline(false);
        setQueuedJobId(null);

        // Load duplicates if found
        if (status.pending_duplicates_count > 0) {
          loadDuplicates();
        }
        refreshConnectionStatus();
      }
    });

    return () => {
      offlineQueueService.unregisterHandler('google_contacts_sync');
    };
  }, [loadDuplicates, refreshConnectionStatus]);

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
    setIsQueuedOffline(false);
    setQueuedJobId(null);
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
    isQueuedOffline,

    // Duplicates state
    duplicates,
    duplicatesCount,
    duplicatesLoading,
    duplicatesError,
    hasPendingDuplicates,

    // Network state
    isOnline,

    // Connection actions
    connect,
    disconnect,
    refreshConnectionStatus,

    // Sync actions
    startSync,
    cancelSync,
    cancelQueuedSync,

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
