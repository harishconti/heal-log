import React, { useState, useMemo } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
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
    borderRadius: 8,
    borderWidth: 1,
  },
  leftIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

// Dynamic style creator for theme-dependent styles
const createDynamicStyles = (theme: Theme, hasError: boolean) => ({
  label: {
    color: theme.colors.text,
  } as TextStyle,
  inputWrapper: {
    backgroundColor: theme.colors.background,
    borderColor: hasError ? theme.colors.error : theme.colors.border,
  } as ViewStyle,
  input: {
    color: theme.colors.text,
  } as TextStyle,
  errorText: {
    color: theme.colors.error,
  } as TextStyle,
});

export const ControlledInput = <T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  error,
  isPassword = false,
  iconName,
  ...textInputProps
}: ControlledInputProps<T>) => {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  // Memoize dynamic styles to avoid unnecessary recalculations
  const dynamicStyles = useMemo(
    () => createDynamicStyles(theme, !!error),
    [theme, !!error]
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={baseStyles.container}>
          {label && <Text style={[baseStyles.label, dynamicStyles.label]}>{label}</Text>}
          <View style={[baseStyles.inputWrapper, dynamicStyles.inputWrapper]}>
            {iconName && (
              <Ionicons
                name={iconName}
                size={20}
                color={theme.colors.textSecondary}
                style={baseStyles.leftIcon}
              />
            )}
            <TextInput
              style={[baseStyles.input, dynamicStyles.input]}
              onBlur={onBlur}
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
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
          {error && <Text style={[baseStyles.errorText, dynamicStyles.errorText]}>{error}</Text>}
        </View>
      )}
    />
  );
};