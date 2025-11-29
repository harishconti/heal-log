import { sync } from './sync';
import { database } from '@/models/database';
import api from './api';
import * as SecureStore from 'expo-secure-store';
import { synchronize } from '@nozbe/watermelondb/sync';

// Mock dependencies
jest.mock('@/models/database', () => ({
    database: {},
}));

jest.mock('@/utils/monitoring', () => ({
    addBreadcrumb: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
}));

jest.mock('./api', () => ({
    defaults: { headers: { common: {} } },
    post: jest.fn(),
}));

jest.mock('@nozbe/watermelondb/sync', () => ({
    synchronize: jest.fn(),
}));

describe('Advanced Sync Scenarios', () => {
    let pullChangesFn: any;
    let pushChangesFn: any;

    beforeEach(() => {
        jest.clearAllMocks();
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid-token');

        // Capture the functions passed to synchronize
        (synchronize as jest.Mock).mockImplementation(async ({ pullChanges, pushChanges }) => {
            pullChangesFn = pullChanges;
            pushChangesFn = pushChanges;
        });
    });

    it('Initial Sync: pulls with null timestamp', async () => {
        await sync();

        expect(pullChangesFn).toBeDefined();

        (api.post as jest.Mock).mockResolvedValue({
            status: 200,
            data: { changes: {}, timestamp: 100 }
        });

        await pullChangesFn({ lastPulledAt: null });

        expect(api.post).toHaveBeenCalledWith('/api/sync/pull', null, expect.objectContaining({
            params: { last_pulled_at: null }
        }));
    });

    it('Incremental Sync: pulls with last timestamp', async () => {
        await sync();

        (api.post as jest.Mock).mockResolvedValue({
            status: 200,
            data: { changes: {}, timestamp: 200 }
        });

        await pullChangesFn({ lastPulledAt: 100 });

        expect(api.post).toHaveBeenCalledWith('/api/sync/pull', null, expect.objectContaining({
            params: { last_pulled_at: 100 }
        }));
    });

    it('Deleted Record Sync: pushes changes including deletions', async () => {
        await sync();

        const changes = {
            patients: { created: [], updated: [], deleted: ['p1'] },
            patient_notes: { created: [], updated: [], deleted: [] }
        };

        (api.post as jest.Mock).mockResolvedValue({ status: 200 });

        await pushChangesFn({ changes, lastPulledAt: 100 });

        expect(api.post).toHaveBeenCalledWith('/api/sync/push', { changes }, expect.anything());
    });

    it('Large Batch Sync: handles large response', async () => {
        await sync();

        // Simulate 1000 records
        const largeChanges = {
            patients: {
                created: Array(1000).fill({ id: 'p', name: 'Test' }),
                updated: [],
                deleted: []
            }
        };

        (api.post as jest.Mock).mockResolvedValue({
            status: 200,
            data: { changes: largeChanges, timestamp: 300 }
        });

        const result = await pullChangesFn({ lastPulledAt: 200 });

        expect(result.changes).toEqual(largeChanges);
        expect(result.timestamp).toBe(300);
    });

    it('Sync Interruption: retry uses correct timestamp', async () => {
        await sync();

        // 1. First attempt fails
        (api.post as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

        try {
            await pullChangesFn({ lastPulledAt: 200 });
        } catch (e) {
            // Expected to fail or return empty depending on implementation
        }

        // 2. Second attempt (retry) should still use the SAME timestamp (200), not advance
        (api.post as jest.Mock).mockResolvedValue({
            status: 200,
            data: { changes: {}, timestamp: 300 }
        });

        await pullChangesFn({ lastPulledAt: 200 });

        expect(api.post).toHaveBeenLastCalledWith('/api/sync/pull', null, expect.objectContaining({
            params: { last_pulled_at: 200 }
        }));
    });
});
