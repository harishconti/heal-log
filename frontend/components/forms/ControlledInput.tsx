import React, { useState, useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Platform
} from 'react-native';
import { Control, Controller, FieldValues } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/contexts/ThemeContext';

interface ControlledInputProps<T extends FieldValues = FieldValues> extends TextInputProps {
  control: Control<T>;
  name: string;
  label?: string;
  error?: string;
  isPassword?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
}

// Base styles that don't depend on theme
const baseStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  leftIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeButton: {
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
});

// Dynamic style creator for theme-dependent styles
const createDynamicStyles = (theme: Theme, hasError: boolean, isFocused: boolean, size: string) => {
  const heightMap = {
    small: 44,
    medium: 52,
    large: 60,
  };

  return {
    label: {
      color: theme.colors.text,
    } as TextStyle,
    inputWrapper: {
      backgroundColor: theme.colors.surface,
      borderColor: hasError
        ? theme.colors.error
        : isFocused
          ? theme.colors.primary
          : theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      minHeight: heightMap[size as keyof typeof heightMap] || 52,
      ...Platform.select({
        ios: {
          shadowColor: isFocused ? theme.colors.primary : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isFocused ? 0.1 : 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: isFocused ? 3 : 1,
        },
      }),
    } as ViewStyle,
    input: {
      color: theme.colors.text,
    } as TextStyle,
    errorText: {
      color: theme.colors.error,
    } as TextStyle,
    helperText: {
      color: theme.colors.textSecondary,
    } as TextStyle,
    iconColor: hasError
      ? theme.colors.error
      : isFocused
        ? theme.colors.primary
        : theme.colors.textSecondary,
  };
};

export const ControlledInput = <T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  error,
  isPassword = false,
  iconName,
  helperText,
  size = 'medium',
  ...textInputProps
}: ControlledInputProps<T>) => {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Memoize dynamic styles to avoid unnecessary recalculations
  const dynamicStyles = useMemo(
    () => createDynamicStyles(theme, !!error, isFocused, size),
    [theme, !!error, isFocused, size]
  );

  const paddingVertical = size === 'small' ? 10 : size === 'large' ? 18 : 14;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={baseStyles.container}>
          {label && (
            <Text style={[baseStyles.label, dynamicStyles.label]}>
              {label}
            </Text>
          )}
          <View style={[baseStyles.inputWrapper, dynamicStyles.inputWrapper]}>
            {iconName && (
              <Ionicons
                name={iconName}
                size={20}
                color={dynamicStyles.iconColor}
                style={baseStyles.leftIcon}
              />
            )}
            <TextInput
              style={[
                baseStyles.input,
                dynamicStyles.input,
                { paddingVertical },
                !iconName && { paddingLeft: 16 },
              ]}
              onBlur={() => {
                setIsFocused(false);
                onBlur();
              }}
              onFocus={() => setIsFocused(true)}
              onChangeText={onChange}
              value={value}
              placeholder={textInputProps.placeholder}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry={isPassword && !showPassword}
              {...textInputProps}
            />
            {isPassword && (
              <TouchableOpacity
                style={baseStyles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
          {error && (
            <Text style={[baseStyles.errorText, dynamicStyles.errorText]}>
              {error}
            </Text>
          )}
          {helperText && !error && (
            <Text style={[baseStyles.helperText, dynamicStyles.helperText]}>
              {helperText}
            </Text>
          )}
        </View>
      )}
    />
  );
};
