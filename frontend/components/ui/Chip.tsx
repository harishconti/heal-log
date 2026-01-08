import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

export interface ChipProps {
  label: string;
  variant?: 'filled' | 'outlined' | 'soft';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  onClose?: () => void;
  selected?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Chip/Tag component for displaying labels, filters, and selections
 *
 * @param label - Text to display
 * @param variant - Chip style variant (default: 'soft')
 * @param color - Color scheme (default: 'default')
 * @param size - Chip size (default: 'medium')
 * @param icon - Optional icon to display before label
 * @param onPress - Optional press handler
 * @param onClose - Optional close handler (shows X button)
 * @param selected - Whether chip is in selected state
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'soft',
  color = 'default',
  size = 'medium',
  icon,
  onPress,
  onClose,
  selected = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getColors = () => {
    const colorMap = {
      primary: {
        bg: theme.colors.primaryMuted,
        border: theme.colors.primary,
        text: theme.colors.primary,
        filled: theme.colors.primary,
      },
      secondary: {
        bg: `${theme.colors.secondary}20`,
        border: theme.colors.secondary,
        text: theme.colors.secondary,
        filled: theme.colors.secondary,
      },
      success: {
        bg: `${theme.colors.success}20`,
        border: theme.colors.success,
        text: theme.colors.success,
        filled: theme.colors.success,
      },
      warning: {
        bg: `${theme.colors.warning}20`,
        border: theme.colors.warning,
        text: theme.colors.warning,
        filled: theme.colors.warning,
      },
      error: {
        bg: `${theme.colors.error}20`,
        border: theme.colors.error,
        text: theme.colors.error,
        filled: theme.colors.error,
      },
      default: {
        bg: theme.colors.surface,
        border: theme.colors.border,
        text: theme.colors.textSecondary,
        filled: theme.colors.secondary,
      },
    };

    return colorMap[color];
  };

  const colors = getColors();

  const getSizeStyles = () => {
    const sizeMap = {
      small: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 11,
        iconSize: 12,
        borderRadius: 6,
      },
      medium: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 13,
        iconSize: 14,
        borderRadius: 8,
      },
      large: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
        iconSize: 16,
        borderRadius: 10,
      },
    };

    return sizeMap[size];
  };

  const sizeStyles = getSizeStyles();

  const getChipStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
      borderRadius: sizeStyles.borderRadius,
    };

    const variantStyles: Record<string, ViewStyle> = {
      filled: {
        backgroundColor: selected ? colors.filled : colors.filled,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: selected ? colors.filled : colors.border,
      },
      soft: {
        backgroundColor: selected ? colors.filled : colors.bg,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const isFilledOrSelected = variant === 'filled' || selected;

    return {
      fontSize: sizeStyles.fontSize,
      fontWeight: '500',
      color: isFilledOrSelected ? '#FFFFFF' : colors.text,
      ...textStyle,
    };
  };

  const getIconColor = () => {
    const isFilledOrSelected = variant === 'filled' || selected;
    return isFilledOrSelected ? '#FFFFFF' : colors.text;
  };

  const content = (
    <>
      {icon && (
        <Ionicons
          name={icon}
          size={sizeStyles.iconSize}
          color={getIconColor()}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={getTextStyle()}>{label}</Text>
      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginLeft: 4 }}
        >
          <Ionicons
            name="close"
            size={sizeStyles.iconSize}
            color={getIconColor()}
          />
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={getChipStyle()} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={getChipStyle()}>{content}</View>;
};
