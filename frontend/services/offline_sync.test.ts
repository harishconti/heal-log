import { sync } from './sync';
import { database } from '@/models/database';
import api from './api';
import * as SecureStore from 'expo-secure-store';

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

import { synchronize } from '@nozbe/watermelondb/sync';

describe('Offline & Sync Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('sync skips if no token found', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

        await sync();

        expect(synchronize).not.toHaveBeenCalled();
    });

    it('sync proceeds with valid token', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid-token');
        (synchronize as jest.Mock).mockResolvedValue(undefined);

        await sync();

        expect(synchronize).toHaveBeenCalledWith(expect.objectContaining({
            database: expect.anything(),
            pullChanges: expect.any(Function),
            pushChanges: expect.any(Function),
        }));
    });

    it('pullChanges handles network error gracefully', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid-token');

        // We need to extract the pullChanges function passed to synchronize
        let pullChangesFn;
        (synchronize as jest.Mock).mockImplementation(async ({ pullChanges }) => {
            pullChangesFn = pullChanges;
        });

        await sync();

        expect(pullChangesFn).toBeDefined();

        // Simulate network error during pull
        (api.post as jest.Mock).mockRejectedValue({ message: 'Network Error', request: {} });

        // @ts-ignore
        const result = await pullChangesFn({ lastPulledAt: 1000 });

        // Should return empty changes instead of crashing
        expect(result).toEqual({ changes: {}, timestamp: 1000 });
    });
});
