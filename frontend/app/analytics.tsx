import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnalyticsService, GrowthData, NotesData, ActivityData, DemographicsData } from '@/services/analytics_service';
import { useTheme } from '@/contexts/ThemeContext';

interface ChartBarProps {
    label: string;
    value: number;
    maxValue: number;
    color: string;
    labelColor: string;
}

const ChartBar = ({ label, value, maxValue, color, labelColor }: ChartBarProps) => {
    const height = maxValue > 0 ? (value / maxValue) * 150 : 0;
    return (
        <View style={barStyles.barContainer}>
            <View style={[barStyles.bar, { height, backgroundColor: color }]} />
            <Text style={[barStyles.barLabel, { color: labelColor }]}>{label}</Text>
        </View>
    );
};

const barStyles = StyleSheet.create({
    barContainer: {
        alignItems: 'center',
        marginRight: 12,
        width: 40,
    },
    bar: {
        width: 20,
        borderRadius: 4,
        marginBottom: 8,
    },
    barLabel: {
        fontSize: 10,
    },
});

export default function AnalyticsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const [loading, setLoading] = useState(true);
    const [growthData, setGrowthData] = useState<GrowthData[]>([]);
    const [notesData, setNotesData] = useState<NotesData[]>([]);
    const [activityData, setActivityData] = useState<ActivityData[]>([]);
    const [demographicsData, setDemographicsData] = useState<DemographicsData[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [growth, notes, activity, demographics] = await Promise.all([
                AnalyticsService.getPatientGrowth(),
                AnalyticsService.getNotesActivity(),
                AnalyticsService.getWeeklyActivity(),
                AnalyticsService.getDemographics(),
            ]);
            setGrowthData(growth);
            setNotesData(notes);
            setActivityData(activity);
            setDemographicsData(demographics);
        } catch (error) {
            console.error('Error loading analytics:', error);
            Alert.alert('Error', 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const data = await AnalyticsService.exportAnalytics();
            console.log('Exported data:', data);
            Alert.alert('Success', 'Analytics data exported successfully (check console)');
        } catch (error) {
            Alert.alert('Error', 'Failed to export data');
        }
    };

    const getMaxCount = (data: any[]) => Math.max(...data.map(d => d.count), 1);

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Practice Analytics</Text>
                <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
                    <Ionicons name="download-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Patient Growth</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chartContainer}>
                            {growthData.map((item, index) => (
                                <ChartBar
                                    key={index}
                                    label={item.period}
                                    value={item.count}
                                    maxValue={getMaxCount(growthData)}
                                    color={theme.colors.primary}
                                    labelColor={theme.colors.textSecondary}
                                />
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weekly Activity</Text>
                    <View style={styles.chartContainer}>
                        {activityData.map((item, index) => (
                            <ChartBar
                                key={index}
                                label={item.day}
                                value={item.count}
                                maxValue={getMaxCount(activityData)}
                                color={theme.colors.secondary}
                                labelColor={theme.colors.textSecondary}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Patient Demographics</Text>
                    {demographicsData.map((item, index) => (
                        <View key={index} style={styles.row}>
                            <Text style={styles.rowLabel}>{item.group}</Text>
                            <Text style={styles.rowValue}>{item.count} patients</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        color: theme.colors.text,
    },
    exportButton: {
        padding: 8,
    },
    content: {
        padding: 16,
    },
    section: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: theme.colors.text,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 180,
        paddingTop: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    rowLabel: {
        fontSize: 16,
        color: theme.colors.text,
    },
    rowValue: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.textSecondary,
    },
});
