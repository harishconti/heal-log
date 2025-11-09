import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';

const knownIssues = [
  {
    id: '1',
    title: 'Patient list does not refresh automatically',
    description: 'After adding a new patient, the main patient list does not update. You need to manually pull to refresh.',
    status: 'In Progress',
  },
  {
    id: '2',
    title: 'Offline mode sometimes fails to sync',
    description: 'When the app has been offline for an extended period, the automatic sync on reconnect sometimes fails. A manual sync from the profile screen is required.',
    status: 'Investigating',
  },
  {
    id: '3',
    title: 'Dark mode has some visual glitches',
    description: 'In dark mode, some screens have text that is difficult to read. We are working on a full dark mode audit.',
    status: 'In Progress',
  },
    {
    id: '4',
    title: 'Cannot edit patient notes',
    description: 'The functionality to edit existing patient notes is currently disabled. This will be re-enabled in a future update.',
    status: 'Planned',
    },
];

const KnownIssuesScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return theme.colors.warning;
      case 'Investigating':
        return theme.colors.secondary;
      case 'Planned':
        return theme.colors.textSecondary;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Known Issues</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {knownIssues.map((issue) => (
          <View key={issue.id} style={styles.issueCard}>
            <View style={styles.issueHeader}>
              <Text style={styles.issueTitle}>{issue.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
                <Text style={styles.statusText}>{issue.status}</Text>
              </View>
            </View>
            <Text style={styles.issueDescription}>{issue.description}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: 16,
  },
  issueCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  issueDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default KnownIssuesScreen;
