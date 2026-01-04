import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { useNetwork } from '@/contexts/NetworkContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

interface OfflineIndicatorProps {
  compact?: boolean;
  onRetryPress?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  compact = false,
  onRetryPress
}) => {
  const { isConnected, isInternetReachable, type } = useNetwork();
  const { theme } = useTheme();
  const { loading, lastSyncTime, errors } = useAppStore();

  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isOnline = isConnected && isInternetReachable !== false;
  const isSyncing = loading.sync;
  const hasSyncError = !!errors.sync;

  // Slide animation when offline status changes
  useEffect(() => {
    if (!isOnline) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Start pulse animation for attention
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.85,
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
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, slideAnim, pulseAnim]);

  if (isOnline) {
    return null;
  }

  const getOfflineMessage = () => {
    if (type === 'none') {
      return 'No network connection';
    }
    if (isConnected && isInternetReachable === false) {
      return 'Connected but no internet access';
    }
    return 'You are offline';
  };

  const getSecondaryMessage = () => {
    if (lastSyncTime) {
      const date = new Date(lastSyncTime);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Last synced just now';
      if (diffMins < 60) return `Last synced ${diffMins} min ago`;
      if (diffHours < 24) return `Last synced ${diffHours} hours ago`;
      return `Last synced ${date.toLocaleDateString()}`;
    }
    return 'Changes will sync when online';
  };

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactContainer,
          {
            backgroundColor: theme.colors.warning,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Ionicons name="cloud-offline" size={14} color={theme.colors.surface} />
        <Text style={[styles.compactText, { color: theme.colors.surface }]}>Offline</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.error,
          transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-offline" size={20} color={theme.colors.surface} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.primaryText, { color: theme.colors.surface }]}>
            {getOfflineMessage()}
          </Text>
          <Text style={[styles.secondaryText, { color: 'rgba(255,255,255,0.8)' }]}>
            {getSecondaryMessage()}
          </Text>
        </View>
        {onRetryPress && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={onRetryPress}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.surface} />
          </TouchableOpacity>
        )}
      </View>

      {/* Connection type indicator */}
      <View style={styles.connectionInfo}>
        <View style={[styles.dot, { backgroundColor: theme.colors.surface }]} />
        <Text style={[styles.connectionText, { color: 'rgba(255,255,255,0.7)' }]}>
          {type === 'wifi' ? 'WiFi' : type === 'cellular' ? 'Mobile Data' : 'No Connection'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
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
  retryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    opacity: 0.7,
  },
  connectionText: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OfflineIndicator;
