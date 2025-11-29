import { sync } from './sync';
import { synchronize } from '@nozbe/watermelondb/sync';
import * as SecureStore from 'expo-secure-store';

// Mock dependencies
jest.mock('@nozbe/watermelondb/sync', () => ({
    synchronize: jest.fn(),
}));

jest.mock('@/models/database', () => ({
    database: {},
}));

jest.mock('@/utils/monitoring', () => ({
    addBreadcrumb: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
}));

jest.mock('./api', () => {
    const mockApi = {
        post: jest.fn(),
        defaults: { headers: { common: {} } },
    };
    return {
        __esModule: true,
        default: mockApi,
    };
});

describe('Sync Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('skips sync if no token found', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

        await sync();

        expect(synchronize).not.toHaveBeenCalled();
    });

    it('performs sync with correct parameters', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('mock-token');
        const api = require('./api').default;

        // Mock synchronize implementation to call pullChanges and pushChanges
        (synchronize as jest.Mock).mockImplementation(async ({ pullChanges, pushChanges }) => {
            // Simulate pull
            await pullChanges({ lastPulledAt: 1000 });
            // Simulate push
            await pushChanges({ changes: { patients: [] }, lastPulledAt: 1000 });
        });

        // Mock API responses
        api.post.mockResolvedValueOnce({
            status: 200,
            data: { changes: {}, timestamp: 2000 },
        }); // For pull
        api.post.mockResolvedValueOnce({
            status: 200,
            data: {},
        }); // For push

        await sync();

        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('token');
        expect(api.defaults.headers.common['Authorization']).toBe('Bearer mock-token');
        expect(synchronize).toHaveBeenCalled();

        // Verify API calls made by pull/push
        expect(api.post).toHaveBeenCalledWith('/api/sync/pull', null, expect.objectContaining({
            params: { last_pulled_at: 1000 },
        }));
        expect(api.post).toHaveBeenCalledWith('/api/sync/push', expect.objectContaining({
            changes: { patients: [] },
        }), expect.objectContaining({
            params: { last_pulled_at: 1000 },
        }));
    });

    it('handles pull error gracefully', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('mock-token');
        const api = require('./api').default;

        (synchronize as jest.Mock).mockImplementation(async ({ pullChanges }) => {
            await pullChanges({ lastPulledAt: 1000 });
        });

        api.post.mockRejectedValue(new Error('Network Error'));

        await sync();

        // Should not crash, but log error (which we can't easily assert without spying on console)
        // But we can assert that synchronize was called
        expect(synchronize).toHaveBeenCalled();
    });
});
