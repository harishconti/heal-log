import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AnalyticsService, GrowthData, NotesData, ActivityData, DemographicsData } from '@/services/analytics_service';
import { useTheme } from '@/contexts/ThemeContext';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

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
        <View
            style={barStyles.barContainer}
            accessibilityLabel={`${label}: ${value}`}
            accessibilityRole="text"
        >
            <Text style={[barStyles.barValue, { color: labelColor }]}>{value}</Text>
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
        width: 24,
        borderRadius: 6,
        marginBottom: 8,
        minHeight: 4,
    },
    barLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
    barValue: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 4,
    },
});

export default function AnalyticsScreen() {
    const insets = useSafeAreaInsets();
    const { theme, fontScale } = useTheme();
    const styles = createStyles(theme, fontScale, insets.top);
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
            Alert.alert('Success', 'Analytics data exported successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to export data');
        }
    };

    const getMaxCount = (data: any[]) => Math.max(...data.map(d => d.count), 1);

    const renderSkeleton = () => (
        <View style={styles.content}>
            <SkeletonLoader width="100%" height={220} borderRadius={12} style={{ marginBottom: 16 }} />
            <SkeletonLoader width="100%" height={220} borderRadius={12} style={{ marginBottom: 16 }} />
            <SkeletonLoader width="100%" height={180} borderRadius={12} />
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title} accessibilityRole="header">Analytics</Text>
                    <Text style={styles.subtitle}>Practice insights & reports</Text>
                </View>
                <TouchableOpacity
                    onPress={handleExport}
                    style={styles.exportButton}
                    accessibilityLabel="Export analytics data"
                    accessibilityRole="button"
                    accessibilityHint="Downloads analytics as a report"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="download-outline" size={24} color={theme.colors.surface} />
                </TouchableOpacity>
            </View>

            {loading ? (
                renderSkeleton()
            ) : (
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Patient Growth Section */}
                    <View
                        style={styles.section}
                        accessibilityLabel="Patient Growth Chart"
                    >
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.primaryMuted }]}>
                                <Ionicons name="trending-up" size={18} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>Patient Growth</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.chartContainer}>
                                {growthData.length > 0 ? (
                                    growthData.map((item, index) => (
                                        <ChartBar
                                            key={index}
                                            label={item.period}
                                            value={item.count}
                                            maxValue={getMaxCount(growthData)}
                                            color={theme.colors.primary}
                                            labelColor={theme.colors.textSecondary}
                                        />
                                    ))
                                ) : (
                                    <Text style={styles.noDataText}>No growth data available</Text>
                                )}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Weekly Activity Section */}
                    <View
                        style={styles.section}
                        accessibilityLabel="Weekly Activity Chart"
                    >
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: `${theme.colors.success}20` }]}>
                                <Ionicons name="calendar" size={18} color={theme.colors.success} />
                            </View>
                            <Text style={styles.sectionTitle}>Weekly Activity</Text>
                        </View>
                        <View style={styles.chartContainer}>
                            {activityData.length > 0 ? (
                                activityData.map((item, index) => (
                                    <ChartBar
                                        key={index}
                                        label={item.day}
                                        value={item.count}
                                        maxValue={getMaxCount(activityData)}
                                        color={theme.colors.success}
                                        labelColor={theme.colors.textSecondary}
                                    />
                                ))
                            ) : (
                                <Text style={styles.noDataText}>No activity data available</Text>
                            )}
                        </View>
                    </View>

                    {/* Patient Demographics Section */}
                    <View
                        style={styles.section}
                        accessibilityLabel="Patient Demographics"
                    >
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: `${theme.colors.warning}20` }]}>
                                <Ionicons name="pie-chart" size={18} color={theme.colors.warning} />
                            </View>
                            <Text style={styles.sectionTitle}>Demographics</Text>
                        </View>
                        {demographicsData.length > 0 ? (
                            demographicsData.map((item, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.row,
                                        index === demographicsData.length - 1 && styles.rowLast
                                    ]}
                                    accessibilityLabel={`${item.group}: ${item.count} patients`}
                                >
                                    <Text style={styles.rowLabel}>{item.group}</Text>
                                    <View style={styles.rowValueContainer}>
                                        <Text style={styles.rowValue}>{item.count}</Text>
                                        <Text style={styles.rowUnit}>patients</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noDataText}>No demographic data available</Text>
                        )}
                    </View>

                    {/* Notes Activity Section */}
                    <View
                        style={styles.section}
                        accessibilityLabel="Notes Activity"
                    >
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: `${theme.colors.error}20` }]}>
                                <Ionicons name="document-text" size={18} color={theme.colors.error} />
                            </View>
                            <Text style={styles.sectionTitle}>Notes Activity</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.chartContainer}>
                                {notesData.length > 0 ? (
                                    notesData.map((item, index) => (
                                        <ChartBar
                                            key={index}
                                            label={item.period}
                                            value={item.count}
                                            maxValue={getMaxCount(notesData)}
                                            color={theme.colors.error}
                                            labelColor={theme.colors.textSecondary}
                                        />
                                    ))
                                ) : (
                                    <Text style={styles.noDataText}>No notes data available</Text>
                                )}
                            </View>
                        </ScrollView>
                    </View>

                    <View style={{ height: 24 }} />
                </ScrollView>
            )}
        </View>
    );
}

const createStyles = (theme: any, fontScale: number, topInset: number) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'android' ? Math.max(topInset, 24) + 16 : 16,
        backgroundColor: theme.colors.primary,
    },
    headerLeft: {
        flex: 1,
    },
    title: {
        fontSize: 22 * fontScale,
        fontWeight: 'bold',
        color: theme.colors.surface,
    },
    subtitle: {
        fontSize: 14 * fontScale,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    exportButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
    },
    section: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16 * fontScale,
        fontWeight: '600',
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
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    rowLast: {
        borderBottomWidth: 0,
    },
    rowLabel: {
        fontSize: 16 * fontScale,
        color: theme.colors.text,
    },
    rowValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    rowValue: {
        fontSize: 18 * fontScale,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    rowUnit: {
        fontSize: 12 * fontScale,
        color: theme.colors.textSecondary,
    },
    noDataText: {
        fontSize: 14 * fontScale,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        padding: 16,
    },
});
