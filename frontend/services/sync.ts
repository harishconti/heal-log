import axios from 'axios';
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '@/models/database';
import { addBreadcrumb } from '@/utils/monitoring';

const BACKEND_URL = 'https://doctor-log-production.up.railway.app';

export async function sync() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      addBreadcrumb('sync', `Pulling changes from server since ${lastPulledAt}`);
      try {
        const token = axios.defaults.headers.common['Authorization'];
        console.warn('Syncing with token:', token);
        console.warn('Sync pull params (raw):', { last_pulled_at: lastPulledAt });

        // Ensure last_pulled_at is sent as 'null' string if it is null/undefined, 
        // because axios might omit it otherwise, and backend might expect it.
        const params = {
          last_pulled_at: lastPulledAt !== null && lastPulledAt !== undefined ? lastPulledAt : 'null'
        };

        // The backend expects POST for pull
        const response = await axios.post(`${BACKEND_URL}/api/sync/pull`, null, {
          params,
        });

        if (response.status !== 200) {
          throw new Error(await response.data);
        }

        const { changes, timestamp } = response.data;
        addBreadcrumb('sync', `Successfully pulled ${Object.keys(changes).length} changes`);
        return { changes, timestamp };

      } catch (error) {
        console.error('Sync pull error (Graceful degradation):', error);
        addBreadcrumb('sync', 'Pull changes failed (returning empty)', 'error');
        // Return empty changes to prevent app crash/red screen on 500
        return { changes: {}, timestamp: lastPulledAt || Date.now() };
      }
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      addBreadcrumb('sync', `Pushing ${Object.keys(changes).length} changes to server`);
      try {
        const response = await axios.post(`${BACKEND_URL}/api/sync/push`, { changes }, {
          params: { last_pulled_at: lastPulledAt },
        });

        if (response.status !== 200) {
          throw new Error(await response.data);
        }
        addBreadcrumb('sync', 'Successfully pushed changes');
      } catch (error) {
        console.error('Sync push error:', error);
        addBreadcrumb('sync', 'Push changes failed', 'error');
        throw error;
      }
    },
    // migrationsEnabledAtUpdated: true,
  });
}