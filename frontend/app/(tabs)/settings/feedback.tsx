import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import FeedbackForm from '@/components/forms/FeedbackForm';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import api from '@/services/api';
import Toast from 'react-native-toast-message';

interface FeedbackData {
  feedback_type: 'bug' | 'suggestion' | 'general';
  description: string;
  steps_to_reproduce?: string;
  device_info: {
    os_version: string;
    app_version: string;
    device_model: string | null;
  };
  screenshot: string | null;
}

const FeedbackScreen = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: FeedbackData) => {
    setIsSubmitting(true);
    try {
      await api.post('/api/feedback/submit', data);
      Toast.show({
        type: 'success',
        text1: 'Feedback Submitted',
        text2: 'Thank you for your feedback!',
      });
      router.back();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Could not submit feedback. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit Feedback</Text>
      <FeedbackForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
  },
});

export default FeedbackScreen;
