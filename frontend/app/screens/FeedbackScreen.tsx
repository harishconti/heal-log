import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { submitFeedback } from '@/services/api';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import Dropdown from '@/components/core/Dropdown';
import Toast, { ToastHandles } from '@/components/core/Toast';
import { useRef } from 'react';

// This would typically be in a shared validation schema file
const feedbackSchema = z.object({
  feedbackType: z.enum(['bug', 'feature', 'other']),
  description: z.string().min(10, 'Please provide at least 10 characters.'),
  email: z.string().email('Please enter a valid email address.').optional().or(z.literal('')),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

const FeedbackScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const toastRef = useRef<ToastHandles>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedbackType: 'bug',
      description: '',
      email: '',
    },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      await submitFeedback(data);
      toastRef.current?.show('Feedback submitted successfully!', 'success');
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      toastRef.current?.show('Failed to submit feedback.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submit Feedback</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Feedback Type</Text>
          <Controller
            control={control}
            name="feedbackType"
            render={({ field: { onChange, value } }) => (
              <Dropdown
                options={[
                  { label: 'Bug Report', value: 'bug' },
                  { label: 'Feature Request', value: 'feature' },
                  { label: 'Other', value: 'other' },
                ]}
                selectedValue={value}
                onValueChange={onChange}
              />
            )}
          />

          <Text style={styles.label}>Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Please describe the issue or your suggestion..."
                multiline
                numberOfLines={6}
                placeholderTextColor={theme.colors.textSecondary}
              />
            )}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}

          <Text style={styles.label}>Email (Optional)</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.colors.textSecondary}
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast ref={toastRef} />
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    backButton: {
        padding: 8,
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text,
    },
    formContainer: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 16,
        color: theme.colors.text,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    pickerOption: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    pickerOptionSelected: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.primary,
    },
    pickerOptionText: {
        color: theme.colors.text,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
    },
    submitButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        backgroundColor: theme.colors.primary,
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default FeedbackScreen;
