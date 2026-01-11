import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
  LogBox,
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
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import SyncProgressIndicator from '@/components/core/SyncProgressIndicator';

// The raw UI component
function Index({ patients, groups, totalPatientCount }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, fontScale } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = createStyles(theme, fontScale, insets.top);

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Optimistic favorite state for instant UI feedback
  const [optimisticFavorites, setOptimisticFavorites] = useState<Record<string, boolean>>({});

  // Debounced search state
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized debounce search input - reduced from 300ms to 200ms for snappier feel
  // Instant local filtering with debounced query update
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    // Immediately update for instant visual feedback on short queries
    if (text.length <= 2) {
      setDebouncedSearchQuery(text);
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(text);
    }, 200); // Reduced from 300ms for faster response
  }, [setSearchQuery]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Set initial loading to false once patients are loaded
  useEffect(() => {
    if (patients && patients.length >= 0) {
      setIsInitialLoading(false);
    }
  }, [patients]);

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

  // Helper function to get badge color based on group
  const getGroupBadgeStyle = (group: string | undefined) => {
    const groupLower = (group || 'general').toLowerCase();
    const colorMap: Record<string, { bg: string; text: string }> = {
      cardiology: { bg: '#FEE2E2', text: '#DC2626' },
      emergency: { bg: '#FEE2E2', text: '#DC2626' },
      neurology: { bg: '#FEF3C7', text: '#D97706' },
      orthopedics: { bg: '#DBEAFE', text: '#2563EB' },
      physiotherapy: { bg: '#D1FAE5', text: '#059669' },
      post_surgical: { bg: '#E0E7FF', text: '#4F46E5' },
      pediatrics: { bg: '#FCE7F3', text: '#DB2777' },
      dermatology: { bg: '#FED7AA', text: '#EA580C' },
      psychiatry: { bg: '#E9D5FF', text: '#9333EA' },
      endocrinology: { bg: '#CCFBF1', text: '#0D9488' },
      pulmonology: { bg: '#CFFAFE', text: '#0891B2' },
      obstetric_cardiology: { bg: '#FEE2E2', text: '#DC2626' },
      general: { bg: theme.colors.primaryMuted, text: theme.colors.primary },
    };
    return colorMap[groupLower] || colorMap.general;
  };

  // Format group name for display
  const formatGroupName = (group: string | undefined): string => {
    if (!group) return 'General';
    return group.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const renderPatientCard = ({ item }: { item: Patient }) => {
    // Use optimistic state if available, otherwise use actual DB state
    const isFavorite = optimisticFavorites[item.id] ?? item.isFavorite;
    const badgeColors = getGroupBadgeStyle(item.group);

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
        accessibilityLabel={`Patient ${item.name}. Swipe left to delete, swipe right for more options.`}
        accessibilityHint="Double tap to view details. Swipe left or right for quick actions."
      >
        <LongPressMenu
          options={getPatientMenuOptions(item)}
          onPress={() => router.push(`/patient/${item.id}`)}
          accessibilityLabel={`${item.name} patient card`}
          accessibilityHint="Double tap to view details. Long press for more options."
        >
          <View
            style={[styles.patientCard, { backgroundColor: theme.colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel={`Patient ${item.name}, ID ${item.patientId}${item.initialComplaint ? `, ${item.initialComplaint}` : ''}`}
          >
            {/* Modern clean card layout: Avatar | Content | Badge */}
            <View style={styles.cardRow}>
              {/* Left: Avatar */}
              <CachedImage
                base64={item.photo}
                cacheKey={`patient-${item.id}`}
                size={52}
                containerStyle={styles.patientAvatar}
                placeholderColor={theme.colors.primaryMuted}
                placeholderIconColor={theme.colors.primary}
              />

              {/* Center: Name and Details */}
              <View style={styles.cardCenter}>
                <View style={styles.nameRow}>
                  <Text
                    style={[styles.patientName, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {isFavorite && (
                    <Ionicons
                      name="heart"
                      size={14}
                      color={theme.colors.error}
                      style={styles.favoriteIcon}
                    />
                  )}
                </View>
                <Text
                  style={[styles.patientMeta, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  ID: {item.patientId}
                  {item.phone && ` • ${item.phone}`}
                </Text>
                {item.initialComplaint && (
                  <Text
                    style={[styles.patientComplaint, { color: theme.colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.initialComplaint}
                  </Text>
                )}
              </View>

              {/* Right: Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}>
                <Text style={[styles.statusText, { color: badgeColors.text }]}>
                  {formatGroupName(item.group)}
                </Text>
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

    // Apply basic search filter (name, ID, phone) - use debounced query
    if (debouncedSearchQuery) {
      const lowerQuery = debouncedSearchQuery.toLowerCase();
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
  }, [patients, debouncedSearchQuery, selectedFilter, advancedFilters]);

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

  // Render skeleton loaders during initial load
  const renderSkeletonList = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((_, index) => (
        <SkeletonLoader
          key={index}
          width="100%"
          height={100}
          borderRadius={12}
          style={{ marginBottom: 12 }}
        />
      ))}
    </View>
  );

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading...
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle} accessibilityRole="header">HEAL LOG</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.full_name?.split(' ')[0]}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => handleSync(true)}
            disabled={refreshing || loading.sync}
            accessibilityLabel={isOffline ? "Sync data, currently offline" : "Sync data"}
            accessibilityRole="button"
            accessibilityState={{ disabled: refreshing || loading.sync }}
            accessibilityHint="Syncs your data with the server"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={refreshing || loading.sync ? "sync-circle" : isOffline ? "cloud-offline" : "cloud-done"} size={24} color={isOffline ? theme.colors.warning : theme.colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={navigateToProfile}
            accessibilityLabel="View profile"
            accessibilityRole="button"
            accessibilityHint="Opens your profile page"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="person-circle-outline" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={addNewPatient}
            accessibilityLabel="Add new patient"
            accessibilityRole="button"
            accessibilityHint="Opens the add patient form"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="add" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync Progress Indicator with retry functionality */}
      <SyncProgressIndicator
        onRetry={() => handleSync(true)}
        onDismiss={() => {}}
        compact={false}
      />

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search by name, ID, phone..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor={theme.colors.textSecondary}
          accessibilityLabel="Search patients"
          accessibilityHint="Search by name, ID, or phone number"
        />
        <TouchableOpacity
          style={styles.advancedSearchButton}
          onPress={() => {
            triggerHaptic();
            setShowAdvancedSearch(true);
          }}
          accessibilityLabel={`Advanced search filters${activeAdvancedFilterCount > 0 ? `, ${activeAdvancedFilterCount} active` : ''}`}
          accessibilityRole="button"
          accessibilityHint="Opens advanced search options"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

      {/* Active Filters Indicator */}
      {activeAdvancedFilterCount > 0 && (
        <View style={[styles.activeFiltersBar, { backgroundColor: theme.colors.primaryMuted }]}>
          <Ionicons name="filter" size={14} color={theme.colors.primary} />
          <Text style={[styles.activeFiltersText, { color: theme.colors.primary }]}>
            {activeAdvancedFilterCount} filter{activeAdvancedFilterCount > 1 ? 's' : ''} active
          </Text>
          <TouchableOpacity
            onPress={() => setAdvancedFilters({
              query: '',
              condition: '',
              diagnosis: '',
              dateFrom: null,
              dateTo: null,
              group: '',
              favoritesOnly: false,
              recentlyAdded: false,
            })}
            accessibilityLabel="Clear all filters"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.clearFiltersText, { color: theme.colors.primary }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <View accessibilityRole="tablist" accessibilityLabel="Patient filter tabs">
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
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedFilter === item.filter }}
              accessibilityLabel={`${item.label} filter`}
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

      {isInitialLoading ? (
        renderSkeletonList()
      ) : (
        <FlashList
          data={visiblePatients}
          renderItem={renderPatientCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.patientsList}
          // Optimized FlashList configuration for smoother scrolling
          estimatedItemSize={120} // More accurate estimate based on actual card height
          onEndReached={loadMorePatients}
          onEndReachedThreshold={0.5} // Increased threshold for earlier loading
          drawDistance={300} // Pre-render items further ahead for smoother scroll
          overrideItemLayout={(layout, item) => {
            // Provide consistent layout for better performance
            layout.size = 120; // Fixed height for patient cards
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => handleSync(true)}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
              progressViewOffset={10}
            />
          }
          ListFooterComponent={
            hasMorePatients ? (
              <View style={styles.loadMoreContainer}>
                {isLoadingMore ? (
                  <View style={styles.loadingMoreIndicator}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={[styles.loadMoreText, { color: theme.colors.textSecondary, marginLeft: 8 }]}>
                      Loading more...
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.loadMoreText, { color: theme.colors.textSecondary }]}>
                    Showing {visiblePatients.length} of {filteredPatients.length} patients
                  </Text>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState} accessibilityRole="alert">
              <View style={[styles.emptyStateIcon, { backgroundColor: theme.colors.primaryMuted }]}>
                <Ionicons name="people-outline" size={48} color={theme.colors.primary} />
              </View>
              <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No patients found</Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                {searchQuery ? 'Try adjusting your search or filters' : 'Add your first patient to get started'}
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={[styles.clearSearchButton, { borderColor: theme.colors.primary }]}
                  onPress={() => {
                    setSearchQuery('');
                    setDebouncedSearchQuery('');
                  }}
                  accessibilityLabel="Clear search"
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle-outline" size={18} color={theme.colors.primary} />
                  <Text style={[styles.clearSearchText, { color: theme.colors.primary }]}>Clear Search</Text>
                </TouchableOpacity>
              )}
              {!searchQuery && (
                <TouchableOpacity
                  style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
                  onPress={addNewPatient}
                  accessibilityLabel="Add your first patient"
                  accessibilityRole="button"
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyStateButtonText}>Add Patient</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <View style={[styles.statsFooter, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>
          {filteredPatients.length} of {totalPatientCount} patients
          {activeAdvancedFilterCount > 0 && ` (${activeAdvancedFilterCount} filter${activeAdvancedFilterCount > 1 ? 's' : ''})`}
        </Text>
        <View style={styles.syncStatusContainer}>
          <Ionicons
            name={isOffline ? 'cloud-offline' : 'cloud-done'}
            size={14}
            color={isOffline ? theme.colors.warning : theme.colors.success}
            style={styles.syncIcon}
          />
          <Text style={[styles.syncTimeText, { color: isOffline ? theme.colors.warning : theme.colors.textSecondary }]}>
            {isOffline
              ? 'Offline - Changes saved locally'
              : lastSyncTime
                ? `Synced ${new Date(lastSyncTime).toLocaleTimeString()}`
                : 'Not synced yet'
            }
          </Text>
        </View>
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

// Database query limit for initial load - prevents memory issues with large datasets
const DATABASE_QUERY_LIMIT = 500;

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

    // Optimized query with database-level limit to prevent memory issues
    // Additional filtering happens in component for reactivity
    return {
      patients: patientCollection
        .query(Q.sortBy('updated_at', Q.desc), Q.take(DATABASE_QUERY_LIMIT))
        .observe(),
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


const createStyles = (theme: any, fontScale: number, topInset: number = 0) => StyleSheet.create({
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
    paddingTop: Platform.OS === 'android' ? Math.max(topInset, 24) + 16 : 16,
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
    gap: 8,
    alignItems: 'center',
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modern search container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15 * fontScale,
    letterSpacing: -0.2,
  },
  advancedSearchButton: {
    padding: 10,
    position: 'relative',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  activeFiltersText: {
    flex: 1,
    fontSize: 13 * fontScale,
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: 13 * fontScale,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 13 * fontScale,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  syncStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncIcon: {
    marginRight: 4,
  },
  syncTimeText: {
    fontSize: 12 * fontScale,
  },
  patientsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Modern clean card design
  patientCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  // Single row layout: Avatar | Content | Badge
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  // Avatar styling
  patientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    borderWidth: 2,
    borderColor: theme.colors.primaryMuted,
  },
  // Center content area
  cardCenter: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  // Name row with inline favorite icon
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  // Larger, bolder name
  patientName: {
    fontSize: 17 * fontScale,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  // Small favorite heart icon inline with name
  favoriteIcon: {
    marginLeft: 6,
  },
  // Secondary meta info (ID, phone)
  patientMeta: {
    fontSize: 13 * fontScale,
    fontWeight: '400',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  // Complaint/condition text
  patientComplaint: {
    fontSize: 12 * fontScale,
    fontWeight: '400',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  // Pill-shaped status badge (right-aligned)
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'center',
    minWidth: 60,
    alignItems: 'center',
  },
  // Status badge text
  statusText: {
    fontSize: 10 * fontScale,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Legacy styles for compatibility
  cardContent: {
    padding: 16,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  patientDetails: {
    flex: 1,
  },
  patientId: {
    fontSize: 13 * fontScale,
    marginBottom: 2,
  },
  complaint: {
    fontSize: 12 * fontScale,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 4,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  groupBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  groupText: {
    fontSize: 10 * fontScale,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14 * fontScale,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16 * fontScale,
    fontWeight: '600',
  },
  clearSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginBottom: 12,
  },
  clearSearchText: {
    fontSize: 14 * fontScale,
    fontWeight: '500',
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingMoreIndicator: {
    flexDirection: 'row',
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
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
