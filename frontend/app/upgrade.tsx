import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/contexts/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const ProFeatures = [
  {
    icon: 'analytics' as const,
    title: 'Advanced Analytics',
    description: 'Gain deeper insights with comprehensive patient and practice data.',
  },
  {
    icon: 'cloud-upload' as const,
    title: 'Document Storage',
    description: 'Securely upload and manage patient documents like lab reports.',
  },
  {
    icon: 'desktop' as const,
    title: 'Web Dashboard',
    description: 'Access a powerful desktop-optimized dashboard for management.',
  },
  {
    icon: 'headset' as const,
    title: 'Priority Support',
    description: 'Get faster, dedicated support from our team.',
  },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/payments/create-checkout-session`);
      const { checkout_url } = response.data;

      if (checkout_url) {
        const result = await WebBrowser.openBrowserAsync(checkout_url);
        if (result.type === 'cancel' || result.type === 'dismiss') {
          Alert.alert(
            'Checking Status...',
            'We are checking your subscription status. This may take a moment.'
          );
        }
        // After the browser is closed, refresh user data to get new subscription status
        await refreshUser();
        router.replace('/profile');
      } else {
        throw new Error('Could not get checkout URL.');
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      Alert.alert('Upgrade Failed', 'Could not initiate the upgrade process. Please try again later.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upgrade to Pro</Text>
        </View>

        <View style={styles.pitch}>
          <Ionicons name="rocket" size={48} color="#2ecc71" />
          <Text style={styles.pitchTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.pitchSubtitle}>
            Supercharge your practice with our Pro features, designed for professionals who need more power and flexibility.
          </Text>
        </View>

        <View style={styles.featuresList}>
          {ProFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name={feature.icon} size={24} color="#2ecc71" style={styles.featureIcon} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.upgradeButton, isUpgrading && styles.upgradeButtonDisabled]}
          onPress={handleUpgrade}
          disabled={isUpgrading}
        >
          {isUpgrading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.upgradeButtonText}>Upgrade Now for $9.99/month</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          You can cancel your subscription at any time.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  pitch: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
  },
  pitchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  pitchSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  featuresList: {
    padding: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  featureIcon: {
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  upgradeButton: {
    backgroundColor: '#2ecc71',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  upgradeButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});