import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Control, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface ControlledInputProps extends TextInputProps {
  control: Control<any>;
  name: string;
  label?: string;
  error?: string;
  isPassword?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const ControlledInput: React.FC<ControlledInputProps> = ({
  control,
  name,
  label,
  error,
  isPassword = false,
  iconName,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
      color: theme.colors.text,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: theme.colors.background,
      borderColor: error ? theme.colors.error : theme.colors.border,
    },
    leftIcon: {
      paddingLeft: 12,
    },
    input: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    eyeButton: {
      padding: 12,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: 4,
    },
  });

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={styles.container}>
          {label && <Text style={styles.label}>{label}</Text>}
          <View style={styles.inputWrapper}>
            {iconName && (
              <Ionicons
                name={iconName}
                size={20}
                color={theme.colors.textSecondary}
                style={styles.leftIcon}
              />
            )}
            <TextInput
              style={styles.input}
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
                style={styles.eyeButton}
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
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
    />
  );
};