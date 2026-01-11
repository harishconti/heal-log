import React, { useState } from 'react';
import {
  TouchableOpacity,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
  View,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
}

/**
 * Reusable Button component with healthcare design system styling
 *
 * @param title - Button text
 * @param onPress - Function to call when button is pressed
 * @param variant - Button style variant (default: 'primary')
 * @param size - Button size (default: 'medium')
 * @param disabled - Whether button is disabled
 * @param loading - Whether to show loading spinner
 * @param icon - Ionicon name to display
 * @param iconPosition - Position of icon relative to text
 * @param fullWidth - Whether button should take full width
 * @param rounded - Whether to use fully rounded corners (pill style)
 * @param hapticFeedback - Whether to trigger haptic feedback on press
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  rounded = false,
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const { theme } = useTheme();
  const { settings } = useAppStore();
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    if (disabled || loading) return;

    // Haptic feedback
    if (hapticFeedback && settings.hapticEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress();
  };

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size variations
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 40,
        borderRadius: rounded ? theme.borderRadius.full : theme.borderRadius.md,
      },
      medium: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        minHeight: 52,
        borderRadius: rounded ? theme.borderRadius.full : theme.borderRadius.lg,
      },
      large: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        minHeight: 60,
        borderRadius: rounded ? theme.borderRadius.full : theme.borderRadius.xl,
      },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: theme.colors.primary,
        ...Platform.select({
          ios: {
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          android: {
            elevation: 4,
          },
        }),
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        ...Platform.select({
          ios: {
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          android: {
            elevation: 2,
          },
        }),
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
      },
      danger: {
        backgroundColor: theme.colors.error,
        ...Platform.select({
          ios: {
            shadowColor: theme.colors.error,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          android: {
            elevation: 4,
          },
        }),
      },
      success: {
        backgroundColor: theme.colors.success,
        ...Platform.select({
          ios: {
            shadowColor: theme.colors.success,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          },
          android: {
            elevation: 4,
          },
        }),
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    // Width style
    const widthStyle: ViewStyle = fullWidth
      ? { width: '100%' }
      : { alignSelf: 'flex-start' };

    // Disabled style
    const disabledStyle: ViewStyle = disabled
      ? {
          opacity: 0.5,
        }
      : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...widthStyle,
      ...disabledStyle,
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    // Size text variations
    const sizeTextStyles: Record<string, TextStyle> = {
      small: {
        fontSize: theme.typography.sizes.sm,
      },
      medium: {
        fontSize: theme.typography.sizes.md,
      },
      large: {
        fontSize: theme.typography.sizes.lg,
      },
    };

    // Variant text colors
    const variantTextStyles: Record<string, TextStyle> = {
      primary: {
        color: '#FFFFFF',
      },
      secondary: {
        color: '#FFFFFF',
      },
      outline: {
        color: theme.colors.primary,
      },
      danger: {
        color: '#FFFFFF',
      },
      success: {
        color: '#FFFFFF',
      },
      ghost: {
        color: theme.colors.primary,
      },
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
      ...textStyle,
    };
  };

  const getIconSize = () => {
    const iconSizes = {
      small: 18,
      medium: 20,
      large: 24,
    };
    return iconSizes[size];
  };

  const getIconColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return theme.colors.primary;
    }
    return '#FFFFFF';
  };

  const renderIcon = () => {
    if (!icon) return null;

    const iconElement = (
      <Ionicons
        name={icon}
        size={getIconSize()}
        color={getIconColor()}
        style={{
          marginRight: iconPosition === 'left' && title ? theme.spacing.sm : 0,
          marginLeft: iconPosition === 'right' && title ? theme.spacing.sm : 0,
        }}
      />
    );

    return iconElement;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={getIconColor()}
        />
      );
    }

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon && iconPosition === 'left' && renderIcon()}
        {title ? (
          <Text
            style={getTextStyle()}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {title}
          </Text>
        ) : null}
        {icon && iconPosition === 'right' && renderIcon()}
      </View>
    );
  };

  // Get focus indicator style
  const getFocusStyle = (): ViewStyle => {
    if (!isFocused) return {};
    return {
      borderWidth: 2,
      borderColor: variant === 'outline' ? theme.colors.primary : theme.colors.surface,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      ...Platform.select({
        android: {
          elevation: 8,
        },
      }),
    };
  };

  // Get pressed style (ripple-like effect)
  const getPressedStyle = (): ViewStyle => {
    if (!isPressed) return {};
    return {
      opacity: 0.9,
    };
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={({ pressed }) => [
          getButtonStyle(),
          getFocusStyle(),
          pressed && getPressedStyle(),
          Platform.OS === 'android' && {
            // Android ripple container
            overflow: 'hidden',
          },
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled || loading}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        android_ripple={
          Platform.OS === 'android' && !disabled
            ? {
                color: variant === 'primary' || variant === 'danger' || variant === 'success'
                  ? 'rgba(255, 255, 255, 0.3)'
                  : `${theme.colors.primary}30`,
                borderless: false,
              }
            : undefined
        }
      >
        {renderContent()}
      </Pressable>
    </Animated.View>
  );
};
