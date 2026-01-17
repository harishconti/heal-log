import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
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
  Pressable,
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
import { FullPageSkeleton, PatientListSkeleton } from '@/components/ui/SkeletonLoader';
import { preloadImages } from '@/services/image_service';

// Helper function to get badge color based on group
const getGroupBadgeStyle = (group: string | undefined, theme: any) => {
  const groupLower = (group || 'general').toLowerCase();

  // Color mapping for different medical groups
  const colorMap: Record<string, { bg: string; text: string }> = {
    cardiology: { bg: '#FEE2E2', text: '#DC2626' },      // Red for heart/critical
    emergency: { bg: '#FEE2E2', text: '#DC2626' },       // Red for emergency
    neurology: { bg: '#FEF3C7', text: '#D97706' },       // Amber for neuro
    orthopedics: { bg: '#DBEAFE', text: '#2563EB' },     // Blue for ortho
    physiotherapy: { bg: '#D1FAE5', text: '#059669' },   // Green for physio/rehab
    post_surgical: { bg: '#E0E7FF', text: '#4F46E5' },   // Indigo for post-op
    pediatrics: { bg: '#FCE7F3', text: '#DB2777' },      // Pink for pediatrics
    dermatology: { bg: '#FED7AA', text: '#EA580C' },     // Orange for derm
    psychiatry: { bg: '#E9D5FF', text: '#9333EA' },      // Purple for psychiatry
    endocrinology: { bg: '#CCFBF1', text: '#0D9488' },   // Teal for endo
    pulmonology: { bg: '#CFFAFE', text: '#0891B2' },     // Cyan for pulmo
    obstetric_cardiology: { bg: '#FEE2E2', text: '#DC2626' }, // Red for OB cardio
    general: { bg: theme.colors.primaryMuted, text: theme.colors.primary },
  };

  return colorMap[groupLower] || colorMap.general;
};

// Format group name for display
const formatGroupName = (group: string | undefined): string => {
  if (!group) return 'General';
  return group
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Memoized Patient Card Component for better performance
const MemoizedPatientCard = React.memo(function PatientCard({
  item,
  isFavorite,
  theme,
  styles,
  onToggleFavorite,
  onDelete,
  onCall,
  onNavigate,
  onEdit,
  getMenuOptions,
}: {
  item: Patient;
  isFavorite: boolean;
  theme: any;
  styles: any;
  onToggleFavorite: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onCall: (patient: Patient) => void;
  onNavigate: (id: string) => void;
  onEdit: (id: string) => void;
  getMenuOptions: (patient: Patient) => MenuOption[];
}) {
  const badgeColors = getGroupBadgeStyle(item.group, theme);

  return (
    <SwipeableRow
      rightActions={[
        {
          icon: 'trash-outline',
          color: theme.colors.surface,
          backgroundColor: theme.colors.error,
          onPress: () => onDelete(item),
          label: 'Delete',
        },
      ]}
      leftActions={[
        {
          icon: isFavorite ? 'heart-dislike' : 'heart',
          color: theme.colors.surface,
          backgroundColor: isFavorite ? theme.colors.textSecondary : theme.colors.error,
          onPress: () => onToggleFavorite(item),
          label: isFavorite ? 'Unfavorite' : 'Favorite',
        },
        {
          icon: 'create-outline',
          color: theme.colors.surface,
          backgroundColor: theme.colors.primary,
          onPress: () => onEdit(item.id),
          label: 'Edit',
        },
      ]}
    >
      <LongPressMenu
        options={getMenuOptions(item)}
        onPress={() => onNavigate(item.id)}
      >
        <Pressable
          style={({ pressed }) => [
            styles.patientCard,
            {
              backgroundColor: pressed ? theme.colors.primaryMuted : theme.colors.surface,
              // Elevated shadow on press for iOS
              ...(pressed && Platform.OS === 'ios' ? {
                shadowOpacity: 0.12,
                shadowRadius: 12,
              } : {}),
              // Elevated shadow on press for Android
              ...(pressed && Platform.OS === 'android' ? {
                elevation: 4,
              } : {}),
            }
          ]}
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
            <View style={[
              styles.statusBadge,
              { backgroundColor: badgeColors.bg }
            ]}>
              <Text style={[styles.statusText, { color: badgeColors.text }]}>
                {formatGroupName(item.group)}
              </Text>
            </View>
          </View>
        </Pressable>
      </LongPressMenu>
    </SwipeableRow>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.photo === nextProps.item.photo &&
    prevProps.item.patientId === nextProps.item.patientId &&
    prevProps.item.initialComplaint === nextProps.item.initialComplaint &&
    prevProps.item.phone === nextProps.item.phone &&
    prevProps.item.group === nextProps.item.group &&
    prevProps.isFavorite === nextProps.isFavorite
  );
});

// The raw UI component
function Index({ patients, groups, totalPatientCount }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, fontScale } = useTheme();
  const insets = useSafeAreaInsets();

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => createStyles(theme, fontScale, insets.top), [theme, fontScale, insets.top]);

  const {
    searchQuery,
    selectedFilter,
    loading,
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

  // Debounced search state
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(text);
    }, 300);
  }, [setSearchQuery]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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

  // Memoized menu options generator
  const getPatientMenuOptions = useCallback((patient: Patient): MenuOption[] => [
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
  ], [router, handleCallPatient, handleToggleFavorite, handleDeletePatient]);

  const navigateToProfile = () => {
    triggerHaptic();
    router.push('/profile');
  };

  const addNewPatient = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    trackFeatureAdoption('add-patient');
    router.push('/add-patient');
  };

  // Memoized navigation handlers
  const handleNavigate = useCallback((id: string) => {
    router.push(`/patient/${id}`);
  }, [router]);

  const handleEdit = useCallback((id: string) => {
    router.push(`/edit-patient/${id}`);
  }, [router]);

  // Memoized render function for FlashList
  const renderPatientCard = useCallback(({ item }: { item: Patient }) => {
    // Use optimistic state if available, otherwise use actual DB state
    const isFavorite = optimisticFavorites[item.id] ?? item.isFavorite;

    return (
      <MemoizedPatientCard
        item={item}
        isFavorite={isFavorite}
        theme={theme}
        styles={styles}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeletePatient}
        onCall={handleCallPatient}
        onNavigate={handleNavigate}
        onEdit={handleEdit}
        getMenuOptions={getPatientMenuOptions}
      />
    );
  }, [optimisticFavorites, theme, styles, handleToggleFavorite, handleDeletePatient, handleCallPatient, handleNavigate, handleEdit, getPatientMenuOptions]);

  // Preload images for visible patients on initial render and when list changes
  useEffect(() => {
    if (visiblePatients.length > 0) {
      preloadImages(
        visiblePatients.slice(0, 10),
        (patient) => `patient-${patient.id}`,
        (patient) => patient.photo
      );
    }
  }, [visiblePatients]);

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

  // Show skeleton loading state for better perceived performance
  if (authLoading || loading.patients) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header skeleton */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>HEAL LOG</Text>
            <Text style={styles.headerSubtitle}>Loading...</Text>
          </View>
        </View>
        <FullPageSkeleton />
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
          <Text style={styles.headerTitle}>HEAL LOG</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.full_name?.split(' ')[0]}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={navigateToProfile}
            accessibilityLabel="View profile"
            accessibilityRole="button"
          >
            <Ionicons name="person-circle-outline" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={addNewPatient}
            accessibilityLabel="Add new patient"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>
      </View>

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
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item.filter;
            return (
              <TouchableOpacity
                key={item.filter}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  }
                ]}
                onPress={() => {
                  triggerHaptic();
                  setSelectedFilter(item.filter);
                }}
                accessibilityLabel={`Filter by ${item.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[
                  styles.filterText,
                  { color: isSelected ? theme.colors.surface : theme.colors.text }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
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
        estimatedItemSize={100}  // Updated for new compact card design
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
            <View style={[styles.emptyStateIcon, { backgroundColor: theme.colors.primaryMuted }]}>
              <Ionicons name="people-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
              No patients found
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              {searchQuery ? 'Try adjusting your search criteria' : 'Add your first patient to get started'}
            </Text>
          </View>
        }
      />

      <View style={[styles.statsFooter, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>
          {filteredPatients.length} of {totalPatientCount} patients
          {activeAdvancedFilterCount > 0 && ` (${activeAdvancedFilterCount} filter${activeAdvancedFilterCount > 1 ? 's' : ''})`}
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
  // Modern search container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    // Subtle shadow
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
    minWidth: 44,           // Accessibility touch target
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
  // Filter pills container
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  // Pill-shaped filter buttons
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    minHeight: 44,          // Accessibility touch target
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
  patientsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Modern clean card design
  patientCard: {
    borderRadius: 16,
    marginBottom: 16,       // 16px gap between cards
    padding: 16,            // 16px internal padding
    // Subtle shadow for depth
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
    // Subtle border
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Single row layout: Avatar | Content | Badge
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,          // Ensure consistent height
  },

  // Avatar styling
  patientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    // Subtle ring around avatar
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
    borderRadius: 20,       // Fully rounded pill shape
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

  // Legacy styles kept for compatibility (can be removed if not used elsewhere)
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
  patientPhotoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  patientDetails: {
    flex: 1,
  },
  patientId: {
    fontSize: 13 * fontScale,
    marginBottom: 2,
  },
  patientContact: {
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
    minWidth: 48,           // 44px+ touch target
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    width: 44,              // Increased touch target
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
  // Modern empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 18 * fontScale,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14 * fontScale,
    textAlign: 'center',
    lineHeight: 20 * fontScale,
    maxWidth: 280,
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

