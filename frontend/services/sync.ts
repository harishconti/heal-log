import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '@/models/database';
import { addBreadcrumb } from '@/utils/monitoring';
import * as SecureStore from 'expo-secure-store';
import api from './api';

const BACKEND_URL = 'https://doctor-log-production.up.railway.app';

export async function sync() {
  try {
    // Retrieve the auth token from SecureStore
    const token = await SecureStore.getItemAsync('token');
    
    if (!token) {
      console.warn('❌ No auth token found, skipping sync');
      addBreadcrumb('sync', 'No auth token found', 'warning');
      return;
    }

    // 🔍 DEBUG: Log token info (first/last 10 chars only for security)
    console.log('🔑 Token exists:', token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'null');
    console.log('🔑 Token length:', token?.length);

    // Set the auth token for this sync session
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 🔍 DEBUG: Log the actual header being sent
    const authHeader = api.defaults.headers.common['Authorization'];
    console.log('📤 Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'not set');

    console.log('🔄 [Sync] Starting sync process...');

    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        addBreadcrumb('sync', `Pulling changes from server since ${lastPulledAt}`);
        console.log('⬇️ [Sync] Starting pull...', { last_pulled_at: lastPulledAt });
        
        try {
          console.warn('Syncing with token:', token ? 'Token exists' : 'No token');
          console.warn('Sync pull params (raw):', { last_pulled_at: lastPulledAt });

          const params = {
            last_pulled_at: lastPulledAt !== null && lastPulledAt !== undefined ? lastPulledAt : null
          };

          // Use the centralized api instance with auth token
          const response = await api.post('/api/sync/pull', null, {
            params,
            timeout: 30000, // 30 second timeout
          });

          if (response.status !== 200) {
            throw new Error(JSON.stringify(response.data));
          }

          const { changes, timestamp } = response.data;
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
            }
          } else if (error.request) {
            console.error('❌ [Sync] Pull network error:', error.message);
            addBreadcrumb('sync', 'Network error', 'error');
          } else {
            console.error('❌ [Sync] Pull error:', error.message);
            addBreadcrumb('sync', 'Pull error', 'error');
          }
          
          // Graceful degradation - return empty changes
          return { changes: {}, timestamp: lastPulledAt || Date.now() };
        }
      },
      
      pushChanges: async ({ changes, lastPulledAt }) => {
        addBreadcrumb('sync', `Pushing ${Object.keys(changes).length} changes to server`);
        console.log('⬆️ [Sync] Starting push...', Object.keys(changes).length, 'changes');
        
        try {
          const response = await api.post('/api/sync/push', { changes }, {
            params: { last_pulled_at: lastPulledAt },
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
