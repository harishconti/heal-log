import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
}

/**
 * Reusable Button component with theming, haptic feedback, and multiple variants
 * 
 * @param title - Button text
 * @param onPress - Function to call when button is pressed
 * @param variant - Button style variant (default: 'primary')
 * @param size - Button size (default: 'medium')
 * @param disabled - Whether button is disabled
 * @param loading - Whether to show loading spinner
 * @param icon - Ionicon name to display
 * @param iconPosition - Position of icon relative to text
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
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const { theme } = useTheme();
  const { settings } = useAppStore();

  const handlePress = async () => {
    if (disabled || loading) return;

    // Haptic feedback
    if (hapticFeedback && settings.hapticEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size variations
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: theme.colors.primary,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      danger: {
        backgroundColor: theme.colors.error,
      },
      success: {
        backgroundColor: theme.colors.success,
      },
    };

    // Disabled style
    const disabledStyle: ViewStyle = disabled
      ? {
          opacity: 0.6,
          backgroundColor: theme.colors.border,
        }
      : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: theme.typography.weights.semibold,
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
        color: '#ffffff',
      },
      secondary: {
        color: '#ffffff',
      },
      outline: {
        color: theme.colors.primary,
      },
      danger: {
        color: '#ffffff',
      },
      success: {
        color: '#ffffff',
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
      small: 16,
      medium: 20,
      large: 24,
    };
    return iconSizes[size];
  };

  const getIconColor = () => {
    return variant === 'outline' ? theme.colors.primary : '#ffffff';
  };

  const renderIcon = () => {
    if (!icon) return null;

    const iconElement = (
      <Ionicons
        name={icon}
        size={getIconSize()}
        color={getIconColor()}
        style={{
          marginRight: iconPosition === 'left' && title ? theme.spacing.xs : 0,
          marginLeft: iconPosition === 'right' && title ? theme.spacing.xs : 0,
        }}
      />
    );

    return iconElement;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'small'}
          color={getIconColor()}
        />
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && renderIcon()}
        {title ? <Text style={getTextStyle()}>{title}</Text> : null}
        {icon && iconPosition === 'right' && renderIcon()}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};