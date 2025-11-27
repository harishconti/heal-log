import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import { useTheme } from '@/contexts/ThemeContext';
import { ControlledInput } from './ControlledInput';
import { Dropdown } from '@/components/core/Dropdown';

const feedbackSchema = z.object({
  feedback_type: z.enum(['bug', 'suggestion', 'general']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  steps_to_reproduce: z.string().optional(),
});

const feedbackTypes = [
  { label: 'Bug Report', value: 'bug' },
  { label: 'Suggestion', value: 'suggestion' },
  { label: 'General Feedback', value: 'general' },
];

const FeedbackForm = ({ onSubmit, isSubmitting }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [screenshot, setScreenshot] = useState(null);

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

  const handleFormSubmit = (data) => {
    const deviceInfo = {
      os_version: `${Device.osName} ${Device.osVersion}`,
      app_version: '1.0.0', // Replace with your actual app version
      device_model: Device.modelName,
    };

    const payload = {
      ...data,
      device_info: deviceInfo,
      screenshot: screenshot ? screenshot.base64 : null,
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

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  buttonText: {
    color: theme.colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  screenshotContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  screenshotPreview: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 8,
  },
});

export default FeedbackForm;
