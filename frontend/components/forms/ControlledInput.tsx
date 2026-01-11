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
import { getPasswordStrength } from '@/lib/validation';

interface ControlledInputProps<T extends FieldValues = FieldValues> extends TextInputProps {
  control: Control<T>;
  name: string;
  label?: string;
  error?: string;
  isPassword?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  // New props for improved UX
  showCharacterCount?: boolean;
  maxCharacters?: number;
  showPasswordStrength?: boolean;
}

// Base styles that don't depend on theme
const baseStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  characterCount: {
    fontSize: 12,
    fontWeight: '400',
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
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
  // Password strength styles
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 50,
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
  showCharacterCount = false,
  maxCharacters,
  showPasswordStrength = false,
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
      render={({ field: { onChange, onBlur, value } }) => {
        const currentLength = value?.length || 0;
        const passwordStrength = showPasswordStrength && isPassword && value
          ? getPasswordStrength(value)
          : null;

        return (
          <View style={baseStyles.container}>
            {/* Label with character count */}
            <View style={baseStyles.labelRow}>
              {label && (
                <Text
                  style={[baseStyles.label, dynamicStyles.label]}
                  accessibilityRole="text"
                >
                  {label}
                </Text>
              )}
              {showCharacterCount && maxCharacters && (
                <Text
                  style={[
                    baseStyles.characterCount,
                    {
                      color: currentLength > maxCharacters
                        ? theme.colors.error
                        : theme.colors.textSecondary
                    }
                  ]}
                  accessibilityLabel={`${currentLength} of ${maxCharacters} characters`}
                >
                  {currentLength}/{maxCharacters}
                </Text>
              )}
            </View>

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
                accessibilityLabel={label}
                accessibilityHint={helperText}
                accessibilityState={{ disabled: textInputProps.editable === false }}
                {...textInputProps}
              />
              {isPassword && (
                <TouchableOpacity
                  style={baseStyles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Password strength indicator */}
            {passwordStrength && value && (
              <View style={baseStyles.strengthContainer}>
                <View style={baseStyles.strengthBar}>
                  <View
                    style={[
                      baseStyles.strengthFill,
                      {
                        width: `${(passwordStrength.score / 6) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      }
                    ]}
                  />
                </View>
                <Text
                  style={[baseStyles.strengthText, { color: passwordStrength.color }]}
                  accessibilityLabel={`Password strength: ${passwordStrength.label}`}
                >
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            {/* Error message */}
            {error && (
              <View style={baseStyles.errorContainer} accessibilityRole="alert">
                <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
                <Text style={[baseStyles.errorText, dynamicStyles.errorText]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Helper text */}
            {helperText && !error && (
              <Text style={[baseStyles.helperText, dynamicStyles.helperText]}>
                {helperText}
              </Text>
            )}
          </View>
        );
      }}
    />
  );
};
