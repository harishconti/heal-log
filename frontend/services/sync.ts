import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '@/models/database';
import { addBreadcrumb } from '@/utils/monitoring';
import * as SecureStore from 'expo-secure-store';
import api from './api';
import { retrySyncOperation } from '@/utils/retry';

// Development-only logging helper
const devLog = __DEV__
  ? (message: string, ...args: unknown[]) => console.log(message, ...args)
  : () => { };
const devWarn = __DEV__
  ? (message: string, ...args: unknown[]) => console.warn(message, ...args)
  : () => { };
const devError = __DEV__
  ? (message: string, ...args: unknown[]) => console.error(message, ...args)
  : () => { };

// Production logging for critical sync events (temporary for debugging)
const prodLog = (message: string, ...args: unknown[]) => console.log('[SYNC-PROD]', message, ...args);

// Sync configuration
const BATCH_SIZE = 500;
const LARGE_SYNC_THRESHOLD = 1000;

// Sync health tracking
interface SyncHealth {
  consecutiveFailures: number;
  lastSuccessTime: number | null;
  lastFailureTime: number | null;
  lastError: string | null;
}

const syncHealth: SyncHealth = {
  consecutiveFailures: 0,
  lastSuccessTime: null,
  lastFailureTime: null,
  lastError: null,
};

const MAX_CONSECUTIVE_FAILURES = 5;

/**
 * Get the current sync health status
 */
export function getSyncHealth(): SyncHealth & { isHealthy: boolean } {
  return {
    ...syncHealth,
    isHealthy: syncHealth.consecutiveFailures < MAX_CONSECUTIVE_FAILURES,
  };
}

/**
 * Reset sync health (call after successful manual retry)
 */
export function resetSyncHealth(): void {
  syncHealth.consecutiveFailures = 0;
  syncHealth.lastError = null;
}

// Get sync statistics to determine sync strategy
export async function getSyncStats(lastPulledAt: number | null) {
  try {
    const response = await api.get('/api/sync/stats', {
      params: { last_pulled_at: lastPulledAt },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    devWarn('Failed to get sync stats, using standard sync');
    return { total: 0 };
  }
}

// Batched pull for large syncs
async function pullChangesBatched(lastPulledAt: number | null): Promise<{
  changes: Record<string, any>;
  timestamp: number;
}> {
  const allChanges: Record<string, any> = {
    patients: { created: [], updated: [], deleted: [] },
    clinical_notes: { created: [], updated: [], deleted: [] },
  };
  let timestamp = Date.now();
  let skipPatients = 0;
  let skipNotes = 0;
  let hasMore = true;
  let batchCount = 0;

  devLog('🔄 [Sync] Starting batched pull...');

  while (hasMore && batchCount < 20) { // Max 20 batches to prevent infinite loops
    batchCount++;
    devLog(`📦 [Sync] Fetching batch ${batchCount}...`);

    const response = await api.post('/api/sync/pull/batched', {
      last_pulled_at: lastPulledAt,
      changes: {}
    }, {
      params: {
        batch_size: BATCH_SIZE,
        skip_patients: skipPatients,
        skip_notes: skipNotes,
      },
      timeout: 30000,
    });

    const { changes, has_more, next_skip_patients, next_skip_notes, timestamp: newTimestamp } = response.data;

    // Merge changes
    for (const table of ['patients', 'clinical_notes']) {
      if (changes[table]) {
        allChanges[table].created.push(...(changes[table].created || []));
        allChanges[table].updated.push(...(changes[table].updated || []));
        // Only take deleted from first batch
        if (batchCount === 1) {
          allChanges[table].deleted.push(...(changes[table].deleted || []));
        }
      }
    }

    timestamp = newTimestamp;
    hasMore = has_more;
    skipPatients = next_skip_patients || 0;
    skipNotes = next_skip_notes || 0;

    devLog(`✅ [Sync] Batch ${batchCount} complete. Has more: ${hasMore}`);
  }

  const totalRecords =
    allChanges.patients.created.length + allChanges.patients.updated.length +
    allChanges.clinical_notes.created.length + allChanges.clinical_notes.updated.length;

  devLog(`✅ [Sync] Batched pull complete. Total records: ${totalRecords}`);

  return { changes: allChanges, timestamp };
}

export async function sync() {
  try {
    // Retrieve the auth token from SecureStore
    const token = await SecureStore.getItemAsync('token');

    if (!token) {
      prodLog('❌ No auth token found, skipping sync');
      devWarn('❌ No auth token found, skipping sync');
      addBreadcrumb('sync', 'No auth token found', 'warning');
      return;
    }

    prodLog('🔄 Starting sync process...');

    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        addBreadcrumb('sync', `Pulling changes from server since ${lastPulledAt}`);
        devLog('⬇️ [Sync] Starting pull...', { last_pulled_at: lastPulledAt });

        try {
          // Check if we need batched sync (for large datasets or first sync)
          const isFirstSync = lastPulledAt === null || lastPulledAt === undefined;
          prodLog('First sync?', isFirstSync, 'lastPulledAt:', lastPulledAt);
          let useBatchedSync = isFirstSync;

          // For subsequent syncs, check stats to determine if batched sync is needed
          if (!isFirstSync) {
            try {
              const stats = await getSyncStats(lastPulledAt);
              useBatchedSync = stats.total > LARGE_SYNC_THRESHOLD;
              if (useBatchedSync) {
                devLog(`📊 [Sync] Large sync detected (${stats.total} records), using batched sync`);
              }
            } catch {
              // If stats fail, use standard sync
              useBatchedSync = false;
            }
          }

          // Use batched sync for large datasets or first sync
          if (useBatchedSync) {
            prodLog('📦 Using batched sync');
            devLog('📦 [Sync] Using batched sync for better performance');
            addBreadcrumb('sync', 'Using batched sync for large dataset');

            const { changes, timestamp } = await pullChangesBatched(
              lastPulledAt !== null && lastPulledAt !== undefined ? lastPulledAt : null
            );

            const changeSummary = Object.entries(changes).reduce((acc, [key, value]: [string, any]) => {
              acc[key] = {
                created: value?.created?.length || 0,
                updated: value?.updated?.length || 0,
                deleted: value?.deleted?.length || 0,
              };
              return acc;
            }, {} as Record<string, { created: number; updated: number; deleted: number }>);

            prodLog('✅ Batched pull complete:', JSON.stringify(changeSummary));
            devLog('✅ [Sync] Batched pull complete:', changeSummary);
            return { changes, timestamp };
          }

          // Standard sync for small datasets
          // Wrap API call in retry logic
          const pullOperation = async () => {
            // Send as JSON body to match backend SyncRequest schema
            const response = await api.post('/api/sync/pull', {
              last_pulled_at: lastPulledAt !== null && lastPulledAt !== undefined ? lastPulledAt : null,
              changes: {} // Pull doesn't send changes, only push does
            }, {
              timeout: 30000, // 30 second timeout
            });

            if (response.status !== 200) {
              throw new Error(JSON.stringify(response.data));
            }

            return response;
          };

          // Execute with retry logic
          const response = await retrySyncOperation(pullOperation, 'Sync Pull');

          const { changes, timestamp } = response.data;

          // Log sync summary without sensitive data
          const changeSummary = Object.entries(changes).reduce((acc, [key, value]: [string, any]) => {
            acc[key] = {
              created: value?.created?.length || 0,
              updated: value?.updated?.length || 0,
              deleted: value?.deleted?.length || 0,
            };
            return acc;
          }, {} as Record<string, { created: number; updated: number; deleted: number }>);

          devLog('✅ [Sync] Successfully pulled changes:', changeSummary);
          addBreadcrumb('sync', `Successfully pulled ${Object.keys(changes).length} changes`);
          return { changes, timestamp };

        } catch (error: any) {
          if (error.response) {
            devError('❌ [Sync] Pull server error:', error.response.status, error.response.data);
            addBreadcrumb('sync', `Server error: ${error.response.status}`, 'error');

            // If 401, token might be expired
            if (error.response.status === 401) {
              devWarn('🔐 [Sync] Auth token expired or invalid');
              addBreadcrumb('sync', 'Auth token expired', 'warning');
              // Re-throw auth errors so the app can handle them properly
              throw error;
            }
          } else if (error.request) {
            devError('❌ [Sync] Pull network error:', error.message);
            addBreadcrumb('sync', 'Network error', 'error');
          } else {
            devError('❌ [Sync] Pull error:', error.message);
            addBreadcrumb('sync', 'Pull error', 'error');
          }

          // Track failure for health monitoring
          syncHealth.consecutiveFailures += 1;
          syncHealth.lastFailureTime = Date.now();
          syncHealth.lastError = error.message || 'Unknown sync error';

          // Log warning about consecutive failures
          if (syncHealth.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            prodLog(`⚠️ [Sync] ${syncHealth.consecutiveFailures} consecutive failures - sync health degraded`);
            addBreadcrumb('sync', `Sync health degraded: ${syncHealth.consecutiveFailures} failures`, 'error');
          }

          // Graceful degradation for non-auth errors - return empty changes with warning
          devWarn('⚠️ [Sync] Sync pull failed, returning empty changes for offline resilience');
          addBreadcrumb('sync', `Pull failed gracefully: ${error.message}`, 'warning');

          // Return last timestamp to avoid re-pulling same data on next sync
          // Using lastPulledAt ensures we don't lose sync position
          return { changes: {}, timestamp: lastPulledAt ?? Date.now() };
        }
      },

      pushChanges: async ({ changes, lastPulledAt }) => {
        addBreadcrumb('sync', `Pushing ${Object.keys(changes).length} changes to server`);
        devLog('⬆️ [Sync] Starting push...', Object.keys(changes).length, 'changes');

        try {
          const response = await api.post('/api/sync/push', {
            changes,
            last_pulled_at: lastPulledAt
          }, {
            timeout: 30000,
          });

          if (response.status !== 200) {
            throw new Error(JSON.stringify(response.data));
          }
          devLog('✅ [Sync] Successfully pushed changes');
          addBreadcrumb('sync', 'Successfully pushed changes');
        } catch (error: any) {
          if (error.response?.status === 401) {
            devError('❌ [Sync] Push auth error: Token expired or invalid');
            addBreadcrumb('sync', 'Auth error in push', 'error');
          } else {
            devError('❌ [Sync] Push error:', error);
            addBreadcrumb('sync', 'Push changes failed', 'error');
          }
          throw error;
        }
      },
    });

    // Reset failure tracking on success
    syncHealth.consecutiveFailures = 0;
    syncHealth.lastSuccessTime = Date.now();
    syncHealth.lastError = null;

    prodLog('✅ Sync completed successfully');
    devLog('✅ [Sync] Sync completed successfully');

  } catch (error: any) {
    prodLog('❌ Sync failed globally:', error?.message);
    devError('❌ [Sync] Sync failed globally:', error);
    devError('❌ [Sync] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    addBreadcrumb('sync', 'Sync failed globally (suppressed)', 'error');
    // Suppress the error to prevent app crash
  }
}
