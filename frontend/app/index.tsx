import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
  LogBox,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { triggerChangeBasedSync } from '@/services/backgroundSync';
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
import AdvancedSearchPanel, { SearchFilters } from '@/components/core/AdvancedSearchPanel';

// The raw UI component
function Index({ patients, groups, totalPatientCount }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, fontScale } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(() => createStyles(theme, fontScale, insets), [theme, fontScale, insets]);

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

  // Optimistic favorite state for instant UI feedback
  const [optimisticFavorites, setOptimisticFavorites] = useState<Record<string, boolean>>({});

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

  const { recordSyncAttempt, setLastSyncTime } = useAppStore();

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

      // Record successful sync and update timestamp
      recordSyncAttempt(true);
      setLastSyncTime(new Date().toISOString());

      // Show success feedback when manually triggered
      if (showRefresh) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
          'Sync Complete',
          'Your data has been saved and synced successfully.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.log('Sync failed, using local DB:', error);
      setOffline(true);
      recordSyncAttempt(false);

      // Show error feedback when manually triggered
      if (showRefresh) {
        Alert.alert(
          'Sync Failed',
          'Unable to sync with server. Your changes are saved locally and will sync when connection is restored.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading('sync', false);
      setRefreshing(false);
    }
  }, [isAuthenticated, setLoading, setOffline, recordSyncAttempt, setLastSyncTime]);

  useEffect(() => {
    if (isAuthenticated) {
      handleSync();
    }
  }, [isAuthenticated, handleSync]);

  const handleToggleFavorite = async (patient: Patient) => {
    // Trigger haptic immediately for responsive feedback
    triggerHaptic();

    // Optimistic update - update UI immediately
    const newFavoriteState = !patient.isFavorite;
    setOptimisticFavorites(prev => ({
      ...prev,
      [patient.id]: newFavoriteState
    }));

    try {
      // Update database in background
      await database.write(async () => {
        await patient.update(p => {
          p.isFavorite = newFavoriteState;
        });
      });
      // Trigger immediate sync after favorite toggle
      triggerChangeBasedSync();

      // Clear optimistic state after successful DB update
      setOptimisticFavorites(prev => {
        const newState = { ...prev };
        delete newState[patient.id];
        return newState;
      });
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticFavorites(prev => {
        const newState = { ...prev };
        delete newState[patient.id];
        return newState;
      });
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
              // Trigger immediate sync after patient deletion
              triggerChangeBasedSync();
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

  const renderPatientCard = ({ item }: { item: Patient }) => {
    // Use optimistic state if available, otherwise use actual DB state
    const isFavorite = optimisticFavorites[item.id] ?? item.isFavorite;

    return (
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
            icon: isFavorite ? 'heart-dislike' : 'heart',
            color: theme.colors.surface,
            backgroundColor: isFavorite ? theme.colors.textSecondary : theme.colors.error,
            onPress: () => handleToggleFavorite(item),
            label: isFavorite ? 'Unfavorite' : 'Favorite',
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
              <View style={styles.patientInfoHeader}>
                <CachedImage
                  base64={item.photo}
                  cacheKey={`patient-${item.id}`}
                  size={56}
                  containerStyle={styles.patientPhoto}
                  placeholderColor={theme.colors.surfaceHighlight}
                  placeholderIconColor={theme.colors.secondary}
                />
                <View style={styles.patientDetails}>
                   <View style={styles.nameRow}>
                    <Text style={[styles.patientName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
                    {isFavorite && (
                      <Ionicons name="heart" size={16} color={theme.colors.error} style={{marginLeft: 4}} />
                    )}
                   </View>
                  <Text style={[styles.patientId, { color: theme.colors.secondary }]}>ID: {item.patientId}</Text>
                </View>
                <View style={[styles.groupBadge, { backgroundColor: theme.colors.primaryMuted }]}>
                   <Text style={[styles.groupText, { color: theme.colors.primary }]}>{item.group || 'General'}</Text>
                </View>
              </View>

              {item.initialComplaint ? (
                <View style={[styles.complaintContainer, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.complaintLabel, { color: theme.colors.secondary }]}>Chief Complaint:</Text>
                  <Text style={[styles.complaint, { color: theme.colors.text }]} numberOfLines={2}>
                    {item.initialComplaint}
                  </Text>
                </View>
              ) : null}

              <View style={styles.cardFooter}>
                 <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.surfaceHighlight }]}
                    onPress={() => handleToggleFavorite(item)}
                 >
                    <Ionicons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={20}
                      color={isFavorite ? theme.colors.error : theme.colors.secondary}
                    />
                 </TouchableOpacity>

                 {item.phone && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.surfaceHighlight }]}
                    onPress={() => handleCallPatient(item)}
                  >
                    <Ionicons name="call-outline" size={20} color={theme.colors.success} />
                  </TouchableOpacity>
                 )}

                 <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.surfaceHighlight, marginLeft: 'auto' }]}
                    onPress={() => router.push(`/patient/${item.id}`)}
                 >
                    <Text style={[styles.viewDetailsText, { color: theme.colors.primary }]}>View</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                 </TouchableOpacity>
              </View>
            </View>
          </View>
        </LongPressMenu>
      </SwipeableRow>
    );
  };

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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {authLoading ? 'Loading...' : 'Loading patients...'}
          </Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header, Offline Banner, Search, Filters */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>HealLog</Text>
            <Text style={styles.headerSubtitle}>
               Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.full_name?.split(' ')[0]}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={() => handleSync(true)} disabled={refreshing || loading.sync}>
              <Ionicons name={refreshing || loading.sync ? "sync-circle" : isOffline ? "cloud-offline" : "cloud-done"} size={24} color={isOffline ? theme.colors.warning : theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={navigateToProfile}>
              <Ionicons name="person-circle-outline" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search patients..."
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
              name="options-outline"
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
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: selectedFilter === item.filter ? theme.colors.primary : theme.colors.background,
                    borderColor: selectedFilter === item.filter ? theme.colors.primary : theme.colors.border
                  }
                ]}
                onPress={() => {
                  triggerHaptic();
                  setSelectedFilter(item.filter);
                }}
              >
                <Text style={[styles.filterText, { color: selectedFilter === item.filter ? '#FFFFFF' : theme.colors.textSecondary }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.filter}
            contentContainerStyle={styles.filtersContainer}
            estimatedItemSize={100}
          />
        </View>
      </View>

      <FlashList
        data={visiblePatients}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.patientsList, { paddingBottom: insets.bottom + 80 }]}
        estimatedItemSize={180}
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
             <View style={[styles.emptyStateIconContainer, { backgroundColor: theme.colors.primaryMuted }]}>
               <Ionicons name="people" size={32} color={theme.colors.primary} />
             </View>
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No patients found</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              {searchQuery ? 'Try adjusting your search filters' : 'Add your first patient to get started'}
            </Text>
            {!searchQuery && (
               <TouchableOpacity style={[styles.addPatientButton, { backgroundColor: theme.colors.primary }]} onPress={addNewPatient}>
                  <Text style={styles.addPatientButtonText}>Add Patient</Text>
               </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
         style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 24 }]}
         onPress={addNewPatient}
      >
         <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Advanced Search Panel */}
      <AdvancedSearchPanel
        visible={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        groups={groups || []}
      />
    </View>
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


const createStyles = (theme: any, fontScale: number, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.sizes.md * fontScale,
    marginTop: theme.spacing.md,
  },
  headerContainer: {
    paddingTop: insets.top,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl * fontScale,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.sm * fontScale,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: theme.typography.sizes.md * fontScale,
  },
  advancedSearchButton: {
    padding: theme.spacing.xs,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#fff',
  },
  filtersContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xs,
    borderWidth: 1,
  },
  filterText: {
    fontSize: theme.typography.sizes.sm * fontScale,
    fontWeight: theme.typography.weights.medium,
  },
  patientsList: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  patientCard: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  cardContent: {
    padding: theme.spacing.lg,
  },
  patientInfoHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
  },
  patientPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.surfaceHighlight,
  },
  patientDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  patientName: {
    fontSize: theme.typography.sizes.lg * fontScale,
    fontWeight: theme.typography.weights.semibold,
    marginRight: 4,
  },
  patientId: {
    fontSize: theme.typography.sizes.xs * fontScale,
    fontWeight: theme.typography.weights.medium,
    letterSpacing: 0.5,
  },
  complaintContainer: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  complaintLabel: {
    fontSize: theme.typography.sizes.xs * fontScale,
    marginBottom: 2,
    fontWeight: theme.typography.weights.medium,
    textTransform: 'uppercase',
  },
  complaint: {
    fontSize: theme.typography.sizes.sm * fontScale,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsText: {
     fontSize: theme.typography.sizes.sm * fontScale,
     fontWeight: theme.typography.weights.semibold,
     marginRight: 2,
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  groupText: {
    fontSize: 10 * fontScale,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyStateIconContainer: {
     width: 80,
     height: 80,
     borderRadius: 40,
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: theme.spacing.lg,
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.lg * fontScale,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: theme.typography.sizes.sm * fontScale,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  addPatientButton: {
     paddingHorizontal: theme.spacing.xl,
     paddingVertical: theme.spacing.md,
     borderRadius: theme.borderRadius.full,
  },
  addPatientButtonText: {
     color: '#FFFFFF',
     fontWeight: theme.typography.weights.semibold,
     fontSize: theme.typography.sizes.md,
  },
  loadMoreContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: theme.typography.sizes.xs * fontScale,
  },
  fab: {
     position: 'absolute',
     right: 20,
     width: 56,
     height: 56,
     borderRadius: 28,
     justifyContent: 'center',
     alignItems: 'center',
     ...theme.shadows.lg,
  }
});
