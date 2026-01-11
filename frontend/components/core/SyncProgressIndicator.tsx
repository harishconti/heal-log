import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore, SyncStatus } from '@/store/useAppStore';

interface SyncProgressIndicatorProps {
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

const SyncProgressIndicator: React.FC<SyncProgressIndicatorProps> = ({
  onRetry,
  onDismiss,
  compact = false,
}) => {
  const { theme, fontScale } = useTheme();
  const { syncState, loading, settings, lastSyncTime } = useAppStore();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const { status, consecutiveFailures, pendingChanges } = syncState;
  const isSyncing = loading.sync || status === 'syncing';
  const hasError = status === 'error' || consecutiveFailures > 0;
  const hasPendingChanges = pendingChanges > 0;

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (settings.hapticEnabled) {
      Haptics.impactAsync(style);
    }
  };

  // Animate progress bar when syncing
  useEffect(() => {
    if (isSyncing) {
      // Show indicator
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Animate progress
      const progressAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 0.7,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      progressAnimation.start();

      return () => progressAnimation.stop();
    } else {
      // Complete or hide
      if (hasError) {
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      } else {
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          setTimeout(() => {
            Animated.timing(slideAnim, {
              toValue: -100,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }, 1500);
        });
      }
    }
  }, [isSyncing, hasError, progressAnim, slideAnim]);

  // Pulse animation for error state
  useEffect(() => {
    if (hasError && !isSyncing) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [hasError, isSyncing, pulseAnim, slideAnim]);

  const handleRetry = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    onRetry?.();
  };

  const handleDismiss = () => {
    triggerHaptic();
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  const getStatusMessage = () => {
    if (isSyncing) {
      return 'Syncing your data...';
    }
    if (hasError) {
      if (consecutiveFailures >= 3) {
        return 'Sync failed multiple times';
      }
      return 'Sync failed';
    }
    if (hasPendingChanges) {
      return `${pendingChanges} change${pendingChanges > 1 ? 's' : ''} pending`;
    }
    return 'Synced successfully';
  };

  const getSecondaryMessage = () => {
    if (isSyncing) {
      return 'Please wait...';
    }
    if (hasError) {
      return 'Tap retry to sync again';
    }
    if (lastSyncTime) {
      const date = new Date(lastSyncTime);
      return `Last sync: ${date.toLocaleTimeString()}`;
    }
    return '';
  };

  const getStatusColor = () => {
    if (isSyncing) return theme.colors.primary;
    if (hasError) return theme.colors.error;
    if (hasPendingChanges) return theme.colors.warning;
    return theme.colors.success;
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isSyncing) return 'sync-outline';
    if (hasError) return 'cloud-offline-outline';
    if (hasPendingChanges) return 'time-outline';
    return 'cloud-done-outline';
  };

  // Don't show anything if sync is idle and successful with no pending changes
  if (!isSyncing && !hasError && !hasPendingChanges && status !== 'success') {
    return null;
  }

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactContainer,
          {
            backgroundColor: getStatusColor(),
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Ionicons name={getStatusIcon()} size={14} color={theme.colors.surface} />
        <Text style={[styles.compactText, { color: theme.colors.surface }]}>
          {getStatusMessage()}
        </Text>
        {hasError && onRetry && (
          <TouchableOpacity
            onPress={handleRetry}
            style={styles.compactRetry}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh" size={14} color={theme.colors.surface} />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          transform: [{ translateY: slideAnim }, { scale: hasError ? pulseAnim : 1 }],
          borderLeftColor: getStatusColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: getStatusColor() + '20' }]}>
          <Ionicons name={getStatusIcon()} size={20} color={getStatusColor()} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.primaryText, { color: theme.colors.text, fontSize: 14 * fontScale }]}>
            {getStatusMessage()}
          </Text>
          <Text style={[styles.secondaryText, { color: theme.colors.textSecondary, fontSize: 12 * fontScale }]}>
            {getSecondaryMessage()}
          </Text>
        </View>
        <View style={styles.actions}>
          {hasError && onRetry && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleRetry}
              accessibilityLabel="Retry sync"
              accessibilityRole="button"
            >
              <Ionicons name="refresh" size={16} color={theme.colors.surface} />
              <Text style={[styles.retryText, { color: theme.colors.surface }]}>Retry</Text>
            </TouchableOpacity>
          )}
          {!isSyncing && onDismiss && (
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.dismissButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Dismiss"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress bar */}
      {isSyncing && (
        <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.colors.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      )}

      {/* Consecutive failures warning */}
      {consecutiveFailures >= 2 && (
        <View style={[styles.warningBanner, { backgroundColor: theme.colors.warning + '20' }]}>
          <Ionicons name="warning-outline" size={14} color={theme.colors.warning} />
          <Text style={[styles.warningText, { color: theme.colors.warning, fontSize: 11 * fontScale }]}>
            {consecutiveFailures} consecutive failures. Check your connection.
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  primaryText: {
    fontWeight: '600',
  },
  secondaryText: {
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  progressBarContainer: {
    height: 3,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontWeight: '500',
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
  compactRetry: {
    marginLeft: 8,
    padding: 4,
  },
});

export default SyncProgressIndicator;
