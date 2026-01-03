import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '@/models/database';
import { addBreadcrumb } from '@/utils/monitoring';
import * as SecureStore from 'expo-secure-store';
import api from './api';
import { retrySyncOperation } from '@/utils/retry';

export async function sync() {
  try {
    // Retrieve the auth token from SecureStore
    const token = await SecureStore.getItemAsync('token');

    if (!token) {
      console.warn('❌ No auth token found, skipping sync');
      addBreadcrumb('sync', 'No auth token found', 'warning');
      return;
    }

    console.log('🔄 [Sync] Starting sync process...');

    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        addBreadcrumb('sync', `Pulling changes from server since ${lastPulledAt}`);
        console.log('⬇️ [Sync] Starting pull...', { last_pulled_at: lastPulledAt });

        try {
          console.warn('Syncing with token:', token ? 'Token exists' : 'No token');
          console.warn('Sync pull timestamp:', lastPulledAt);

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

          // Debug: Log full changes to see timestamp format
          console.log('🔍 [Sync Debug] Raw changes received:', JSON.stringify(changes, null, 2));
          if (changes.clinical_notes?.created?.length > 0) {
            console.log('🔍 [Sync Debug] First note created_at:', changes.clinical_notes.created[0].created_at);
            console.log('🔍 [Sync Debug] First note updated_at:', changes.clinical_notes.created[0].updated_at);
          }

          console.log('✅ [Sync] Successfully pulled changes:', Object.keys(changes).length);
          addBreadcrumb('sync', `Successfully pulled ${Object.keys(changes).length} changes`);
          return { changes, timestamp };

        } catch (error: any) {
          if (error.response) {
            console.error('❌ [Sync] Pull server error:', error.response.status, error.response.data);
            addBreadcrumb('sync', `Server error: ${error.response.status}`, 'error');

            // If 401, token might be expired
            if (error.response.status === 401) {
              console.warn('🔐 [Sync] Auth token expired or invalid');
              addBreadcrumb('sync', 'Auth token expired', 'warning');
              // Re-throw auth errors so the app can handle them properly
              throw error;
            }
          } else if (error.request) {
            console.error('❌ [Sync] Pull network error:', error.message);
            addBreadcrumb('sync', 'Network error', 'error');
          } else {
            console.error('❌ [Sync] Pull error:', error.message);
            addBreadcrumb('sync', 'Pull error', 'error');
          }

          // Graceful degradation for non-auth errors - return empty changes with warning
          console.warn('⚠️ [Sync] Sync pull failed, returning empty changes for offline resilience');
          return { changes: {}, timestamp: lastPulledAt || Date.now() };
        }
      },

      pushChanges: async ({ changes, lastPulledAt }) => {
        addBreadcrumb('sync', `Pushing ${Object.keys(changes).length} changes to server`);
        console.log('⬆️ [Sync] Starting push...', Object.keys(changes).length, 'changes');

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
          console.log('✅ [Sync] Successfully pushed changes');
          addBreadcrumb('sync', 'Successfully pushed changes');
        } catch (error: any) {
          if (error.response?.status === 401) {
            console.error('❌ [Sync] Push auth error: Token expired or invalid');
            addBreadcrumb('sync', 'Auth error in push', 'error');
          } else {
            console.error('❌ [Sync] Push error:', error);
            addBreadcrumb('sync', 'Push changes failed', 'error');
          }
          throw error;
        }
      },
    });

    console.log('✅ [Sync] Sync completed successfully');

  } catch (error: any) {
    console.error('❌ [Sync] Sync failed globally:', error);
    console.error('❌ [Sync] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    addBreadcrumb('sync', 'Sync failed globally (suppressed)', 'error');
    // Suppress the error to prevent app crash
  }
}
