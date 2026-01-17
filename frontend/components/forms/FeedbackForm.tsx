import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { ControlledInput } from './ControlledInput';
import { Dropdown } from '@/components/core/Dropdown';

const feedbackSchema = z.object({
  feedback_type: z.enum(['bug', 'suggestion', 'general']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  steps_to_reproduce: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackPayload extends FeedbackFormData {
  device_info: {
    os_version: string;
    app_version: string;
    device_model: string | null;
  };
  screenshot: string | null;
}

interface FeedbackFormProps {
  onSubmit: (data: FeedbackPayload) => void | Promise<void>;
  isSubmitting: boolean;
}

const feedbackTypes = [
  { label: 'Bug Report', value: 'bug' },
  { label: 'Suggestion', value: 'suggestion' },
  { label: 'General Feedback', value: 'general' },
];

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit, isSubmitting }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [screenshot, setScreenshot] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedback_type: 'general',
      description: '',
      steps_to_reproduce: '',
    },
  });

  const feedbackType = watch('feedback_type');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setScreenshot(result.assets[0]);
    }
  };

  const handleFormSubmit = (data: FeedbackFormData) => {
    const deviceInfo = {
      os_version: `${Device.osName} ${Device.osVersion}`,
      app_version: '1.0.0', // Replace with your actual app version
      device_model: Device.modelName,
    };

    const payload: FeedbackPayload = {
      ...data,
      device_info: deviceInfo,
      screenshot: screenshot?.base64 ?? null,
    };
    onSubmit(payload);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Feedback Type</Text>
      <Controller
        name="feedback_type"
        control={control}
        render={({ field: { onChange, value } }) => (
          <Dropdown
            options={feedbackTypes}
            selectedValue={value}
            onValueChange={onChange}
          />
        )}
      />

      <ControlledInput
        name="description"
        label="Description"
        control={control}
        placeholder="Tell us more about your feedback"
        multiline
        numberOfLines={4}
        error={errors.description}
      />

      {feedbackType === 'bug' && (
        <ControlledInput
          name="steps_to_reproduce"
          label="Steps to Reproduce (for bugs)"
          control={control}
          placeholder="e.g., 1. Go to '...' page..."
          multiline
          numberOfLines={3}
          error={errors.steps_to_reproduce}
        />
      )}

      <View style={styles.screenshotContainer}>
        <Button title="Attach Screenshot" onPress={pickImage} />
        {screenshot && <Image source={{ uri: screenshot.uri }} style={styles.screenshotPreview} />}
      </View>

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit(handleFormSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.buttonText} />
        ) : (
          <Text style={styles.buttonText}>Submit Feedback</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg - 4,
  },
  label: {
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: theme.spacing.lg - 4,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  buttonText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
  },
  screenshotContainer: {
    marginTop: theme.spacing.lg - 4,
    alignItems: 'center',
  },
  screenshotPreview: {
    width: 100,
    height: 100,
    marginTop: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.sm,
  },
});

export default FeedbackForm;
