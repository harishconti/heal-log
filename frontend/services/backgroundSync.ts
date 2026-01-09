import { AppState, AppStateStatus, Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { sync } from './sync';
import { useAppStore } from '@/store/useAppStore';
import { addBreadcrumb } from '@/utils/monitoring';

// Development-only logging
const devLog = __DEV__
  ? (message: string, ...args: unknown[]) => console.log(message, ...args)
  : () => {};

// Sync configuration
const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes - periodic background sync
const MIN_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes - minimum between auto syncs (foreground)
const CHANGE_SYNC_DEBOUNCE_MS = 5 * 1000; // 5 seconds - debounce for change-based sync
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: number = 0;
  private isInitialized: boolean = false;
  private retryCount: number = 0;
  private appStateSubscription: { remove: () => void } | null = null;
  private netInfoSubscription: (() => void) | null = null;
  private isSyncing: boolean = false;
  private changeSyncDebounceTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }

  /**
   * Initialize the background sync service
   * Sets up listeners for network changes and app state changes
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      devLog('[BackgroundSync] Already initialized');
      return;
    }

    devLog('[BackgroundSync] Initializing...');
    addBreadcrumb('backgroundSync', 'Initializing background sync service');

    // Listen for app state changes (foreground/background)
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );

    // Listen for network state changes
    this.netInfoSubscription = NetInfo.addEventListener(
      this.handleNetworkChange
    );

    // Start periodic sync if enabled
    this.startPeriodicSync();

    this.isInitialized = true;
    devLog('[BackgroundSync] Initialized successfully');
  }

  /**
   * Cleanup and stop background sync
   */
  cleanup(): void {
    devLog('[BackgroundSync] Cleaning up...');

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.changeSyncDebounceTimer) {
      clearTimeout(this.changeSyncDebounceTimer);
      this.changeSyncDebounceTimer = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (this.netInfoSubscription) {
      this.netInfoSubscription();
      this.netInfoSubscription = null;
    }

    this.isInitialized = false;
    devLog('[BackgroundSync] Cleanup complete');
  }

  /**
   * Handle app state changes
   * Syncs when app comes to foreground
   */
  private handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
    const settings = useAppStore.getState().settings;

    if (nextAppState === 'active' && settings.backgroundSyncEnabled) {
      devLog('[BackgroundSync] App became active, checking sync...');
      addBreadcrumb('backgroundSync', 'App became active');

      // Check if enough time has passed since last sync
      const now = Date.now();
      if (now - this.lastSyncTime >= MIN_SYNC_INTERVAL_MS) {
        await this.performSync('app_active');
      }
    }
  };

  /**
   * Handle network state changes
   * Syncs when coming back online
   */
  private handleNetworkChange = async (state: NetInfoState): Promise<void> => {
    const settings = useAppStore.getState().settings;
    const store = useAppStore.getState();

    const isOnline = state.isConnected && state.isInternetReachable !== false;

    // Update offline status in store
    store.setOffline(!isOnline);

    if (isOnline && settings.backgroundSyncEnabled) {
      devLog('[BackgroundSync] Network became available');
      addBreadcrumb('backgroundSync', 'Network available');

      // Check for pending changes and sync
      if (store.syncState.pendingChanges > 0) {
        devLog('[BackgroundSync] Found pending changes, syncing...');
        await this.performSync('network_restored');
      }
    }
  };

  /**
   * Start periodic sync interval
   */
  private startPeriodicSync(): void {
    const settings = useAppStore.getState().settings;

    if (!settings.backgroundSyncEnabled || !settings.autoSync) {
      devLog('[BackgroundSync] Periodic sync disabled');
      return;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      devLog('[BackgroundSync] Periodic sync triggered');
      await this.performSync('periodic');
    }, SYNC_INTERVAL_MS);

    devLog('[BackgroundSync] Periodic sync started (interval: 30 min)');
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      devLog('[BackgroundSync] Periodic sync stopped');
    }
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(trigger: 'app_active' | 'network_restored' | 'periodic' | 'manual' | 'change'): Promise<boolean> {
    if (this.isSyncing) {
      devLog('[BackgroundSync] Sync already in progress, skipping');
      return false;
    }

    const store = useAppStore.getState();
    const netInfo = await NetInfo.fetch();
    const isOnline = netInfo.isConnected && netInfo.isInternetReachable !== false;

    if (!isOnline) {
      devLog('[BackgroundSync] No network, skipping sync');
      return false;
    }

    this.isSyncing = true;
    store.setSyncStatus('syncing');
    store.setLoading('sync', true);

    devLog(`[BackgroundSync] Starting sync (trigger: ${trigger})`);
    addBreadcrumb('backgroundSync', `Sync started: ${trigger}`);

    try {
      await sync();

      this.lastSyncTime = Date.now();
      this.retryCount = 0;

      store.recordSyncAttempt(true);
      store.setPendingChanges(0);

      devLog('[BackgroundSync] Sync completed successfully');
      addBreadcrumb('backgroundSync', 'Sync completed successfully');

      return true;
    } catch (error: any) {
      devLog('[BackgroundSync] Sync failed:', error.message);
      addBreadcrumb('backgroundSync', `Sync failed: ${error.message}`, 'error');

      store.recordSyncAttempt(false);

      // Retry logic
      if (this.retryCount < MAX_RETRY_ATTEMPTS) {
        this.retryCount++;
        devLog(`[BackgroundSync] Scheduling retry ${this.retryCount}/${MAX_RETRY_ATTEMPTS}`);

        setTimeout(() => {
          this.performSync('manual');
        }, RETRY_DELAY_MS * this.retryCount);
      }

      return false;
    } finally {
      this.isSyncing = false;
      store.setLoading('sync', false);
    }
  }

  /**
   * Manually trigger a sync
   */
  async triggerSync(): Promise<boolean> {
    devLog('[BackgroundSync] Manual sync triggered');
    this.retryCount = 0;
    return this.performSync('manual');
  }

  /**
   * Trigger sync after data changes (debounced)
   * Called when local data is mutated (create, update, delete)
   * Debounces multiple rapid changes into a single sync
   */
  triggerChangeSync(): void {
    const settings = useAppStore.getState().settings;

    if (!settings.backgroundSyncEnabled) {
      devLog('[BackgroundSync] Change sync skipped - background sync disabled');
      return;
    }

    // Clear any existing debounce timer
    if (this.changeSyncDebounceTimer) {
      clearTimeout(this.changeSyncDebounceTimer);
    }

    devLog('[BackgroundSync] Change detected, scheduling sync in 5s...');
    addBreadcrumb('backgroundSync', 'Change-based sync scheduled');

    // Debounce: wait 5 seconds after last change before syncing
    this.changeSyncDebounceTimer = setTimeout(async () => {
      devLog('[BackgroundSync] Executing debounced change sync');
      this.changeSyncDebounceTimer = null;
      await this.performSync('change');
    }, CHANGE_SYNC_DEBOUNCE_MS);
  }

  /**
   * Cancel any pending change-based sync
   * Useful when navigating away or when manual sync is triggered
   */
  cancelPendingChangeSync(): void {
    if (this.changeSyncDebounceTimer) {
      clearTimeout(this.changeSyncDebounceTimer);
      this.changeSyncDebounceTimer = null;
      devLog('[BackgroundSync] Pending change sync cancelled');
    }
  }

  /**
   * Check if sync is currently in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get the time of last successful sync
   */
  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  /**
   * Update sync settings
   */
  updateSettings(enabled: boolean): void {
    if (enabled) {
      this.startPeriodicSync();
    } else {
      this.stopPeriodicSync();
    }
  }
}

// Export singleton instance
export const backgroundSyncService = BackgroundSyncService.getInstance();

// Export convenience functions
export const initializeBackgroundSync = () => backgroundSyncService.initialize();
export const cleanupBackgroundSync = () => backgroundSyncService.cleanup();
export const triggerBackgroundSync = () => backgroundSyncService.triggerSync();
export const triggerChangeBasedSync = () => backgroundSyncService.triggerChangeSync();
export const cancelPendingSync = () => backgroundSyncService.cancelPendingChangeSync();
export const isBackgroundSyncInProgress = () => backgroundSyncService.isSyncInProgress();
