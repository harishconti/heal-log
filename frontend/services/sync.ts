import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '@/models/database';
import { addBreadcrumb } from '@/utils/monitoring';
import * as SecureStore from 'expo-secure-store';
import api from './api';
import { retrySyncOperation } from '@/utils/retry';

// Development-only logging helper
const devLog = __DEV__
  ? (message: string, ...args: unknown[]) => console.log(message, ...args)
  : () => {};
const devWarn = __DEV__
  ? (message: string, ...args: unknown[]) => console.warn(message, ...args)
  : () => {};
const devError = __DEV__
  ? (message: string, ...args: unknown[]) => console.error(message, ...args)
  : () => {};

export async function sync() {
  try {
    // Retrieve the auth token from SecureStore
    const token = await SecureStore.getItemAsync('token');

    if (!token) {
      devWarn('❌ No auth token found, skipping sync');
      addBreadcrumb('sync', 'No auth token found', 'warning');
      return;
    }

    devLog('🔄 [Sync] Starting sync process...');

    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        addBreadcrumb('sync', `Pulling changes from server since ${lastPulledAt}`);
        devLog('⬇️ [Sync] Starting pull...', { last_pulled_at: lastPulledAt });

        try {
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

          // Graceful degradation for non-auth errors - return empty changes with warning
          // Track consecutive failures for monitoring
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

    devLog('✅ [Sync] Sync completed successfully');

  } catch (error: any) {
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
