import React from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  variant?: 'pulse' | 'shimmer';
}

/**
 * Optimized Skeleton loader component for better loading UX
 * Uses native driver for opacity animations where possible
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  variant = 'pulse',
}) => {
  const { theme } = useTheme();
  const opacityAnim = React.useRef(new Animated.Value(0.4)).current;
  const translateAnim = React.useRef(new Animated.Value(-1)).current;

  React.useEffect(() => {
    if (variant === 'shimmer') {
      // Shimmer effect using translateX with native driver
      const shimmerAnimation = Animated.loop(
        Animated.timing(translateAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      shimmerAnimation.start();
      return () => shimmerAnimation.stop();
    } else {
      // Optimized pulse animation using opacity with native driver
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [variant, opacityAnim, translateAnim]);

  if (variant === 'shimmer') {
    return (
      <View
        style={[
          {
            width,
            height,
            borderRadius,
            backgroundColor: theme.colors.border,
            overflow: 'hidden',
          },
          style,
        ]}
        accessibilityLabel="Loading content"
        accessibilityRole="progressbar"
      >
        <Animated.View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.surface,
            transform: [
              {
                translateX: translateAnim.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-200, 200],
                }),
              },
            ],
            opacity: 0.3,
          }}
        />
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity: opacityAnim,
        },
        style,
      ]}
      accessibilityLabel="Loading content"
      accessibilityRole="progressbar"
    />
  );
};

// Default export for convenience
export default SkeletonLoader;

/**
 * Patient card skeleton loader
 */
export const PatientCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={[styles.patientCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardContent}>
        <View style={styles.patientInfo}>
          <SkeletonLoader
            width={50}
            height={50}
            borderRadius={25}
            style={styles.photoSkeleton}
          />
          <View style={styles.patientDetails}>
            <SkeletonLoader width="70%" height={18} style={styles.nameSkeleton} />
            <SkeletonLoader width="40%" height={14} style={styles.idSkeleton} />
            <SkeletonLoader width="60%" height={14} style={styles.phoneSkeleton} />
            <SkeletonLoader width="90%" height={12} style={styles.complaintSkeleton} />
          </View>
        </View>
        <View style={styles.cardActions}>
          <SkeletonLoader width={20} height={20} borderRadius={10} />
          <SkeletonLoader width={60} height={20} borderRadius={10} />
        </View>
      </View>
    </View>
  );
};

/**
 * Profile skeleton loader
 */
export const ProfileSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View>
      {/* User Section Skeleton */}
      <View style={[styles.userSection, { backgroundColor: theme.colors.surface }]}>
        <SkeletonLoader
          width={80}
          height={80}
          borderRadius={40}
          style={styles.userAvatar}
        />
        <SkeletonLoader width="60%" height={24} style={styles.userName} />
        <SkeletonLoader width="40%" height={16} style={styles.userEmail} />
        <SkeletonLoader width="30%" height={14} style={styles.userSpecialty} />
      </View>

      {/* Stats Section Skeleton */}
      <View style={[styles.statsSection, { backgroundColor: theme.colors.surface }]}>
        <SkeletonLoader width="40%" height={18} style={styles.sectionTitle} />
        <View style={styles.statsGrid}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.statCard}>
              <SkeletonLoader width={32} height={32} borderRadius={16} />
              <SkeletonLoader width="60%" height={20} style={{ marginTop: 8 }} />
              <SkeletonLoader width="80%" height={12} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

/**
 * Multiple patient card skeletons for list loading state
 */
export const PatientListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <PatientCardSkeleton key={`skeleton-${index}`} />
      ))}
    </View>
  );
};

/**
 * Search bar skeleton
 */
export const SearchBarSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
      <SkeletonLoader width={20} height={20} borderRadius={10} />
      <SkeletonLoader width="75%" height={16} borderRadius={4} style={{ marginLeft: 12 }} />
      <SkeletonLoader width={20} height={20} borderRadius={10} style={{ marginLeft: 'auto' }} />
    </View>
  );
};

/**
 * Filter chips skeleton
 */
export const FilterChipsSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.filterContainer}>
      {[60, 80, 70, 90].map((width, i) => (
        <SkeletonLoader
          key={i}
          width={width}
          height={32}
          borderRadius={16}
          style={{ marginRight: 8 }}
        />
      ))}
    </View>
  );
};

/**
 * Full page skeleton for initial patient list loading
 */
export const FullPageSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.fullPage}>
      <SearchBarSkeleton />
      <FilterChipsSkeleton />
      <PatientListSkeleton count={6} />
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  fullPage: {
    flex: 1,
    paddingTop: 8,
  },
  patientCard: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  patientInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  photoSkeleton: {
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  nameSkeleton: {
    marginBottom: 4,
  },
  idSkeleton: {
    marginBottom: 2,
  },
  phoneSkeleton: {
    marginBottom: 4,
  },
  complaintSkeleton: {
    marginBottom: 0,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  userAvatar: {
    marginBottom: 16,
  },
  userName: {
    marginBottom: 4,
  },
  userEmail: {
    marginBottom: 8,
  },
  userSpecialty: {
    marginBottom: 0,
  },
  statsSection: {
    padding: theme.spacing.md,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
  },
});