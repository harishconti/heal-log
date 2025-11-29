import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AuthProvider, useAuth } from './AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View, Button } from 'react-native';

// Mock dependencies
jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    multiRemove: jest.fn(),
}));
jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
    }),
    useSegments: () => [],
}));
jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('@/services/api', () => {
    const mockApi = {
        get: jest.fn(),
        post: jest.fn(),
        defaults: { headers: { common: {} } },
        interceptors: {
            request: { use: jest.fn(), eject: jest.fn() },
            response: { use: jest.fn(), eject: jest.fn() },
        },
    };
    return {
        __esModule: true,
        default: mockApi,
        authEvents: {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
        }
    };
});

// Test component to consume AuthContext
const TestComponent = () => {
    const { user, login, logout, isLoading } = useAuth();

    return (
        <View>
            <Text>{isLoading ? 'Loading' : 'Loaded'}</Text>
            <Text>{user ? `User: ${user.email}` : 'No User'}</Text>
            <Button title="Login" onPress={() => login('test@example.com', 'password')} />
            <Button title="Logout" onPress={logout} />
        </View>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('login stores token and updates user state', async () => {
        const mockUser = { id: '123', email: 'test@example.com', full_name: 'Test User' };
        const mockToken = 'fake-jwt-token';

        // Mock login response
        (axios.post as jest.Mock).mockResolvedValue({
            data: { access_token: mockToken, user: mockUser },
        });

        // Mock api.post as well since AuthContext uses it
        const api = require('@/services/api').default;
        api.post.mockResolvedValue({
            data: { access_token: mockToken, user: mockUser },
        });

        let tree;
        await act(async () => {
            tree = renderer.create(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );
        });

        const instance = tree.root;
        const loginButton = instance.findByProps({ title: 'Login' });

        await act(async () => {
            loginButton.props.onPress();
        });

        // Verify API call
        expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.any(Object), expect.any(Object));

        // Verify Token Storage (SecureStore is used for token)
        const SecureStore = require('expo-secure-store');
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', mockToken);
    });

    it('logout clears token and user state', async () => {
        let tree;
        await act(async () => {
            tree = renderer.create(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );
        });

        const instance = tree.root;
        const logoutButton = instance.findByProps({ title: 'Logout' });

        await act(async () => {
            logoutButton.props.onPress();
        });

        // Verify Token Removal
        const SecureStore = require('expo-secure-store');
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('patients_cache');
    });
});
