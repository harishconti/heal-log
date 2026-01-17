import React, { useRef, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Swipeable,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';

export interface SwipeAction {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
  onPress: () => void;
  label?: string;
}

interface SwipeableRowProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeOpen?: (direction: 'left' | 'right') => void;
  onSwipeClose?: () => void;
  enabled?: boolean;
  overshootLeft?: boolean;
  overshootRight?: boolean;
  friction?: number;
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const SWIPE_THRESHOLD = 80;

const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeOpen,
  onSwipeClose,
  enabled = true,
  overshootLeft = false,
  overshootRight = false,
  friction = 1.5, // Reduced from 2 for snappier swipe completion
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();
  const { settings } = useAppStore();
  const swipeableRef = useRef<Swipeable>(null);
  const styles = getStyles(theme);

  const triggerHaptic = () => {
    if (settings.hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const closeSwipeable = () => {
    swipeableRef.current?.close();
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (leftActions.length === 0) return null;

    const totalWidth = leftActions.length * SWIPE_THRESHOLD;

    return (
      <View style={[styles.actionsContainer, { width: totalWidth }]}>
        {leftActions.map((action, index) => {
          const trans = dragX.interpolate({
            inputRange: [0, totalWidth],
            outputRange: [-SWIPE_THRESHOLD * (leftActions.length - index), 0],
            extrapolate: 'clamp',
          });

          const scale = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.actionButton,
                {
                  backgroundColor: action.backgroundColor,
                  transform: [{ translateX: trans }, { scale }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.actionTouchable}
                onPress={() => {
                  triggerHaptic();
                  action.onPress();
                  closeSwipeable();
                }}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
                {action.label && (
                  <Text style={[styles.actionLabel, { color: action.color }]}>
                    {action.label}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (rightActions.length === 0) return null;

    const totalWidth = rightActions.length * SWIPE_THRESHOLD;

    return (
      <View style={[styles.actionsContainer, { width: totalWidth, flexDirection: 'row-reverse' }]}>
        {rightActions.map((action, index) => {
          const trans = dragX.interpolate({
            inputRange: [-totalWidth, 0],
            outputRange: [0, SWIPE_THRESHOLD * (rightActions.length - index)],
            extrapolate: 'clamp',
          });

          const scale = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.actionButton,
                {
                  backgroundColor: action.backgroundColor,
                  transform: [{ translateX: trans }, { scale }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.actionTouchable}
                onPress={() => {
                  triggerHaptic();
                  action.onPress();
                  closeSwipeable();
                }}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
                {action.label && (
                  <Text style={[styles.actionLabel, { color: action.color }]}>
                    {action.label}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const handleSwipeOpen = (direction: 'left' | 'right') => {
    triggerHaptic();
    onSwipeOpen?.(direction);
  };

  // Build accessibility hint based on available actions
  const getDefaultAccessibilityHint = () => {
    const hints: string[] = [];
    if (leftActions.length > 0) {
      hints.push(`Swipe right for ${leftActions.map(a => a.label || 'action').join(', ')}`);
    }
    if (rightActions.length > 0) {
      hints.push(`Swipe left for ${rightActions.map(a => a.label || 'action').join(', ')}`);
    }
    return hints.join('. ');
  };

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <View
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint || getDefaultAccessibilityHint()}
      accessibilityRole="button"
    >
      <Swipeable
        ref={swipeableRef}
        friction={friction}
        overshootLeft={overshootLeft}
        overshootRight={overshootRight}
        renderLeftActions={leftActions.length > 0 ? renderLeftActions : undefined}
        renderRightActions={rightActions.length > 0 ? renderRightActions : undefined}
        onSwipeableOpen={handleSwipeOpen}
        onSwipeableClose={onSwipeClose}
        containerStyle={styles.swipeableContainer}
      >
        {children}
      </Swipeable>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  swipeableContainer: {
    overflow: 'hidden',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionButton: {
    width: SWIPE_THRESHOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  actionLabel: {
    fontSize: theme.typography.sizes.xs,
    marginTop: 4,
    fontWeight: theme.typography.weights.medium,
  },
});

export default SwipeableRow;
