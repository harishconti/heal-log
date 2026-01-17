import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useNetwork } from '@/contexts/NetworkContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'pending';

interface SyncStatusIndicatorProps {
  onSyncPress?: () => void;
  pendingChanges?: number;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  onSyncPress,
  pendingChanges = 0,
}) => {
  const { isConnected, isInternetReachable } = useNetwork();
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme);
  const { loading, lastSyncTime, errors } = useAppStore();

  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const slideValue = useRef(new Animated.Value(0)).current;

  const isOnline = isConnected && isInternetReachable !== false;
  const isSyncing = loading.sync;
  const hasError = !!errors.sync;

  // Determine sync status
  const getSyncStatus = (): SyncStatus => {
    if (isSyncing) return 'syncing';
    if (hasError) return 'error';
    if (pendingChanges > 0) return 'pending';
    if (lastSyncTime) return 'success';
    return 'idle';
  };

  const syncStatus = getSyncStatus();

  // Spin animation for syncing state
  useEffect(() => {
    if (isSyncing) {
      const spin = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    } else {
      spinValue.setValue(0);
    }
  }, [isSyncing, spinValue]);

  // Pulse animation for pending changes
  useEffect(() => {
    if (pendingChanges > 0 && !isSyncing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseValue.setValue(1);
    }
  }, [pendingChanges, isSyncing, pulseValue]);

  // Slide in animation on mount
  useEffect(() => {
    Animated.spring(slideValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [slideValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusColor = () => {
    if (!isOnline) return theme.colors.warning;
    switch (syncStatus) {
      case 'syncing': return theme.colors.primary;
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'pending': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!isOnline) return 'cloud-offline';
    switch (syncStatus) {
      case 'syncing': return 'sync';
      case 'success': return 'cloud-done';
      case 'error': return 'cloud-offline';
      case 'pending': return 'cloud-upload';
      default: return 'cloud';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    switch (syncStatus) {
      case 'syncing': return 'Syncing...';
      case 'success': return 'Synced';
      case 'error': return 'Sync failed';
      case 'pending': return `${pendingChanges} pending`;
      default: return 'Ready';
    }
  };

  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Never synced';
    const date = new Date(lastSyncTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const statusColor = getStatusColor();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.95)',
          borderColor: statusColor,
          transform: [
            { translateY: slideValue.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onSyncPress}
        disabled={isSyncing || !isOnline}
        activeOpacity={0.7}
      >
        {/* Connection Status Dot */}
        <View style={[styles.connectionDot, { backgroundColor: isOnline ? theme.colors.success : theme.colors.error }]} />

        {/* Sync Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: syncStatus === 'syncing' ? [{ rotate: spin }] : [{ scale: pulseValue }],
            },
          ]}
        >
          <Ionicons name={getStatusIcon()} size={18} color={statusColor} />
        </Animated.View>

        {/* Status Text */}
        <View style={styles.textContainer}>
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            {getStatusText()}
          </Text>
          <Text style={[styles.lastSyncText, { color: theme.colors.textSecondary }]}>
            {getLastSyncText()}
          </Text>
        </View>

        {/* Pending Badge */}
        {pendingChanges > 0 && !isSyncing && (
          <View style={[styles.badge, { backgroundColor: theme.colors.warning }]}>
            <Text style={styles.badgeText}>{pendingChanges}</Text>
          </View>
        )}

        {/* Tap to Sync Hint */}
        {isOnline && !isSyncing && (syncStatus === 'error' || syncStatus === 'pending') && (
          <Ionicons name="refresh" size={16} color={theme.colors.textSecondary} style={styles.refreshHint} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  iconContainer: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastSyncText: {
    fontSize: 11,
    marginTop: 1,
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
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  refreshHint: {
    marginLeft: 8,
  },
});

export default SyncStatusIndicator;
