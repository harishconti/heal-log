import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Skeleton loader component for better loading UX
 * Creates a shimmer effect while content is loading
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.textSecondary + '30'],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

/**
 * Patient card skeleton loader
 */
export const PatientCardSkeleton: React.FC = () => {
  const { theme } = useTheme();

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

const styles = StyleSheet.create({
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
    padding: 16,
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
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
});