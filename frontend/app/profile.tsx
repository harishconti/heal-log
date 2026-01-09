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
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { database } from '@/models/database';
import Patient from '@/models/Patient';
import api from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';

interface SubscriptionInfo {
  plan: string;
  subscription_status: string;
  subscription_end_date: string;
}

interface Stats {
  total_patients: number;
  favorite_patients: number;
  groups: Array<{ _id: string; count: number }>;
}

export default function ProfileScreen() {
  const { theme, fontScale } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const { settings } = useAppStore(
    (state) => ({ settings: state.settings })
  );
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

  const styles = createStyles(theme, fontScale);

  useEffect(() => {
    loadProfileData();
    loadUserPhoto();
  }, [user?.profile_photo]);

  const loadProfileData = async () => {
    try {
      if (user) {
        setSubscriptionInfo({
          plan: user.plan || 'basic',
          subscription_status: user.subscription_status || 'trialing',
          subscription_end_date: user.subscription_end_date || new Date().toISOString()
        });
      }

      try {
        const patientCollection = database.collections.get<Patient>('patients');
        const { Q } = await import('@nozbe/watermelondb');

        const totalCount = await patientCollection.query().fetchCount();
        const favoriteCount = await patientCollection.query(
          Q.where('is_favorite', true)
        ).fetchCount();

        const allPatients = await patientCollection.query().fetch();
        const groupCounts = new Map<string, number>();
        for (const patient of allPatients) {
          if (patient.group) {
            groupCounts.set(patient.group, (groupCounts.get(patient.group) || 0) + 1);
          }
        }
        const groupsWithCount = Array.from(groupCounts.entries()).map(([group, count]) => ({
          _id: group,
          count
        }));

        setStats({
          total_patients: totalCount,
          favorite_patients: favoriteCount,
          groups: groupsWithCount
        });
      } catch (error) {
        console.error('Error loading stats from local DB:', error);
        setStats({
          total_patients: 0,
          favorite_patients: 0,
          groups: []
        });
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
              await logout();
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Logout Error', error.message || 'Failed to logout completely');
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
      const ImagePicker = await import('expo-image-picker');

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
      console.error('Error picking profile photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to pick image: ${errorMessage}`);
    }
  };

  const takeProfilePhoto = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');

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
      console.error('Error taking profile photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to take photo: ${errorMessage}`);
    }
  };

  const saveProfilePhoto = async (photo: string) => {
    const previousPhoto = userPhoto;
    try {
      setUpdatingPhoto(true);
      setUserPhoto(photo);

      const response = await api.put('/api/users/me', {
        profile_photo: photo
      });

      if (response.data) {
        refreshUser();
      }

      await AsyncStorage.setItem(`user_photo_${user?.id}`, photo);

      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      console.error('Error saving profile photo:', error);
      Alert.alert('Error', 'Failed to save profile photo. Please try again.');
      setUserPhoto(previousPhoto);
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const removeProfilePhoto = async () => {
    const previousPhoto = userPhoto;
    try {
      setUpdatingPhoto(true);
      setUserPhoto('');

      await api.put('/api/users/me', {
        profile_photo: null
      });

      refreshUser();

      await AsyncStorage.removeItem(`user_photo_${user?.id}`);

      Alert.alert('Success', 'Profile photo removed successfully!');
    } catch (error) {
      console.error('Error removing profile photo:', error);
      Alert.alert('Error', 'Failed to remove profile photo');
      setUserPhoto(previousPhoto);
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const loadUserPhoto = async () => {
    try {
      if (user?.id) {
        if (user.profile_photo) {
          setUserPhoto(user.profile_photo);
          await AsyncStorage.setItem(`user_photo_${user.id}`, user.profile_photo);
          return;
        }

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

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'trialing': return 'warning';
      case 'canceled': return 'error';
      case 'past_due': return 'warning';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={updateProfilePhoto}
            disabled={updatingPhoto}
          >
            {userPhoto ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${userPhoto}` }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={theme.colors.textSecondary} />
              </View>
            )}
            <View style={styles.cameraOverlay}>
              {updatingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.full_name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.chipRow}>
            {user?.medical_specialty && (
              <Chip
                label={user.medical_specialty.charAt(0).toUpperCase() + user.medical_specialty.slice(1)}
                variant="soft"
                color="primary"
                size="small"
              />
            )}
            {subscriptionInfo && (
              <Chip
                label={subscriptionInfo.plan.charAt(0).toUpperCase() + subscriptionInfo.plan.slice(1) + ' Plan'}
                variant="outlined"
                color="default"
                size="small"
              />
            )}
          </View>
        </View>

        {/* Statistics Card */}
        {stats && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="stats-chart-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Statistics</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primaryMuted }]}>
                  <Ionicons name="people" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.statNumber}>{stats.total_patients}</Text>
                <Text style={styles.statLabel}>Patients</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                  <Ionicons name="heart" size={24} color={theme.colors.error} />
                </View>
                <Text style={styles.statNumber}>{stats.favorite_patients}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                  <Ionicons name="folder" size={24} color={theme.colors.success} />
                </View>
                <Text style={styles.statNumber}>{stats.groups.length}</Text>
                <Text style={styles.statLabel}>Groups</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Subscription Card */}
        {subscriptionInfo && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="card-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Subscription</Text>
            </View>

            <View style={styles.subscriptionInfo}>
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionPlan}>
                  {subscriptionInfo.plan.charAt(0).toUpperCase() + subscriptionInfo.plan.slice(1)} Plan
                </Text>
                <Chip
                  label={subscriptionInfo.subscription_status.charAt(0).toUpperCase() + subscriptionInfo.subscription_status.slice(1)}
                  variant="filled"
                  color={getStatusColor(subscriptionInfo.subscription_status)}
                  size="small"
                />
              </View>

              {subscriptionInfo.subscription_status === 'trialing' && (
                <Text style={styles.trialText}>
                  Trial ends: {formatDate(subscriptionInfo.subscription_end_date)}
                </Text>
              )}

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                  <Text style={styles.featureText}>Android App Access</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                  <Text style={styles.featureText}>Patient Management</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                  <Text style={styles.featureText}>Medical Notes</Text>
                </View>

                {subscriptionInfo.plan === 'basic' && (
                  <>
                    <View style={styles.featureItem}>
                      <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
                      <Text style={[styles.featureText, styles.featureDisabled]}>Web Dashboard</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
                      <Text style={[styles.featureText, styles.featureDisabled]}>Advanced Analytics</Text>
                    </View>
                  </>
                )}

                {subscriptionInfo.plan === 'pro' && (
                  <>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                      <Text style={styles.featureText}>Web Dashboard</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                      <Text style={styles.featureText}>Advanced Analytics</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                      <Text style={styles.featureText}>Priority Support</Text>
                    </View>
                  </>
                )}
              </View>

              {subscriptionInfo.plan === 'basic' && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => router.push('/upgrade')}
                >
                  <Ionicons name="rocket" size={18} color="#fff" />
                  <Text style={styles.upgradeText}>Upgrade to Pro</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}

        {/* Quick Actions Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="apps-outline" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/contacts-sync')}>
            <View style={styles.actionLeft}>
              <Ionicons name="phone-portrait-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.actionText}>Contacts Integration</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(tabs)/settings/feedback')}>
            <View style={styles.actionLeft}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.actionText}>Send Feedback</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(tabs)/settings')}>
            <View style={styles.actionLeft}>
              <Ionicons name="settings-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.actionText}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Ionicons name="help-circle-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.actionText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, styles.actionRowLast]}>
            <View style={styles.actionLeft}>
              <Ionicons name="document-text-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.actionText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* App Version */}
        <Text style={styles.versionText}>HEAL LOG v1.0.9</Text>
      </ScrollView>
    </SafeAreaView>
  );
}


const createStyles = (theme: any, fontScale: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16 * fontScale,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    padding: 8,
    minWidth: 70,
  },
  headerTitle: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
  },
  logoutText: {
    fontSize: 16 * fontScale,
    color: theme.colors.error,
    fontWeight: '500',
    textAlign: 'right',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  userName: {
    fontSize: 24 * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14 * fontScale,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24 * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12 * fontScale,
    color: theme.colors.textSecondary,
  },
  subscriptionInfo: {
    gap: 12,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionPlan: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
  },
  trialText: {
    fontSize: 14 * fontScale,
    color: theme.colors.warning,
  },
  featuresList: {
    gap: 8,
    paddingTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14 * fontScale,
    color: theme.colors.text,
  },
  featureDisabled: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  upgradeText: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 16 * fontScale,
    color: theme.colors.text,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12 * fontScale,
    color: theme.colors.textSecondary,
    marginTop: 24,
  },
});
