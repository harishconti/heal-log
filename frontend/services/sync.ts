import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../models/database';
import axios from 'axios';
import { addBreadcrumb } from '../utils/monitoring';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function sync() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      addBreadcrumb('sync', `Pulling changes from server since ${lastPulledAt}`);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/sync/pull`, {
          params: { last_pulled_at: lastPulledAt },
        });

        if (response.status !== 200) {
          throw new Error(await response.data);
        }

        const { changes, timestamp } = response.data;
        addBreadcrumb('sync', `Successfully pulled ${Object.keys(changes).length} changes`);
        return { changes, timestamp };

      } catch (error) {
        console.error('Sync pull error:', error);
        addBreadcrumb('sync', 'Pull changes failed', 'error');
        throw error;
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