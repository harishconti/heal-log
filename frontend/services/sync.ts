import axios from 'axios';
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '@/models/database';
import { addBreadcrumb } from '@/utils/monitoring';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function sync() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      addBreadcrumb('sync', `Pulling changes from server since ${lastPulledAt}`);
      try {
        const token = axios.defaults.headers.common['Authorization'];
        // Ensure last_pulled_at is sent in the body
        const response = await axios.post(`${BACKEND_URL}/api/sync/pull`, {
          last_pulled_at: lastPulledAt || null,
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
        const response = await axios.post(`${BACKEND_URL}/api/sync/push`, {
          changes,
          last_pulled_at: lastPulledAt || null,
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
