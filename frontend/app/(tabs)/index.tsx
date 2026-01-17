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

// UI Components
import SwipeableRow from '@/components/ui/SwipeableRow';
import LongPressMenu, { MenuOption } from '@/components/ui/LongPressMenu';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

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
    setSearchQuery,
    setSelectedFilter,
    setLoading,
    setOffline,
    settings,
  } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);

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

      if (showRefresh) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      }

    } catch (error) {
      console.log('Sync failed, using local DB:', error);
      setOffline(true);
      recordSyncAttempt(false);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const addNewPatient = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    trackFeatureAdoption('add-patient');
    router.push('/add-patient');
  };

  // Helper function to get badge color based on status/group
  const getStatusBadgeStyle = (group: string | undefined) => {
    const groupLower = (group || 'stable').toLowerCase();
    const colorMap: Record<string, { bg: string; text: string }> = {
      critical: { bg: '#FEE2E2', text: '#DC2626' },
      cardiology: { bg: '#FEE2E2', text: '#DC2626' },
      emergency: { bg: '#FEE2E2', text: '#DC2626' },
      'post-op': { bg: '#DBEAFE', text: '#2563EB' },
      post_surgical: { bg: '#DBEAFE', text: '#2563EB' },
      'follow-up': { bg: '#F3F4F6', text: '#4B5563' },
      neurology: { bg: '#FEF3C7', text: '#D97706' },
      stable: { bg: '#D1FAE5', text: '#059669' },
      general: { bg: '#D1FAE5', text: '#059669' },
    };
    return colorMap[groupLower] || colorMap.stable;
  };

  // Format status name for display
  const formatStatusName = (group: string | undefined): string => {
    if (!group) return 'STABLE';
    const statusMap: Record<string, string> = {
      cardiology: 'CRITICAL',
      emergency: 'CRITICAL',
      post_surgical: 'POST-OP',
      general: 'STABLE',
    };
    return statusMap[group.toLowerCase()] || group.toUpperCase().replace('_', '-');
  };

  // Get initials from name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get avatar background color based on name
  const getAvatarColor = (name: string): string => {
    const colors = ['#E8F4FF', '#FCE7F3', '#D1FAE5', '#FEF3C7', '#E9D5FF', '#DBEAFE'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Format last visit date
  const formatLastVisit = (date: Date | null | undefined): string => {
    if (!date) return 'No visits yet';
    const now = new Date();
    const visitDate = new Date(date);
    const diffDays = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${visitDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return visitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const renderPatientCard = ({ item }: { item: Patient }) => {
    // Use optimistic state if available, otherwise use actual DB state
    const isFavorite = optimisticFavorites[item.id] ?? item.isFavorite;
    const badgeColors = getStatusBadgeStyle(item.group);
    const initials = getInitials(item.name);
    const avatarColor = getAvatarColor(item.name);

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
          <Pressable
            style={({ pressed }) => [
              styles.patientCard,
              {
                backgroundColor: pressed ? theme.colors.primaryMuted : theme.colors.surface,
              }
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Patient ${item.name}`}
          >
            <View style={styles.cardRow}>
              {/* Left: Initials Avatar */}
              <View style={[styles.initialsAvatar, { backgroundColor: avatarColor }]}>
                <Text style={[styles.initialsText, { color: theme.colors.primary }]}>
                  {initials}
                </Text>
              </View>

              {/* Center: Name and Last Visit */}
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
                      size={16}
                      color="#E91E63"
                      style={styles.favoriteIcon}
                    />
                  )}
                </View>
                <View style={styles.lastVisitRow}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={theme.colors.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[styles.lastVisitText, { color: theme.colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    Last Visit: {formatLastVisit(item.updatedAt)}
                  </Text>
                </View>
              </View>

              {/* Right: Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}>
                <Text style={[styles.statusText, { color: badgeColors.text }]}>
                  {formatStatusName(item.group)}
                </Text>
              </View>
            </View>
          </Pressable>
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

  // Filter patients based on search and selected filter
  const filteredPatients = useMemo(() => {
    if (!patients) return [];

    let result = patients;

    // Apply basic search filter (name, ID)
    if (debouncedSearchQuery) {
      const lowerQuery = debouncedSearchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.patientId?.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply filter from tab buttons
    if (selectedFilter && selectedFilter !== 'all') {
      if (selectedFilter === 'favorites') {
        result = result.filter(p => p.isFavorite);
      } else {
        result = result.filter(p => p.group === selectedFilter);
      }
    }

    return result;
  }, [patients, debouncedSearchQuery, selectedFilter]);

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
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerDate, { color: theme.colors.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]} accessibilityRole="header">
            {getGreeting()},
          </Text>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Dr. {user?.full_name?.split(' ').slice(-1)[0] || 'Smith'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={navigateToProfile}
          accessibilityLabel="Edit profile"
          accessibilityRole="button"
        >
          <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primaryMuted }]}>
            <Ionicons name="person" size={32} color={theme.colors.primary} />
          </View>
          <Text style={[styles.editProfileText, { color: theme.colors.primary }]}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search patients by name or ID..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor={theme.colors.textSecondary}
          accessibilityLabel="Search patients"
          accessibilityHint="Search by name or ID"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        <FlashList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterButtons}
          renderItem={({ item }) => (
            <TouchableOpacity
              key={item.filter}
              style={[
                styles.filterTab,
                selectedFilter === item.filter && styles.filterTabActive,
              ]}
              onPress={() => {
                triggerHaptic();
                setSelectedFilter(item.filter);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedFilter === item.filter }}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: selectedFilter === item.filter ? theme.colors.primary : theme.colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
              {selectedFilter === item.filter && (
                <View style={[styles.filterTabIndicator, { backgroundColor: theme.colors.primary }]} />
              )}
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.filter}
          estimatedItemSize={100}
        />
      </View>

      {/* Patient Count and New Patient Button */}
      <View style={styles.patientCountRow}>
        <Text style={[styles.patientCountText, { color: theme.colors.textSecondary }]}>
          Total: {filteredPatients.length} Patients
        </Text>
        <TouchableOpacity
          style={[styles.newPatientButton, { backgroundColor: theme.colors.primary }]}
          onPress={addNewPatient}
          accessibilityLabel="Add new patient"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newPatientButtonText}>New Patient</Text>
        </TouchableOpacity>
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'android' ? Math.max(topInset, 24) + 20 : 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerDate: {
    fontSize: 14 * fontScale,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26 * fontScale,
    fontWeight: 'bold',
    lineHeight: 32 * fontScale,
  },
  profileContainer: {
    alignItems: 'center',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  editProfileText: {
    fontSize: 12 * fontScale,
    fontWeight: '500',
  },
  // Search container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16 * fontScale,
  },
  // Filter tabs
  filterTabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    minHeight: 36,
  },
  filterTab: {
    paddingBottom: 8,
    paddingRight: 20,
    position: 'relative',
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 15 * fontScale,
    fontWeight: '500',
  },
  filterTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  // Patient count row
  patientCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  patientCountText: {
    fontSize: 14 * fontScale,
    fontWeight: '500',
  },
  newPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  newPatientButtonText: {
    color: '#fff',
    fontSize: 14 * fontScale,
    fontWeight: '600',
  },
  patientsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // Patient card design
  patientCard: {
    borderRadius: 16,
    marginBottom: 12,
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
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Initials avatar
  initialsAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
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
    marginBottom: 4,
  },
  patientName: {
    fontSize: 17 * fontScale,
    fontWeight: '600',
    flexShrink: 1,
  },
  favoriteIcon: {
    marginLeft: 6,
  },
  lastVisitText: {
    fontSize: 13 * fontScale,
  },
  // Status badge
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
    minWidth: 70,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11 * fontScale,
    fontWeight: '600',
    letterSpacing: 0.3,
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
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
