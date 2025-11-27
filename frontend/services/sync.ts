import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '@/models/database';
import { addBreadcrumb } from '@/utils/monitoring';

if (response.status !== 200) {
  throw new Error(JSON.stringify(response.data));
}

const { changes, timestamp } = response.data;
addBreadcrumb('sync', `Successfully pulled ${Object.keys(changes).length} changes`);
return { changes, timestamp };

        } catch (error: any) {
  if (error.response) {
    console.error('Sync pull server error:', error.response.status, error.response.data);
    addBreadcrumb('sync', `Server error: ${error.response.status}`, 'error');

    // If 401, token might be expired
    if (error.response.status === 401) {
      console.warn('Auth token expired or invalid');
      addBreadcrumb('sync', 'Auth token expired', 'warning');
    }
  } else if (error.request) {
    console.error('Sync pull network error:', error.message);
    addBreadcrumb('sync', 'Network error', 'error');
  } else {
    console.error('Sync pull error:', error.message);
    addBreadcrumb('sync', 'Pull error', 'error');
  }

  // Graceful degradation - return empty changes
  return { changes: {}, timestamp: lastPulledAt || Date.now() };
}
      },

pushChanges: async ({ changes, lastPulledAt }) => {
  addBreadcrumb('sync', `Pushing ${Object.keys(changes).length} changes to server`);
  try {
    const response = await api.post('/api/sync/push', { changes }, {
      params: { last_pulled_at: lastPulledAt },
    });

    if (response.status !== 200) {
      throw new Error(JSON.stringify(response.data));
    }
    addBreadcrumb('sync', 'Successfully pushed changes');
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('Sync push auth error: Token expired or invalid');
      addBreadcrumb('sync', 'Auth error in push', 'error');
    } else {
      console.error('Sync push error:', error);
      addBreadcrumb('sync', 'Push changes failed', 'error');
    }
    throw error;
  }
},
      // migrationsEnabledAtUpdated: true,
    });

console.log('Sync completed successfully');

  } catch (error: any) {
  console.error('Sync failed globally:', error);
  addBreadcrumb('sync', 'Sync failed globally (suppressed)', 'error');
  // Suppress the error to prevent app crash
}
}