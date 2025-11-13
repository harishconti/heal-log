import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import FeedbackForm from '@/components/forms/FeedbackForm';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import Toast from 'react-native-toast-message';

const FeedbackScreen = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await api.post('/feedback/submit', data);
      Toast.show({
        type: 'success',
        text1: 'Feedback Submitted',
        text2: 'Thank you for your feedback!',
      });
      router.back();
    } catch (error) {
        console.log(error)
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

const createStyles = (theme) => StyleSheet.create({
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
