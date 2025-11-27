import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { sync } from '@/services/sync';
import { submitFeedback } from '@/services/api';

const BACKEND_URL = 'https://doctor-log-production.up.railway.app';

export default function DebugConsole() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const { login, logout, user, token } = useAuth();
    const router = useRouter();

    const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] [${type.toUpperCase()}] ${message}`, ...prev]);
    };

    const clearLogs = () => setLogs([]);

    const runTest = async (name: string, testFn: () => Promise<any>) => {
        setLoading(true);
        addLog(`Starting test: ${name}...`, 'info');
        try {
            const result = await testFn();
            addLog(`${name} PASSED`, 'success');
            if (result) {
                addLog(`Result: ${JSON.stringify(result, null, 2)}`, 'info');
            }
        } catch (error: any) {
            addLog(`${name} FAILED`, 'error');
            addLog(`Error: ${error.message}`, 'error');
            if (error.response) {
                addLog(`Status: ${error.response.status}`, 'error');
                addLog(`Data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const testRegister = () => runTest('Register', async () => {
        const randomId = Math.floor(Math.random() * 10000);
        const email = `debug_user_${randomId}@example.com`;
        const password = 'Password123!';

        addLog(`Creating user: ${email}`, 'info');

        const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
            email,
            password,
            full_name: 'Debug User',
            phone: '1234567890',
            medical_specialty: 'General'
        });
        return response.data;
    });

    const testLogin = () => runTest('Login', async () => {
        // Use a hardcoded demo account or the one just created if we stored it (but simpler to just use a known one or fail if not registered)
        // For this debug console, let's try to login with a specific debug user, or ask user to register first.
        // Actually, let's just use the context login which might fail if we don't provide creds.
        // Let's use a standard test credential.
        const email = "test_user_12345@example.com"; // From our previous curl test
        const password = "Password123!";

        addLog(`Logging in as: ${email}`, 'info');
        await login(email, password);
        return "Login successful (Context updated)";
    });

    const testMe = () => runTest('Get Profile (Me)', async () => {
        if (!token) throw new Error("No token. Please login first.");
        const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    });

    const testSync = () => runTest('Sync (Pull & Push)', async () => {
        if (!token) throw new Error("No token. Please login first.");
        await sync();
        return "Sync completed";
    });

    const testFeedback = () => runTest('Submit Feedback', async () => {
        if (!token) throw new Error("No token. Please login first.");
        await submitFeedback({
            feedbackType: 'bug',
            description: 'Debug console test feedback',
            email: user?.email
        });
        return "Feedback submitted";
    });

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Debug Console', headerBackTitle: 'Back' }} />

            <View style={styles.controls}>
                <Text style={styles.sectionTitle}>Auth Tests</Text>
                <View style={styles.row}>
                    <TouchableOpacity style={styles.button} onPress={testRegister} disabled={loading}>
                        <Text style={styles.buttonText}>Register New</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={testLogin} disabled={loading}>
                        <Text style={styles.buttonText}>Login (Test User)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.logoutBtn]} onPress={logout} disabled={loading}>
                        <Text style={styles.buttonText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>API Tests (Requires Login)</Text>
                <View style={styles.row}>
                    <TouchableOpacity style={styles.button} onPress={testMe} disabled={loading}>
                        <Text style={styles.buttonText}>Get Me</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={testSync} disabled={loading}>
                        <Text style={styles.buttonText}>Run Sync</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={testFeedback} disabled={loading}>
                        <Text style={styles.buttonText}>Feedback</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.row}>
                    <TouchableOpacity style={[styles.button, styles.clearBtn]} onPress={clearLogs}>
                        <Text style={styles.buttonText}>Clear Logs</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.logsContainer}>
                <Text style={styles.logsTitle}>Logs</Text>
                <ScrollView style={styles.logsScroll}>
                    {logs.map((log, index) => (
                        <Text key={index} style={[
                            styles.logText,
                            log.includes('[ERROR]') && styles.errorText,
                            log.includes('[SUCCESS]') && styles.successText
                        ]}>
                            {log}
                        </Text>
                    ))}
                    {logs.length === 0 && <Text style={styles.emptyText}>No logs yet...</Text>}
                </ScrollView>
            </View>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    controls: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 8,
        marginTop: 8,
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    button: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        minWidth: 80,
        alignItems: 'center',
    },
    logoutBtn: {
        backgroundColor: '#757575',
    },
    clearBtn: {
        backgroundColor: '#607D8B',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    logsContainer: {
        flex: 1,
        padding: 16,
    },
    logsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    logsScroll: {
        flex: 1,
        backgroundColor: '#263238',
        borderRadius: 8,
        padding: 12,
    },
    logText: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#ECEFF1',
        marginBottom: 4,
    },
    errorText: {
        color: '#FF5252',
    },
    successText: {
        color: '#69F0AE',
    },
    emptyText: {
        color: '#546E7A',
        fontStyle: 'italic',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
