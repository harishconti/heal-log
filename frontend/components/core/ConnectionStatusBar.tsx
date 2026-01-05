import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { useNetwork } from '@/contexts/NetworkContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

interface ConnectionStatusBarProps {
  onSyncPress?: () => void;
  showDetails?: boolean;
}

const ConnectionStatusBar: React.FC<ConnectionStatusBarProps> = ({
  onSyncPress,
  showDetails = true
}) => {
  const { isConnected, isInternetReachable, type } = useNetwork();
  const { theme } = useTheme();
  const { syncState, lastSyncTime, isOffline } = useAppStore();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isOnline = isConnected && isInternetReachable !== false;
  const isSyncing = syncState.status === 'syncing';
  const hasPendingChanges = syncState.pendingChanges > 0;
  const hasError = syncState.status === 'error';

  // Pulse animation for offline/error states
  useEffect(() => {
    if (!isOnline || hasError) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline, hasError, pulseAnim]);

  // Rotate animation for syncing
  useEffect(() => {
    if (isSyncing) {
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotate.start();
      return () => rotate.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isSyncing, rotateAnim]);

  // Slide animation for status changes
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [isOnline, syncState.status]);

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: 'cloud-offline' as const,
        color: theme.colors.warning,
        bgColor: `${theme.colors.warning}20`,
        primaryText: 'Offline Mode',
        secondaryText: hasPendingChanges
          ? `${syncState.pendingChanges} change${syncState.pendingChanges > 1 ? 's' : ''} saved locally`
          : 'Your data is safe - changes will sync when online',
        showSync: false,
      };
    }

    if (isSyncing) {
      return {
        icon: 'sync' as const,
        color: theme.colors.primary,
        bgColor: `${theme.colors.primary}15`,
        primaryText: 'Syncing...',
        secondaryText: 'Updating your data',
        showSync: false,
      };
    }

    if (hasError) {
      return {
        icon: 'cloud-offline' as const,
        color: theme.colors.error,
        bgColor: `${theme.colors.error}15`,
        primaryText: 'Sync Failed',
        secondaryText: 'Tap to retry - your data is saved locally',
        showSync: true,
      };
    }

    if (hasPendingChanges) {
      return {
        icon: 'cloud-upload' as const,
        color: theme.colors.warning,
        bgColor: `${theme.colors.warning}15`,
        primaryText: 'Pending Sync',
        secondaryText: `${syncState.pendingChanges} change${syncState.pendingChanges > 1 ? 's' : ''} waiting to sync`,
        showSync: true,
      };
    }

    if (syncState.status === 'success' && lastSyncTime) {
      const timeSince = getTimeSince(lastSyncTime);
      return {
        icon: 'checkmark-circle' as const,
        color: theme.colors.success,
        bgColor: `${theme.colors.success}15`,
        primaryText: 'All Synced',
        secondaryText: `Last synced ${timeSince}`,
        showSync: false,
      };
    }

    return {
      icon: 'cloud-done' as const,
      color: theme.colors.success,
      bgColor: `${theme.colors.success}10`,
      primaryText: 'Connected',
      secondaryText: getConnectionType(),
      showSync: false,
    };
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getConnectionType = () => {
    if (type === 'wifi') return 'WiFi';
    if (type === 'cellular') return 'Mobile Data';
    return 'Connected';
  };

  const config = getStatusConfig();
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = createStyles(theme, config.bgColor);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: slideAnim,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={config.showSync ? onSyncPress : undefined}
        disabled={!config.showSync}
        activeOpacity={config.showSync ? 0.7 : 1}
      >
        <View style={styles.iconContainer}>
          <Animated.View style={isSyncing ? { transform: [{ rotate: spin }] } : undefined}>
            <Ionicons name={config.icon} size={20} color={config.color} />
          </Animated.View>
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.primaryText, { color: config.color }]}>
            {config.primaryText}
          </Text>
          {showDetails && (
            <Text style={[styles.secondaryText, { color: theme.colors.textSecondary }]}>
              {config.secondaryText}
            </Text>
          )}
        </View>

        {config.showSync && (
          <View style={[styles.actionButton, { backgroundColor: config.color }]}>
            <Ionicons name="refresh" size={14} color={theme.colors.surface} />
          </View>
        )}

        {hasPendingChanges && isOnline && !isSyncing && (
          <View style={[styles.badge, { backgroundColor: theme.colors.warning }]}>
            <Text style={styles.badgeText}>{syncState.pendingChanges}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Data safety indicator */}
      {!isOnline && (
        <View style={styles.safetyIndicator}>
          <Ionicons name="shield-checkmark" size={12} color={theme.colors.success} />
          <Text style={[styles.safetyText, { color: theme.colors.success }]}>
            Data saved securely on device
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const createStyles = (theme: any, bgColor: string) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      backgroundColor: bgColor,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    iconContainer: {
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    primaryText: {
      fontSize: 14,
      fontWeight: '600',
    },
    secondaryText: {
      fontSize: 12,
      marginTop: 2,
    },
    actionButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      marginLeft: 8,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#fff',
    },
    safetyIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingBottom: 10,
      paddingTop: 0,
      gap: 6,
    },
    safetyText: {
      fontSize: 11,
      fontWeight: '500',
    },
  });

export default ConnectionStatusBar;
