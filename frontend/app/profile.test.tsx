import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ProfileScreen from './profile';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('expo-router', () => ({
    useRouter: () => ({
        back: jest.fn(),
        replace: jest.fn(),
        push: jest.fn(),
    }),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: '123',
            full_name: 'Test Doctor',
            email: 'test@example.com',
            plan: 'pro',
            subscription_status: 'active',
            subscription_end_date: '2025-12-31T00:00:00.000Z',
        },
        logout: jest.fn(),
    }),
}));
jest.mock('@/store/useAppStore', () => ({
    useAppStore: () => ({
        settings: { hapticEnabled: true },
        updateSettings: jest.fn(),
    }),
}));
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

describe('ProfileScreen', () => {
    it('renders correctly and fetches stats from the correct endpoint', async () => {
        const mockStats = {
            total_patients: 10,
            favorite_patients: 5,
            groups: [],
        };

        // Mock successful API response
        (axios.get as jest.Mock).mockResolvedValue({
            data: { stats: mockStats },
        });

        let tree;
        await act(async () => {
            tree = renderer.create(<ProfileScreen />);
        });

        // Verify API call
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/patients/stats/'));

        // Verify NOT calling the old subscription endpoint
        expect(axios.get).not.toHaveBeenCalledWith(expect.stringContaining('/api/subscription'));

        // Snapshot test to ensure UI structure is correct
        expect(tree.toJSON()).toMatchSnapshot();
    });

    it('handles API errors gracefully', async () => {
        // Mock API error
        (axios.get as jest.Mock).mockRejectedValue(new Error('Network Error'));

        let tree;
        await act(async () => {
            tree = renderer.create(<ProfileScreen />);
        });

        // Should still render without crashing
        expect(tree.toJSON()).toBeDefined();
    });
});
