import React, { useState, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';

export interface MenuOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface LongPressMenuProps {
  children: ReactNode;
  options: MenuOption[];
  onLongPress?: () => void;
  onPress?: () => void;
  delayLongPress?: number;
  disabled?: boolean;
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MENU_WIDTH = 200;

const LongPressMenu: React.FC<LongPressMenuProps> = ({
  children,
  options,
  onLongPress,
  onPress,
  delayLongPress = 400, // Reduced from 500ms for snappier feel
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();
  const { settings } = useAppStore();
  const styles = createStyles(theme);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isPressing, setIsPressing] = useState(false);
  const scaleAnim = useState(new Animated.Value(0))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];
  const pressScaleAnim = useState(new Animated.Value(1))[0];

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (settings.hapticEnabled) {
      Haptics.impactAsync(style);
    }
  };

  const showMenu = (event: any) => {
    if (disabled || options.length === 0) return;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    onLongPress?.();

    const { pageX, pageY } = event.nativeEvent;

    // Calculate menu position to keep it on screen
    let x = pageX - MENU_WIDTH / 2;
    let y = pageY + 10;

    // Keep menu within screen bounds
    x = Math.max(10, Math.min(x, SCREEN_WIDTH - MENU_WIDTH - 10));
    y = Math.min(y, SCREEN_HEIGHT - options.length * 50 - 100);

    setMenuPosition({ x, y });
    setMenuVisible(true);

    // Animate menu appearance - optimized for snappier feel
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150, // Increased from 100 for faster spring
        friction: 7, // Reduced from 8 for snappier bounce
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 120, // Reduced from 150ms
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideMenu = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
    });
  };

  const handleOptionPress = (option: MenuOption) => {
    if (option.disabled) return;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    hideMenu();

    // Delay the action slightly to allow the menu to close
    setTimeout(() => {
      option.onPress();
    }, 150);
  };

  const handlePress = () => {
    if (!disabled) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      onPress?.();
    }
  };

  const handlePressIn = () => {
    setIsPressing(true);
    // Animate scale down slightly to indicate press - faster response
    Animated.spring(pressScaleAnim, {
      toValue: 0.97, // Slightly more noticeable scale
      useNativeDriver: true,
      tension: 200, // Increased for faster response
      friction: 8, // Reduced for snappier feel
    }).start();
  };

  const handlePressOut = () => {
    setIsPressing(false);
    // Animate scale back - faster recovery
    Animated.spring(pressScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200, // Increased for faster response
      friction: 8, // Reduced for snappier feel
    }).start();
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={showMenu}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={delayLongPress}
        activeOpacity={0.9}
        disabled={disabled}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint || 'Long press to see more options'}
        accessibilityRole="button"
      >
        <Animated.View style={{ transform: [{ scale: pressScaleAnim }] }}>
          {children}
          {/* Visual affordance indicator for long-press */}
          {options.length > 0 && !disabled && (
            <View style={[styles.longPressIndicator, { backgroundColor: theme.colors.textSecondary }]}>
              <View style={[styles.longPressIndicatorDot, { backgroundColor: theme.colors.surface }]} />
              <View style={[styles.longPressIndicatorDot, { backgroundColor: theme.colors.surface }]} />
              <View style={[styles.longPressIndicatorDot, { backgroundColor: theme.colors.surface }]} />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={hideMenu}
        accessibilityViewIsModal={true}
      >
        <TouchableWithoutFeedback onPress={hideMenu} accessibilityLabel="Close menu">
          <View style={styles.overlay} accessibilityRole="none">
            <Animated.View
              style={[
                styles.menuContainer,
                {
                  backgroundColor: theme.colors.surface,
                  left: menuPosition.x,
                  top: menuPosition.y,
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                  shadowColor: theme.colors.shadow,
                },
              ]}
            >
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.menuOption,
                    index !== options.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.colors.border,
                    },
                    option.disabled && styles.menuOptionDisabled,
                  ]}
                  onPress={() => handleOptionPress(option)}
                  disabled={option.disabled}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={
                      option.disabled
                        ? theme.colors.textSecondary
                        : option.destructive
                        ? theme.colors.error
                        : theme.colors.text
                    }
                    style={styles.menuIcon}
                  />
                  <Text
                    style={[
                      styles.menuLabel,
                      {
                        color: option.disabled
                          ? theme.colors.textSecondary
                          : option.destructive
                          ? theme.colors.error
                          : theme.colors.text,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Lighter overlay for context menus
  },
  menuContainer: {
    position: 'absolute',
    width: MENU_WIDTH,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md - 2,
  },
  menuOptionDisabled: {
    opacity: 0.5,
  },
  menuIcon: {
    marginRight: theme.spacing.md - 4,
  },
  menuLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '500',
  },
  // Visual affordance for long-press
  longPressIndicator: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: 2,
    opacity: 0.6,
  },
  longPressIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default LongPressMenu;
