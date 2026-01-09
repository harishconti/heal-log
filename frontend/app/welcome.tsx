import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme, fontScale } = useTheme();

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('has_seen_beta_welcome', 'true');
      router.replace('/');
    } catch (error) {
      console.error('Failed to save to async storage', error);
      router.replace('/');
    }
  };

  const navigateToKnownIssues = () => {
    router.push('/(tabs)/settings/known-issues');
  };

  const styles = getStyles(theme, fontScale);

  const features = [
    {
      icon: 'cloud-offline-outline' as keyof typeof Ionicons.glyphMap,
      title: 'Offline-First',
      description: 'Access patient data anytime, even without internet',
    },
    {
      icon: 'sync-circle-outline' as keyof typeof Ionicons.glyphMap,
      title: 'Secure Sync',
      description: 'Your data is encrypted and synced safely',
    },
    {
      icon: 'moon-outline' as keyof typeof Ionicons.glyphMap,
      title: 'Dark Mode',
      description: 'Easy on your eyes during night shifts',
    },
    {
      icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
      title: 'Clinical Notes',
      description: 'Track patient progress with detailed notes',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
            />
          </View>
          <Text style={styles.title}>Welcome to HealLog Beta</Text>
          <Text style={styles.subtitle}>
            Thank you for helping us test and improve the app
          </Text>
        </View>

        {/* Key Features */}
        <Card style={styles.featureCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Key Features</Text>
          </View>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon} size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Known Issues Section */}
        <Card style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={20} color={theme.colors.warning} />
            <Text style={styles.sectionTitle}>Beta Notice</Text>
          </View>
          <Text style={styles.infoText}>
            As a beta version, you might encounter some bugs. We're actively working to fix them.
          </Text>
          <TouchableOpacity onPress={navigateToKnownIssues} style={styles.linkButton}>
            <Text style={styles.linkText}>View Known Issues</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* Feedback Section */}
        <Card style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.success} />
            <Text style={styles.sectionTitle}>Your Feedback Matters</Text>
          </View>
          <Text style={styles.infoText}>
            Help us make HealLog better! Report any issues or suggestions through the Feedback option in Settings.
          </Text>
        </Card>

        {/* Get Started Button */}
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          icon="arrow-forward"
          iconPosition="right"
          size="large"
          style={styles.getStartedButton}
        />

        {/* HIPAA Compliance Badge */}
        <View style={styles.complianceBadge}>
          <Ionicons name="shield-checkmark" size={16} color={theme.colors.success} />
          <Text style={styles.complianceText}>HIPAA Compliant & Secure</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, fontScale: number) =>
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
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    logo: {
      width: 64,
      height: 64,
    },
    title: {
      fontSize: 26 * fontScale,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16 * fontScale,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24 * fontScale,
    },
    featureCard: {
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18 * fontScale,
      fontWeight: '600',
      color: theme.colors.text,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
      gap: 12,
    },
    featureIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.primaryMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16 * fontScale,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    featureDescription: {
      fontSize: 14 * fontScale,
      color: theme.colors.textSecondary,
      lineHeight: 20 * fontScale,
    },
    infoCard: {
      marginBottom: 16,
    },
    infoText: {
      fontSize: 14 * fontScale,
      color: theme.colors.textSecondary,
      lineHeight: 22 * fontScale,
      marginBottom: 12,
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    linkText: {
      fontSize: 14 * fontScale,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    getStartedButton: {
      marginTop: 8,
      marginBottom: 24,
    },
    complianceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      alignSelf: 'center',
    },
    complianceText: {
      fontSize: 12 * fontScale,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
  });
