import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, StatusBar, Platform, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import {
    checkBiometricCapabilities,
    enableBiometricLogin,
    disableBiometricLogin,
    BiometricCapabilities,
} from '@/services/biometricAuth';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import appJson from '@/app.json';

const SettingsScreen = () => {
    const { theme, fontScale } = useTheme();
    const { settings, updateSettings, lastSyncTime } = useAppStore();
    const { token } = useAuth();
    const router = useRouter();

    const formattedLastSync = useMemo(() => {
        if (!lastSyncTime) return 'Never synced';
        const date = new Date(lastSyncTime);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }, [lastSyncTime]);

    const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(null);
    const [biometricLoading, setBiometricLoading] = useState(false);
    const [checkingBiometrics, setCheckingBiometrics] = useState(true);

    useEffect(() => {
        const checkBiometrics = async () => {
            try {
                const capabilities = await checkBiometricCapabilities();
                setBiometricCapabilities(capabilities);
            } catch (error) {
                console.error('Error checking biometrics:', error);
            } finally {
                setCheckingBiometrics(false);
            }
        };
        checkBiometrics();
    }, []);

    const getBiometricIcon = (): keyof typeof Ionicons.glyphMap => {
        if (!biometricCapabilities) return 'finger-print';
        if (biometricCapabilities.biometricTypes.includes('facial')) {
            return Platform.OS === 'ios' ? 'scan' : 'happy-outline';
        }
        return 'finger-print';
    };

    const getBiometricLabel = (): string => {
        if (!biometricCapabilities) return 'Biometric Login';
        if (biometricCapabilities.biometricTypes.includes('facial')) {
            return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
        }
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    };

    const handleBiometricToggle = async (value: boolean) => {
        if (!token) {
            Alert.alert('Error', 'You must be logged in to enable biometric login');
            return;
        }

        setBiometricLoading(true);

        try {
            if (value) {
                const success = await enableBiometricLogin(token);
                if (success) {
                    Alert.alert(
                        'Success',
                        `${getBiometricLabel()} login is now enabled. You can use it to quickly sign in next time.`
                    );
                } else {
                    Alert.alert('Failed', 'Could not enable biometric login. Please try again.');
                }
            } else {
                const success = await disableBiometricLogin();
                if (success) {
                    Alert.alert('Disabled', `${getBiometricLabel()} login has been disabled.`);
                }
            }
        } catch (error) {
            console.error('Error toggling biometric:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setBiometricLoading(false);
        }
    };

    const themeOptions = [
        { value: 'light', label: 'Light', icon: 'sunny' },
        { value: 'dark', label: 'Dark', icon: 'moon' },
        { value: 'system', label: 'System', icon: 'phone-portrait' },
    ] as const;

    const fontSizeOptions = [
        { value: 'small', label: 'Small', sample: 14 },
        { value: 'medium', label: 'Medium', sample: 16 },
        { value: 'large', label: 'Large', sample: 18 },
    ] as const;

    const styles = createStyles(theme, fontScale);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Appearance Section */}
                <Card style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconContainer}>
                            <Ionicons name="color-palette-outline" size={18} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.sectionTitle}>Appearance</Text>
                    </View>

                    <Text style={styles.optionLabel}>Theme</Text>
                    <View style={styles.themeOptions}>
                        {themeOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.themeButton,
                                    settings.theme === option.value && styles.themeButtonActive
                                ]}
                                onPress={() => updateSettings({ theme: option.value })}
                            >
                                <Ionicons
                                    name={option.icon as any}
                                    size={22}
                                    color={settings.theme === option.value ? '#fff' : theme.colors.textSecondary}
                                />
                                <Text style={[
                                    styles.themeButtonText,
                                    settings.theme === option.value && styles.themeButtonTextActive
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.optionLabel, { marginTop: 20 }]}>Font Size</Text>
                    <View style={styles.fontSizeOptions}>
                        {fontSizeOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.fontSizeButton,
                                    settings.fontSize === option.value && styles.fontSizeButtonActive
                                ]}
                                onPress={() => updateSettings({ fontSize: option.value })}
                            >
                                <Text style={[
                                    styles.fontSizeSample,
                                    { fontSize: option.sample },
                                    settings.fontSize === option.value && styles.fontSizeButtonTextActive
                                ]}>
                                    Aa
                                </Text>
                                <Text style={[
                                    styles.fontSizeLabel,
                                    settings.fontSize === option.value && styles.fontSizeButtonTextActive
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card>

                {/* Security Section */}
                {biometricCapabilities?.isAvailable && biometricCapabilities?.isEnrolled && (
                    <Card style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>Security</Text>
                        </View>

                        <View style={styles.toggleRow}>
                            <View style={styles.biometricInfo}>
                                <View style={styles.biometricIconContainer}>
                                    <Ionicons
                                        name={getBiometricIcon()}
                                        size={24}
                                        color={settings.biometricEnabled ? theme.colors.primary : theme.colors.textSecondary}
                                    />
                                </View>
                                <View>
                                    <Text style={styles.toggleLabel}>{getBiometricLabel()} Login</Text>
                                    <Text style={styles.toggleDescription}>
                                        {settings.biometricEnabled
                                            ? 'Quick sign-in enabled'
                                            : 'Sign in faster with biometrics'}
                                    </Text>
                                </View>
                            </View>
                            {biometricLoading ? (
                                <ActivityIndicator color={theme.colors.primary} />
                            ) : (
                                <Switch
                                    value={settings.biometricEnabled}
                                    onValueChange={handleBiometricToggle}
                                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                    thumbColor="#fff"
                                />
                            )}
                        </View>

                        {settings.biometricEnabled && (
                            <View style={styles.infoCard}>
                                <Ionicons name="shield-checkmark" size={16} color={theme.colors.success} />
                                <Text style={styles.infoText}>
                                    Your biometric data never leaves your device
                                </Text>
                            </View>
                        )}
                    </Card>
                )}

                {/* Data Sync Section */}
                <Card style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconContainer}>
                            <Ionicons name="cloud-outline" size={18} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.sectionTitle}>Data Sync</Text>
                    </View>

                    <View style={styles.syncInfoRow}>
                        <View style={styles.syncInfoLeft}>
                            <Text style={styles.syncInfoLabel}>Last Synced</Text>
                            <Text style={styles.syncInfoValue}>{formattedLastSync}</Text>
                        </View>
                        <Ionicons
                            name={lastSyncTime ? 'checkmark-circle' : 'time-outline'}
                            size={24}
                            color={lastSyncTime ? theme.colors.success : theme.colors.textSecondary}
                        />
                    </View>
                </Card>

                {/* Preferences Section */}
                <Card style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconContainer}>
                            <Ionicons name="options-outline" size={18} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.sectionTitle}>Preferences</Text>
                    </View>

                    <View style={styles.toggleRow}>
                        <View>
                            <Text style={styles.toggleLabel}>Haptic Feedback</Text>
                            <Text style={styles.toggleDescription}>Vibrate on interactions</Text>
                        </View>
                        <Switch
                            value={settings.hapticEnabled}
                            onValueChange={(value) => updateSettings({ hapticEnabled: value })}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={[styles.toggleRow, styles.toggleRowBorder]}>
                        <View>
                            <Text style={styles.toggleLabel}>Auto Sync</Text>
                            <Text style={styles.toggleDescription}>Sync data automatically</Text>
                        </View>
                        <Switch
                            value={settings.autoSync}
                            onValueChange={(value) => updateSettings({ autoSync: value })}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={styles.toggleRow}>
                        <View>
                            <Text style={styles.toggleLabel}>Offline Mode</Text>
                            <Text style={styles.toggleDescription}>Work without internet</Text>
                        </View>
                        <Switch
                            value={settings.offlineMode}
                            onValueChange={(value) => updateSettings({ offlineMode: value })}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </Card>

                {/* Help Section */}
                <Card style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconContainer}>
                            <Ionicons name="help-circle-outline" size={18} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.sectionTitle}>Help & Info</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.linkRow}
                        onPress={() => router.push('/(tabs)/settings/known-issues')}
                    >
                        <View style={styles.linkLeft}>
                            <Ionicons name="bug-outline" size={22} color={theme.colors.primary} />
                            <Text style={styles.linkText}>Known Issues</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.linkRow, styles.linkRowLast]}
                        onPress={() => router.push('/(tabs)/settings/feedback')}
                    >
                        <View style={styles.linkLeft}>
                            <Ionicons name="chatbubble-outline" size={22} color={theme.colors.primary} />
                            <Text style={styles.linkText}>Submit Feedback</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </Card>

                {/* Version */}
                <Text style={styles.versionText}>HEAL LOG v{appJson.expo.version}</Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const createStyles = (theme: any, fontScale: number) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerButton: {
        padding: 8,
    },
    title: {
        fontSize: 18 * fontScale,
        fontWeight: '600',
        color: theme.colors.text,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionCard: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    sectionIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: theme.colors.primaryMuted,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16 * fontScale,
        fontWeight: '600',
        color: theme.colors.text,
    },
    optionLabel: {
        fontSize: 14 * fontScale,
        fontWeight: '500',
        color: theme.colors.textSecondary,
        marginBottom: 12,
    },
    themeOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    themeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    themeButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    themeButtonText: {
        fontSize: 14 * fontScale,
        color: theme.colors.textSecondary,
    },
    themeButtonTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    fontSizeOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    fontSizeButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    fontSizeButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    fontSizeSample: {
        color: theme.colors.text,
        fontWeight: '600',
        marginBottom: 4,
    },
    fontSizeLabel: {
        fontSize: 12 * fontScale,
        color: theme.colors.textSecondary,
    },
    fontSizeButtonTextActive: {
        color: '#fff',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    toggleRowBorder: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    toggleLabel: {
        fontSize: 16 * fontScale,
        fontWeight: '500',
        color: theme.colors.text,
    },
    toggleDescription: {
        fontSize: 13 * fontScale,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    biometricInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    biometricIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${theme.colors.success}15`,
        borderRadius: 8,
        padding: 12,
        gap: 8,
        marginTop: 12,
    },
    infoText: {
        fontSize: 13 * fontScale,
        color: theme.colors.success,
        flex: 1,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    linkRowLast: {
        borderBottomWidth: 0,
    },
    linkLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    linkText: {
        fontSize: 16 * fontScale,
        color: theme.colors.text,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12 * fontScale,
        color: theme.colors.textSecondary,
        marginTop: 8,
    },
    syncInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    syncInfoLeft: {
        flex: 1,
    },
    syncInfoLabel: {
        fontSize: 14 * fontScale,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    syncInfoValue: {
        fontSize: 16 * fontScale,
        fontWeight: '600',
        color: theme.colors.text,
    },
});

export default SettingsScreen;
