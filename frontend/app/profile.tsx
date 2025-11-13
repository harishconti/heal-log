import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { useRouter } from 'expo-router';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface SubscriptionInfo {
  subscription_plan: string;
  subscription_status: string;
  trial_end_date: string;
}

interface Stats {
  total_patients: number;
  favorite_patients: number;
  groups: Array<{ _id: string; count: number }>;
}

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const { settings, updateSettings } = useAppStore(
    (state) => ({ settings: state.settings, updateSettings: state.updateSettings })
  );
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

  useEffect(() => {
    loadProfileData();
    loadUserPhoto();
  }, []);

  const loadProfileData = async () => {
    try {
      // Use Promise.allSettled for better error handling
      const [subscriptionResult, statsResult] = await Promise.allSettled([
        axios.get(`${BACKEND_URL}/api/subscription`),
        axios.get(`${BACKEND_URL}/api/stats`)
      ]);

      // Handle subscription data
      if (subscriptionResult.status === 'fulfilled') {
        setSubscriptionInfo(subscriptionResult.value.data.subscription);
      } else {
        console.error('Error loading subscription data:', subscriptionResult.reason);
        // Set default subscription info or show error state
        setSubscriptionInfo({
          subscription_plan: 'regular',
          subscription_status: 'unknown',
          trial_end_date: new Date().toISOString()
        });
      }

      // Handle stats data
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.data.stats);
      } else {
        console.error('Error loading stats data:', statsResult.reason);
        // Set default stats or show error state
        setStats({
          total_patients: 0,
          favorite_patients: 0,
          groups: []
        });
      }

      // Show error message if both failed
      if (subscriptionResult.status === 'rejected' && statsResult.status === 'rejected') {
        Alert.alert(
          'Connection Error',
          'Unable to load profile data. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Unexpected error loading profile data:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading profile data.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting logout process...');
              await logout();
              console.log('Logout completed, navigating to login...');
              
              // Use replace to completely reset navigation stack
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Logout Error', error.message || 'Failed to logout completely');
              
              // Force navigation even if logout partially failed
              router.replace('/login');
            }
          }
        }
      ]
    );
  };

  const updateProfilePhoto = async () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose how to update your profile photo',
      [
        { text: 'Camera', onPress: takeProfilePhoto },
        { text: 'Photo Library', onPress: pickProfilePhoto },
        userPhoto ? { text: 'Remove Photo', onPress: removeProfilePhoto, style: 'destructive' } : null,
        { text: 'Cancel', style: 'cancel' }
      ].filter(Boolean)
    );
  };

  const pickProfilePhoto = async () => {
    try {
      const { default: ImagePicker } = await import('expo-image-picker');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permissions are required to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets[0].base64) {
        await saveProfilePhoto(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takeProfilePhoto = async () => {
    try {
      const { default: ImagePicker } = await import('expo-image-picker');
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permissions are required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets[0].base64) {
        await saveProfilePhoto(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const saveProfilePhoto = async (photo: string) => {
    try {
      setUpdatingPhoto(true);
      setUserPhoto(photo);
      
      // Note: You would implement a backend endpoint to save user profile photo
      // For now, we'll just save it locally
      await AsyncStorage.setItem(`user_photo_${user?.id}`, photo);
      
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile photo');
      setUserPhoto(''); // Revert on error
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const removeProfilePhoto = async () => {
    try {
      setUpdatingPhoto(true);
      setUserPhoto('');
      
      await AsyncStorage.removeItem(`user_photo_${user?.id}`);
      
      Alert.alert('Success', 'Profile photo removed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove profile photo');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const loadUserPhoto = async () => {
    try {
      if (user?.id) {
        const savedPhoto = await AsyncStorage.getItem(`user_photo_${user.id}`);
        if (savedPhoto) {
          setUserPhoto(savedPhoto);
        }
      }
    } catch (error) {
      console.error('Error loading user photo:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#2ecc71';
      case 'trial': return '#f39c12';
      case 'inactive': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <TouchableOpacity 
            style={styles.userAvatarContainer} 
            onPress={updateProfilePhoto}
            disabled={updatingPhoto}
          >
            {userPhoto ? (
              <Image 
                source={{ uri: `data:image/jpeg;base64,${userPhoto}` }}
                style={styles.userAvatarImage}
              />
            ) : (
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={48} color="#2ecc71" />
              </View>
            )}
            <View style={styles.photoEditOverlay}>
              {updatingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.full_name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userSpecialty}>
            {user?.medical_specialty?.charAt(0).toUpperCase() + user?.medical_specialty?.slice(1)}
          </Text>
        </View>

        {/* Statistics */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={32} color="#2ecc71" />
                <Text style={styles.statNumber}>{stats.total_patients}</Text>
                <Text style={styles.statLabel}>Total Patients</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="heart" size={32} color="#e74c3c" />
                <Text style={styles.statNumber}>{stats.favorite_patients}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="folder" size={32} color="#3498db" />
                <Text style={styles.statNumber}>{stats.groups.length}</Text>
                <Text style={styles.statLabel}>Groups</Text>
              </View>
            </View>
          </View>
        )}

        {/* Subscription Info */}
        {subscriptionInfo && (
          <View style={styles.subscriptionSection}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Text style={styles.planName}>
                  {subscriptionInfo.subscription_plan.charAt(0).toUpperCase() +
                   subscriptionInfo.subscription_plan.slice(1)} Plan
                </Text>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(subscriptionInfo.subscription_status) }
                ]}>
                  <Text style={styles.statusText}>
                    {subscriptionInfo.subscription_status.charAt(0).toUpperCase() +
                     subscriptionInfo.subscription_status.slice(1)}
                  </Text>
                </View>
              </View>
              
              {subscriptionInfo.subscription_status === 'trial' && (
                <Text style={styles.trialInfo}>
                  Trial ends: {formatDate(subscriptionInfo.trial_end_date)}
                </Text>
              )}

              <View style={styles.planFeatures}>
                <Text style={styles.featureTitle}>Current Features:</Text>
                <View style={styles.feature}>
                  <Ionicons name="checkmark" size={16} color="#2ecc71" />
                  <Text style={styles.featureText}>Android App Access</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark" size={16} color="#2ecc71" />
                  <Text style={styles.featureText}>Patient Management</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark" size={16} color="#2ecc71" />
                  <Text style={styles.featureText}>Medical Notes</Text>
                </View>
                
                {subscriptionInfo.subscription_plan === 'regular' && (
                  <>
                    <View style={styles.feature}>
                      <Ionicons name="close" size={16} color="#e74c3c" />
                      <Text style={[styles.featureText, styles.disabledFeature]}>Web Dashboard</Text>
                    </View>
                    <View style={styles.feature}>
                      <Ionicons name="close" size={16} color="#e74c3c" />
                      <Text style={[styles.featureText, styles.disabledFeature]}>Advanced Analytics</Text>
                    </View>
                  </>
                )}
                
                {subscriptionInfo.subscription_plan === 'pro' && (
                  <>
                    <View style={styles.feature}>
                      <Ionicons name="checkmark" size={16} color="#2ecc71" />
                      <Text style={styles.featureText}>Web Dashboard</Text>
                    </View>
                    <View style={styles.feature}>
                      <Ionicons name="checkmark" size={16} color="#2ecc71" />
                      <Text style={styles.featureText}>Advanced Analytics</Text>
                    </View>
                    <View style={styles.feature}>
                      <Ionicons name="checkmark" size={16} color="#2ecc71" />
                      <Text style={styles.featureText}>Priority Support</Text>
                    </View>
                  </>
                )}
              </View>

              {subscriptionInfo.subscription_plan === 'regular' && (
                <TouchableOpacity 
                  style={styles.upgradeButton}
                  onPress={() => router.push('/upgrade')}
                >
                  <Ionicons name="rocket" size={20} color="#fff" />
                  <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Preferences Section */}
        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.preferenceItem}>
            <Ionicons name="pulse" size={24} color="#666" />
            <Text style={styles.actionText}>Enable Haptic Feedback</Text>
            <Switch
              value={settings.hapticEnabled}
              onValueChange={(value) => updateSettings({ hapticEnabled: value })}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={settings.hapticEnabled ? '#2ecc71' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/contacts-sync')}
          >
            <Ionicons name="phone-portrait" size={24} color="#666" />
            <Text style={styles.actionText}>Contacts Integration</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/settings/feedback')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#666" />
            <Text style={styles.actionText}>Send Feedback</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings" size={24} color="#666" />
            <Text style={styles.actionText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle" size={24} color="#666" />
            <Text style={styles.actionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text" size={24} color="#666" />
            <Text style={styles.actionText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/welcome')}
          >
            <Ionicons name="information-circle-outline" size={24} color="#666" />
            <Text style={styles.actionText}>View Beta Welcome Screen</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  userAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  userSpecialty: {
    fontSize: 14,
    color: '#2ecc71',
    fontWeight: '500',
  },
  statsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  subscriptionSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  subscriptionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  trialInfo: {
    fontSize: 14,
    color: '#f39c12',
    marginBottom: 16,
  },
  planFeatures: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  disabledFeature: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  upgradeButton: {
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  preferencesSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
});