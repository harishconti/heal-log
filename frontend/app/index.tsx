import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Image,
  RefreshControl,
  Platform,
  ActivityIndicator,
  LogBox,
  StatusBar
} from 'react-native';

// Constants for pagination
const PATIENTS_PAGE_SIZE = 50;
const INITIAL_LOAD_SIZE = 30;

LogBox.ignoreLogs([
  'Accessing element.ref was removed in React 19',
]);
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { trackScreenView, trackFeatureAdoption } from '@/services/analytics';
import { sync } from '@/services/sync';
import { map } from 'rxjs/operators';
import { FlashList } from '@shopify/flash-list';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'expo-router';

// WatermelonDB imports
import { database } from '@/models/database';
import Patient from '@/models/Patient';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';

// Optimized image component
import { CachedImage } from '@/components/ui/CachedImage';
import SwipeableRow from '@/components/ui/SwipeableRow';
import LongPressMenu, { MenuOption } from '@/components/ui/LongPressMenu';
import ConnectionStatusBar from '@/components/core/ConnectionStatusBar';
import AdvancedSearchPanel, { SearchFilters } from '@/components/core/AdvancedSearchPanel';

// The raw UI component
function Index({ patients, groups, totalPatientCount }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, fontScale } = useTheme();

  const styles = createStyles(theme, fontScale);

  const {
    searchQuery,
    selectedFilter,
    loading,
    isOffline,
    lastSyncTime,
    setSearchQuery,
    setSelectedFilter,
    setLoading,
    setOffline,
    settings,
  } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilters>({
    query: '',
    condition: '',
    diagnosis: '',
    dateFrom: null,
    dateTo: null,
    group: '',
    favoritesOnly: false,
    recentlyAdded: false,
  });

  // Pagination state for lazy loading
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (settings.hapticEnabled) {
      Haptics.impactAsync(style);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (isAuthenticated) {
      trackScreenView('index');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSync = useCallback(async (showRefresh = false) => {
    if (!isAuthenticated) return;

    try {
      if (showRefresh) {
        setRefreshing(true);
        triggerHaptic();
      } else {
        setLoading('sync', true);
      }

      await sync();
      setOffline(false);
      trackFeatureAdoption('sync');

    } catch (error) {
      console.log('Sync failed, using local DB:', error);
      setOffline(true);
    } finally {
      setLoading('sync', false);
      setRefreshing(false);
    }
  }, [isAuthenticated, setLoading, setOffline]);

  useEffect(() => {
    if (isAuthenticated) {
      handleSync();
    }
  }, [isAuthenticated, handleSync]);

  const handleToggleFavorite = async (patient: Patient) => {
    try {
      await database.write(async () => {
        await patient.update(p => {
          p.isFavorite = !p.isFavorite;
        });
      });
      triggerHaptic();
    } catch (error) {
      Alert.alert('Update Failed', 'Failed to update favorite status.');
      console.error('Failed to update favorite status:', error);
    }
  };

  const handleDeletePatient = async (patient: Patient) => {
    Alert.alert(
      'Delete Patient',
      `Are you sure you want to delete ${patient.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await patient.markAsDeleted();
              });
              triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
            } catch (error) {
              Alert.alert('Delete Failed', 'Failed to delete patient.');
              console.error('Failed to delete patient:', error);
            }
          },
        },
      ]
    );
  };

  const handleCallPatient = (patient: Patient) => {
    if (patient.phone) {
      triggerHaptic();
      // Open phone dialer
      import('react-native').then(({ Linking }) => {
        Linking.openURL(`tel:${patient.phone}`);
      });
    }
  };

  const getPatientMenuOptions = (patient: Patient): MenuOption[] => [
    {
      id: 'view',
      label: 'View Details',
      icon: 'eye-outline',
      onPress: () => router.push(`/patient/${patient.id}`),
    },
    {
      id: 'edit',
      label: 'Edit Patient',
      icon: 'create-outline',
      onPress: () => router.push(`/edit-patient/${patient.id}`),
    },
    {
      id: 'call',
      label: 'Call Patient',
      icon: 'call-outline',
      onPress: () => handleCallPatient(patient),
      disabled: !patient.phone,
    },
    {
      id: 'favorite',
      label: patient.isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      icon: patient.isFavorite ? 'heart-dislike-outline' : 'heart-outline',
      onPress: () => handleToggleFavorite(patient),
    },
    {
      id: 'delete',
      label: 'Delete Patient',
      icon: 'trash-outline',
      onPress: () => handleDeletePatient(patient),
      destructive: true,
    },
  ];

  const navigateToProfile = () => {
    triggerHaptic();
    router.push('/profile');
  };

  const addNewPatient = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    trackFeatureAdoption('add-patient');
    router.push('/add-patient');
  };

  const renderPatientCard = ({ item }: { item: Patient }) => (
    <SwipeableRow
      rightActions={[
        {
          icon: 'trash-outline',
          color: theme.colors.surface,
          backgroundColor: theme.colors.error,
          onPress: () => handleDeletePatient(item),
          label: 'Delete',
        },
      ]}
      leftActions={[
        {
          icon: item.isFavorite ? 'heart-dislike' : 'heart',
          color: theme.colors.surface,
          backgroundColor: item.isFavorite ? theme.colors.textSecondary : theme.colors.error,
          onPress: () => handleToggleFavorite(item),
          label: item.isFavorite ? 'Unfavorite' : 'Favorite',
        },
        {
          icon: 'create-outline',
          color: theme.colors.surface,
          backgroundColor: theme.colors.primary,
          onPress: () => router.push(`/edit-patient/${item.id}`),
          label: 'Edit',
        },
      ]}
    >
      <LongPressMenu
        options={getPatientMenuOptions(item)}
        onPress={() => router.push(`/patient/${item.id}`)}
      >
        <View style={[styles.patientCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardContent}>
            <View style={styles.patientInfo}>
              <CachedImage
                base64={item.photo}
                cacheKey={`patient-${item.id}`}
                size={50}
                containerStyle={styles.patientPhoto}
                placeholderColor={theme.colors.background}
                placeholderIconColor={theme.colors.textSecondary}
              />
              <View style={styles.patientDetails}>
                <Text style={[styles.patientName, { color: theme.colors.text }]}>{item.name}</Text>
                <Text style={[styles.patientId, { color: theme.colors.textSecondary }]}>ID: {item.patientId}</Text>
                {item.phone ? <Text style={[styles.patientContact, { color: theme.colors.primary }]}>{item.phone}</Text> : null}
                {item.initialComplaint ? (
                  <Text style={[styles.complaint, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {item.initialComplaint}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => handleToggleFavorite(item)}
                style={styles.favoriteButton}
              >
                <Ionicons
                  name={item.isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={item.isFavorite ? theme.colors.error : theme.colors.textSecondary}
                />
              </TouchableOpacity>
              <View style={[styles.groupBadge, { backgroundColor: theme.colors.primaryMuted }]}>
                <Text style={[styles.groupText, { color: theme.colors.primary }]}>{item.group || 'General'}</Text>
              </View>
            </View>
          </View>
        </View>
      </LongPressMenu>
    </SwipeableRow>
  );

  const filterButtons = useMemo(() => {
    const buttons = [
      { filter: 'all', label: 'All' },
      { filter: 'favorites', label: 'Favorites' }
    ];
    (groups || []).forEach(group => {
      if (group) {
        buttons.push({ filter: group, label: group });
      }
    });
    return buttons;
  }, [groups]);

  // Count active advanced filters
  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.condition) count++;
    if (advancedFilters.diagnosis) count++;
    if (advancedFilters.dateFrom) count++;
    if (advancedFilters.group) count++;
    if (advancedFilters.favoritesOnly) count++;
    if (advancedFilters.recentlyAdded) count++;
    return count;
  }, [advancedFilters]);

  // Filter patients based on search and selected filter - reactive to changes
  const filteredPatients = useMemo(() => {
    if (!patients) return [];

    let result = patients;

    // Apply basic search filter (name, ID, phone)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.patientId?.toLowerCase().includes(lowerQuery) ||
        p.phone?.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply group/favorites filter from quick filter buttons
    if (selectedFilter && selectedFilter !== 'all') {
      if (selectedFilter === 'favorites') {
        result = result.filter(p => p.isFavorite);
      } else {
        result = result.filter(p => p.group === selectedFilter);
      }
    }

    // Apply advanced filters
    if (advancedFilters.condition) {
      const lowerCondition = advancedFilters.condition.toLowerCase();
      result = result.filter(p =>
        p.initialComplaint?.toLowerCase().includes(lowerCondition)
      );
    }

    if (advancedFilters.diagnosis) {
      const lowerDiagnosis = advancedFilters.diagnosis.toLowerCase();
      result = result.filter(p =>
        p.initialDiagnosis?.toLowerCase().includes(lowerDiagnosis)
      );
    }

    if (advancedFilters.dateFrom) {
      const fromTime = advancedFilters.dateFrom.getTime();
      result = result.filter(p => {
        const createdAt = p.createdAt?.getTime?.() || 0;
        return createdAt >= fromTime;
      });
    }

    if (advancedFilters.dateTo) {
      const toTime = advancedFilters.dateTo.getTime();
      result = result.filter(p => {
        const createdAt = p.createdAt?.getTime?.() || 0;
        return createdAt <= toTime;
      });
    }

    if (advancedFilters.group) {
      result = result.filter(p => p.group === advancedFilters.group);
    }

    if (advancedFilters.favoritesOnly) {
      result = result.filter(p => p.isFavorite);
    }

    if (advancedFilters.recentlyAdded) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoTime = sevenDaysAgo.getTime();
      result = result.filter(p => {
        const createdAt = p.createdAt?.getTime?.() || 0;
        return createdAt >= sevenDaysAgoTime;
      });
    }

    return result;
  }, [patients, searchQuery, selectedFilter, advancedFilters]);

  // Paginated visible patients for lazy loading
  const visiblePatients = useMemo(() => {
    return filteredPatients.slice(0, visibleCount);
  }, [filteredPatients, visibleCount]);

  const hasMorePatients = filteredPatients.length > visibleCount;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD_SIZE);
  }, [searchQuery, selectedFilter]);

  // Load more patients handler
  const loadMorePatients = useCallback(() => {
    if (hasMorePatients && !isLoadingMore) {
      setIsLoadingMore(true);
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        setVisibleCount(prev => Math.min(prev + PATIENTS_PAGE_SIZE, filteredPatients.length));
        setIsLoadingMore(false);
      });
    }
  }, [hasMorePatients, isLoadingMore, filteredPatients.length]);

  if (authLoading || loading.patients) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {authLoading ? 'Loading...' : 'Loading patients...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header, Offline Banner, Search, Filters */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Medical Contacts</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.full_name?.split(' ')[0]}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.syncButton} onPress={() => handleSync(true)} disabled={refreshing || loading.sync}>
            <Ionicons name={refreshing || loading.sync ? "sync-circle" : "sync"} size={24} color={theme.colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={navigateToProfile}>
            <Ionicons name="person-circle" size={32} color={theme.colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={addNewPatient}>
            <Ionicons name="add" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.debugButton} onPress={() => router.push('/debug-console')}>
            <Ionicons name="bug" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Connection Status Bar */}
      <ConnectionStatusBar onSyncPress={() => handleSync(true)} />

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search by name, ID, phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TouchableOpacity
          style={styles.advancedSearchButton}
          onPress={() => {
            triggerHaptic();
            setShowAdvancedSearch(true);
          }}
        >
          <Ionicons
            name="options"
            size={20}
            color={activeAdvancedFilterCount > 0 ? theme.colors.primary : theme.colors.textSecondary}
          />
          {activeAdvancedFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.filterBadgeText}>{activeAdvancedFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View>
        <FlashList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterButtons}
          renderItem={({ item }) => (
            <TouchableOpacity
              key={item.filter}
              style={[styles.filterButton, { backgroundColor: selectedFilter === item.filter ? theme.colors.primary : theme.colors.surface }]}
              onPress={() => {
                triggerHaptic();
                setSelectedFilter(item.filter);
              }}
            >
              <Text style={[styles.filterText, { color: selectedFilter === item.filter ? theme.colors.surface : theme.colors.textSecondary }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.filter}
          contentContainerStyle={styles.filtersContainer}
          estimatedItemSize={100}
        />
      </View>

      <FlashList
        data={visiblePatients}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.patientsList}
        estimatedItemSize={150}
        onEndReached={loadMorePatients}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => handleSync(true)}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListFooterComponent={
          hasMorePatients ? (
            <View style={styles.loadMoreContainer}>
              {isLoadingMore ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={[styles.loadMoreText, { color: theme.colors.textSecondary }]}>
                  Showing {visiblePatients.length} of {filteredPatients.length} patients
                </Text>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No patients found</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first patient to get started'}
            </Text>
          </View>
        }
      />

      <View style={[styles.statsFooter, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>
          {filteredPatients.length} of {totalPatientCount} patients
          {activeAdvancedFilterCount > 0 && ` (${activeAdvancedFilterCount} filter${activeAdvancedFilterCount > 1 ? 's' : ''})`}
        </Text>
        <Text style={[styles.syncTimeText, { color: theme.colors.textSecondary }]}>
          {lastSyncTime ? `Last synced: ${new Date(lastSyncTime).toLocaleTimeString()}` : ''}
        </Text>
        {user?.plan && (
          <Text style={[styles.planText, { color: theme.colors.primary }]}>
            {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
          </Text>
        )}
      </View>

      {/* Advanced Search Panel */}
      <AdvancedSearchPanel
        visible={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        groups={groups || []}
      />
    </SafeAreaView>
  );
}

const enhance = withObservables([], () => {
  try {
    const patientCollection = database?.collections?.get<Patient>('patients');

    if (!patientCollection) {
      console.warn('[Index] Patient collection not ready yet, returning empty observables');
      // Return empty observables while database initializes
      return {
        patients: [],
        groups: [],
        totalPatientCount: 0,
      };
    }

    // Just observe all patients - filtering happens in component for reactivity
    return {
      patients: patientCollection.query().observe(),
      groups: patientCollection.query(Q.where('group', Q.notEq(null))).observe().pipe(
        map(ps => [...new Set(ps.map(p => p.group))])
      ),
      totalPatientCount: patientCollection.query().observeCount(),
    };
  } catch (error) {
    console.error('[Index] Error in withObservables:', error);
    // Return empty observables on error
    return {
      patients: [],
      groups: [],
      totalPatientCount: 0,
    };
  }
});

export default enhance(Index);


const createStyles = (theme: any, fontScale: number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16 * fontScale,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22 * fontScale,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  headerSubtitle: {
    fontSize: 14 * fontScale,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  syncButton: {
    padding: 4,
  },
  profileButton: {
    padding: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBanner: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineText: {
    color: theme.colors.surface,
    fontSize: 14 * fontScale,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16 * fontScale,
  },
  advancedSearchButton: {
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14 * fontScale,
    fontWeight: '600',
  },
  syncTimeText: {
    fontSize: 12 * fontScale,
  },
  patientsList: {
    paddingHorizontal: 16,
  },
  patientCard: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    padding: 16,
  },
  patientInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  patientPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  patientPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
    marginBottom: 4,
  },
  patientId: {
    fontSize: 14 * fontScale,
    marginBottom: 2,
  },
  patientContact: {
    fontSize: 14 * fontScale,
    marginBottom: 4,
  },
  complaint: {
    fontSize: 14 * fontScale,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 4,
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupText: {
    fontSize: 12 * fontScale,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14 * fontScale,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 12 * fontScale,
  },
  statsFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14 * fontScale,
  },
  planText: {
    fontSize: 12 * fontScale,
    fontWeight: '500',
  },
});

