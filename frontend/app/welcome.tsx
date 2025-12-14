
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('has_seen_beta_welcome', 'true');
      router.replace('/');
    } catch (error) {
      console.error('Failed to save to async storage', error);
      // Still navigate the user away
      router.replace('/');
    }
  };

  const navigateToKnownIssues = () => {
    router.push('/(tabs)/settings/known-issues');
  };

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.title}>Welcome to the Beta!</Text>
          <Text style={styles.subtitle}>
            Thank you for helping us test and improve PatientLog.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featureItem}>
            <Ionicons name="cloud-offline-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>Offline-first patient management</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="sync-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>Secure data synchronization</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="contrast-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>Dark mode support</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>Clinical notes tracking</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Known Issues</Text>
          <Text style={styles.paragraph}>
            As a beta, you might encounter some bugs. We are actively working to fix them.
            You can see a list of known issues here:
          </Text>
          <TouchableOpacity onPress={navigateToKnownIssues}>
            <Text style={styles.link}>View Known Issues</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback</Text>
          <Text style={styles.paragraph}>
            Your feedback is invaluable. Please report any issues or suggestions via the
            'Feedback' option in the app's settings menu.
          </Text>
        </View>

        <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureText: {
      fontSize: 16,
      color: theme.colors.text,
      marginLeft: 12,
      flex: 1,
    },
    paragraph: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    link: {
      fontSize: 16,
      color: theme.colors.primary,
      textDecorationLine: 'underline',
      marginTop: 8,
    },
    getStartedButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    getStartedButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
  });
