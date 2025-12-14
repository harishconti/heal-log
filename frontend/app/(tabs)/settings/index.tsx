import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, StatusBar, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = () => {
    const { theme, isDark, setTheme } = useTheme();
    const { settings, updateSettings } = useAppStore();
    const router = useRouter();

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

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Appearance</Text>

                    <View style={styles.card}>
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
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.optionLabel}>Font Size</Text>
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
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>

                    <View style={styles.card}>
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
                    </View>

                    <View style={styles.card}>
                        <View style={styles.toggleRow}>
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
                    </View>

                    <View style={styles.card}>
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
                    </View>
                </View>

                {/* Help Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Help & Info</Text>

                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push('/(tabs)/settings/known-issues')}
                    >
                        <View style={styles.linkRow}>
                            <Ionicons name="bug-outline" size={22} color={theme.colors.textSecondary} />
                            <Text style={styles.linkText}>Known Issues</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push('/(tabs)/settings/feedback')}
                    >
                        <View style={styles.linkRow}>
                            <Ionicons name="chatbubble-outline" size={22} color={theme.colors.textSecondary} />
                            <Text style={styles.linkText}>Submit Feedback</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 48,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
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
        fontSize: 14,
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
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    fontSizeButtonTextActive: {
        color: '#fff',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
    },
    toggleDescription: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    linkText: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
    },
});

export default SettingsScreen;
