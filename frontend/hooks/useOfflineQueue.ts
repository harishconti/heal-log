/**
 * useOfflineQueue Hook
 *
 * Provides React integration for the offline queue service.
 * Allows components to:
 * - Check queue status
 * - Queue jobs
 * - Monitor job progress
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import offlineQueueService, {
  OfflineJob,
  OfflineJobType,
} from '@/services/offlineQueueService';

export interface UseOfflineQueueReturn {
  // State
  isOnline: boolean;
  pendingCount: number;
  processingCount: number;
  failedCount: number;

  // Actions
  enqueue: (
    type: OfflineJobType,
    payload: Record<string, any>,
    maxRetries?: number
  ) => Promise<string>;
  cancel: (jobId: string) => Promise<boolean>;
  getJob: (jobId: string) => OfflineJob | undefined;
  getJobsByType: (type: OfflineJobType) => OfflineJob[];
  processQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
  clearFinished: () => Promise<void>;
  retryFailed: () => Promise<void>;

  // Helpers
  hasQueuedJobs: boolean;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState({
    pending: 0,
    processing: 0,
    failed: 0,
  });

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected && state.isInternetReachable === true);
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable === true);
    });

    return unsubscribe;
  }, []);

  // Update status periodically
  useEffect(() => {
    const updateStatus = () => {
      setStatus(offlineQueueService.getStatus());
    };

    // Initial status
    updateStatus();

    // Poll for updates (since we don't have events from the service)
    const interval = setInterval(updateStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  const enqueue = useCallback(
    async (
      type: OfflineJobType,
      payload: Record<string, any>,
      maxRetries?: number
    ) => {
      const jobId = await offlineQueueService.enqueue(type, payload, maxRetries);
      setStatus(offlineQueueService.getStatus());
      return jobId;
    },
    []
  );

  const cancel = useCallback(async (jobId: string) => {
    const result = await offlineQueueService.cancel(jobId);
    setStatus(offlineQueueService.getStatus());
    return result;
  }, []);

  const getJob = useCallback((jobId: string) => {
    return offlineQueueService.getJob(jobId);
  }, []);

  const getJobsByType = useCallback((type: OfflineJobType) => {
    return offlineQueueService.getJobsByType(type);
  }, []);

  const processQueue = useCallback(async () => {
    await offlineQueueService.processQueue();
    setStatus(offlineQueueService.getStatus());
  }, []);

  const clearQueue = useCallback(async () => {
    await offlineQueueService.clearQueue();
    setStatus(offlineQueueService.getStatus());
  }, []);

  const clearFinished = useCallback(async () => {
    await offlineQueueService.clearFinished();
    setStatus(offlineQueueService.getStatus());
  }, []);

  const retryFailed = useCallback(async () => {
    await offlineQueueService.retryFailed();
    setStatus(offlineQueueService.getStatus());
  }, []);

  return {
    // State
    isOnline,
    pendingCount: status.pending,
    processingCount: status.processing,
    failedCount: status.failed,

    // Actions
    enqueue,
    cancel,
    getJob,
    getJobsByType,
    processQueue,
    clearQueue,
    clearFinished,
    retryFailed,

    // Helpers
    hasQueuedJobs: status.pending > 0 || status.processing > 0,
  };
}

export default useOfflineQueue;
