/**
 * Offline Queue Service
 *
 * A generic offline queue that can be reused for various operations including:
 * - Google Contacts sync
 * - Other integrations that need offline support
 *
 * Features:
 * - Queue operations when offline
 * - Automatic retry with exponential backoff
 * - Persist queue to AsyncStorage
 * - Process queue when connectivity is restored
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Queue storage key
const QUEUE_STORAGE_KEY = 'offline_queue';

// Job types
export type OfflineJobType = 'google_contacts_sync' | 'patient_sync' | 'other';

// Job status
export type OfflineJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Job interface
export interface OfflineJob {
  id: string;
  type: OfflineJobType;
  payload: Record<string, any>;
  status: OfflineJobStatus;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

// Job handler type
export type JobHandler = (job: OfflineJob) => Promise<void>;

class OfflineQueueService {
  private queue: OfflineJob[] = [];
  private handlers: Map<OfflineJobType, JobHandler> = new Map();
  private isProcessing = false;
  private unsubscribeNetInfo: (() => void) | null = null;
  // Track retry timer to prevent multiple concurrent retry loops
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  // Track total retries in current session to prevent infinite loops
  private sessionRetryCount = 0;
  private readonly MAX_SESSION_RETRIES = 50;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the queue service
   */
  private async initialize() {
    // Load persisted queue
    await this.loadQueue();

    // Listen for network changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetworkChange);
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange = async (state: NetInfoState) => {
    if (state.isConnected && state.isInternetReachable) {
      // Network is back, process pending jobs
      await this.processQueue();
    }
  };

  /**
   * Register a handler for a job type
   */
  registerHandler(type: OfflineJobType, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  /**
   * Unregister a handler
   */
  unregisterHandler(type: OfflineJobType) {
    this.handlers.delete(type);
  }

  /**
   * Load queue from storage
   */
  private async loadQueue() {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Persist queue to storage
   */
  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  /**
   * Generate a unique job ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Queue a job for later execution
   */
  async enqueue(
    type: OfflineJobType,
    payload: Record<string, any>,
    maxRetries: number = 3
  ): Promise<string> {
    const job: OfflineJob = {
      id: this.generateId(),
      type,
      payload,
      status: 'pending',
      retryCount: 0,
      maxRetries,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.queue.push(job);
    await this.saveQueue();

    console.log(`[OfflineQueue] Job queued: ${job.id} (${type})`);

    // Try to process immediately if online
    const netState = await NetInfo.fetch();
    if (netState.isConnected && netState.isInternetReachable) {
      this.processQueue();
    }

    return job.id;
  }

  /**
   * Cancel a pending job
   */
  async cancel(jobId: string): Promise<boolean> {
    const index = this.queue.findIndex(j => j.id === jobId);
    if (index === -1) return false;

    const job = this.queue[index];
    if (job.status === 'processing') {
      // Cannot cancel a job that's already processing
      return false;
    }

    this.queue.splice(index, 1);
    await this.saveQueue();

    console.log(`[OfflineQueue] Job cancelled: ${jobId}`);
    return true;
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): OfflineJob | undefined {
    return this.queue.find(j => j.id === jobId);
  }

  /**
   * Get all jobs of a specific type
   */
  getJobsByType(type: OfflineJobType): OfflineJob[] {
    return this.queue.filter(j => j.type === type);
  }

  /**
   * Get queue status
   */
  getStatus(): { pending: number; processing: number; failed: number } {
    return {
      pending: this.queue.filter(j => j.status === 'pending').length,
      processing: this.queue.filter(j => j.status === 'processing').length,
      failed: this.queue.filter(j => j.status === 'failed').length,
    };
  }

  /**
   * Process pending jobs in the queue
   */
  async processQueue(): Promise<void> {
    // Clear any pending retry timer to prevent duplicate processing
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    if (this.isProcessing) {
      console.log('[OfflineQueue] Already processing queue');
      return;
    }

    // Check session retry limit to prevent infinite loops
    if (this.sessionRetryCount >= this.MAX_SESSION_RETRIES) {
      console.warn('[OfflineQueue] Max session retries reached, stopping automatic retries');
      return;
    }

    // Check network status
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      console.log('[OfflineQueue] No network connection, skipping queue processing');
      return;
    }

    this.isProcessing = true;
    console.log('[OfflineQueue] Starting queue processing');

    try {
      // Get pending jobs
      const pendingJobs = this.queue.filter(j => j.status === 'pending');

      for (const job of pendingJobs) {
        await this.processJob(job);
      }

      // Clean up completed jobs
      this.queue = this.queue.filter(j => j.status !== 'completed');
      await this.saveQueue();

      // Reset session retry count if all jobs are done
      const remainingPending = this.queue.filter(j => j.status === 'pending').length;
      if (remainingPending === 0) {
        this.sessionRetryCount = 0;
      }

    } finally {
      this.isProcessing = false;
      console.log('[OfflineQueue] Queue processing complete');
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: OfflineJob): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      console.warn(`[OfflineQueue] No handler for job type: ${job.type}`);
      return;
    }

    // Mark as processing
    job.status = 'processing';
    job.updatedAt = Date.now();
    await this.saveQueue();

    try {
      console.log(`[OfflineQueue] Processing job: ${job.id} (${job.type})`);
      await handler(job);

      // Mark as completed
      job.status = 'completed';
      job.updatedAt = Date.now();
      console.log(`[OfflineQueue] Job completed: ${job.id}`);

    } catch (error: any) {
      console.error(`[OfflineQueue] Job failed: ${job.id}`, error);

      job.lastError = error.message || 'Unknown error';
      job.retryCount += 1;
      job.updatedAt = Date.now();

      if (job.retryCount >= job.maxRetries) {
        job.status = 'failed';
        console.log(`[OfflineQueue] Job max retries reached: ${job.id}`);
      } else {
        // Increment session retry count
        this.sessionRetryCount += 1;

        // Check if we've hit session limit
        if (this.sessionRetryCount >= this.MAX_SESSION_RETRIES) {
          console.warn(`[OfflineQueue] Session retry limit reached, marking job as failed: ${job.id}`);
          job.status = 'failed';
          job.lastError = 'Max session retries exceeded';
        } else {
          // Calculate exponential backoff delay
          const delay = Math.min(1000 * Math.pow(2, job.retryCount), 60000);
          console.log(`[OfflineQueue] Job will retry in ${delay}ms: ${job.id} (session retry ${this.sessionRetryCount}/${this.MAX_SESSION_RETRIES})`);

          job.status = 'pending';

          // Schedule retry with tracked timer
          this.retryTimer = setTimeout(() => this.processQueue(), delay);
        }
      }
    }

    await this.saveQueue();
  }

  /**
   * Clear all jobs
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    console.log('[OfflineQueue] Queue cleared');
  }

  /**
   * Clear completed and failed jobs
   */
  async clearFinished(): Promise<void> {
    this.queue = this.queue.filter(
      j => j.status !== 'completed' && j.status !== 'failed'
    );
    await this.saveQueue();
    console.log('[OfflineQueue] Finished jobs cleared');
  }

  /**
   * Retry failed jobs
   */
  async retryFailed(): Promise<void> {
    const failedJobs = this.queue.filter(j => j.status === 'failed');
    for (const job of failedJobs) {
      job.status = 'pending';
      job.retryCount = 0;
      job.lastError = undefined;
      job.updatedAt = Date.now();
    }
    await this.saveQueue();
    await this.processQueue();
  }

  /**
   * Reset session retry counter (call after app restart or manual intervention)
   */
  resetSessionRetries(): void {
    this.sessionRetryCount = 0;
    console.log('[OfflineQueue] Session retry counter reset');
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }
}

// Create singleton instance
export const offlineQueueService = new OfflineQueueService();

// Export default
export default offlineQueueService;
