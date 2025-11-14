import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getKnownIssues, KnownIssue } from '@/services/beta';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'; // Assuming this is the correct path

const CACHE_KEY = 'known_issues_cache';

const KnownIssuesScreen = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [issues, setIssues] = useState<KnownIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const severityColors = {
    critical: '#ff4d4f',
    high: '#faad14',
    medium: '#1890ff',
    low: '#52c41a',
  };

  const statusBadges = {
    investigating: 'Investigating',
    in_progress: 'In Progress',
    fixed: 'Fixed',
  };

  const fetchIssues = async (fromRefresh = false) => {
    if (!fromRefresh) setLoading(true);
    try {
      const freshIssues = await getKnownIssues();
      setIssues(freshIssues);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(freshIssues));
    } catch (error) {
      console.error("Failed to fetch issues, loading from cache", error);
      const cachedIssues = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedIssues) {
        setIssues(JSON.parse(cachedIssues));
      }
    } finally {
      if (!fromRefresh) setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchIssues(true);
    setRefreshing(false);
  }, []);

  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.severity]) {
      acc[issue.severity] = [];
    }
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, KnownIssue[]>);

  const renderIssue = ({ item }: { item: KnownIssue }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setExpanded(expanded === item.id ? null : item.id)}>
        <View style={styles.cardHeader}>
          <View style={[styles.severityIndicator, { backgroundColor: severityColors[item.severity] }]} />
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{statusBadges[item.status]}</Text>
          </View>
        </View>
      </TouchableOpacity>
      {expanded === item.id && (
        <View style={styles.cardBody}>
          <Text style={styles.description}>{item.description}</Text>
          {item.workaround && <Text style={styles.workaround}><Text style={{fontWeight: 'bold'}}>Workaround:</Text> {item.workaround}</Text>}
        </View>
      )}
    </View>
  );

  const renderGroup = ({ item: severity }: { item: string }) => (
    <View key={severity}>
        <Text style={styles.groupTitle}>{severity.charAt(0).toUpperCase() + severity.slice(1)}</Text>
        <FlatList
            data={groupedIssues[severity]}
            renderItem={renderIssue}
            keyExtractor={(item) => item.id}
        />
    </View>
);

  if (loading) {
    return (
      <View style={styles.container}>
        <SkeletonLoader count={5} />
      </View>
    );
  }

  return (
    <FlatList
      data={Object.keys(groupedIssues).sort((a,b) => ['critical', 'high', 'medium', 'low'].indexOf(a) - ['critical', 'high', 'medium', 'low'].indexOf(b))}
      renderItem={renderGroup}
      keyExtractor={(item) => item}
      style={styles.container}
      ListHeaderComponent={<Text style={styles.title}>Known Issues</Text>}
      ListEmptyComponent={<Text style={styles.emptyText}>No known issues at the moment.</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    />
  );
};

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 15,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 20,
    },
    groupTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 15,
      marginBottom: 10,
      textTransform: 'capitalize',
  },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    severityIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    cardTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    statusBadge: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 10,
        marginLeft: 10,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardBody: {
        marginTop: 15,
    },
    description: {
        fontSize: 14,
        color: theme.colors.text,
        lineHeight: 20,
    },
    workaround: {
        marginTop: 10,
        fontSize: 14,
        color: theme.colors.text,
        fontStyle: 'italic',
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
      color: theme.colors.text,
  },
});

export default KnownIssuesScreen;
