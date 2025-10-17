import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Control, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ControlledInputProps extends TextInputProps {
  control: Control<any>;
  name: string;
  label?: string;
  error?: string;
}

export const ControlledInput: React.FC<ControlledInputProps> = ({
  control,
  name,
  label,
  error,
  ...textInputProps
}) => {
  const { theme } = useTheme();

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
    input: {
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      borderWidth: 1,
      backgroundColor: theme.colors.background,
      borderColor: error ? theme.colors.error : theme.colors.border,
      color: theme.colors.text,
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
          <TextInput
            style={styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder={textInputProps.placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            {...textInputProps}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
    />
  );
};