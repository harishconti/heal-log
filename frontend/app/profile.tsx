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
  Switch,
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
import { triggerBackgroundSync } from '@/services/backgroundSync';
import { Card } from '@/components/ui/Card';

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
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const [walkInsAvailable, setWalkInsAvailable] = useState(true);

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
      await triggerBackgroundSync();
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
      await triggerBackgroundSync();
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

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const formatPatientCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}k+`;
    }
    return count.toString();
  };

  const formatNextPaymentDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => {}} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header with Avatar */}
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
                <Ionicons name="person" size={56} color={theme.colors.textSecondary} />
              </View>
            )}
            <View style={styles.cameraOverlay}>
              {updatingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          <Text style={styles.userSpecialty}>
            {user?.medical_specialty
              ? user.medical_specialty.charAt(0).toUpperCase() + user.medical_specialty.slice(1) + ' Specialist'
              : 'Medical Professional'}
          </Text>

          {/* Statistics Card */}
          <Card style={styles.statsCard}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>YEARS EXP.</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{formatPatientCount(stats?.total_patients || 0)}</Text>
                <Text style={styles.statLabel}>PATIENTS</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Subscription Plan Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Plan</Text>
          <Card style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionLeft}>
                <View style={styles.planIconContainer}>
                  <Ionicons name="star" size={20} color="#F5A623" />
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.currentPlanLabel}>Current Plan</Text>
                  <Text style={styles.planName}>
                    {subscriptionInfo?.plan.charAt(0).toUpperCase() + subscriptionInfo?.plan.slice(1)} Plan
                  </Text>
                  <Text style={styles.billingInfo}>
                    Billed annually • Next payment {formatNextPaymentDate(subscriptionInfo?.subscription_end_date || '')}
                  </Text>
                </View>
              </View>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            </View>
            <View style={styles.subscriptionFooter}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>Unlimited Patients</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/upgrade')}>
                <Text style={styles.manageLink}>Manage</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Contact Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Card style={styles.contactCard}>
            <View style={styles.contactItem}>
              <View style={[styles.contactIconContainer, { backgroundColor: '#E8F4FF' }]}>
                <Ionicons name="mail" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{user?.email || 'Not set'}</Text>
              </View>
            </View>
          </Card>
          <Card style={styles.contactCard}>
            <View style={styles.contactItem}>
              <View style={[styles.contactIconContainer, { backgroundColor: '#E8F8F0' }]}>
                <Ionicons name="call" size={20} color={theme.colors.success} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{user?.phone || '+1 (555) 012-3456'}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Practice Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Practice Details</Text>
          <Card style={styles.practiceCard}>
            <View style={styles.practiceHeader}>
              <View style={[styles.contactIconContainer, { backgroundColor: '#FFF0E8' }]}>
                <Ionicons name="location" size={20} color="#FF6B35" />
              </View>
              <View style={styles.practiceInfo}>
                <Text style={styles.practiceLabel}>Main Clinic</Text>
                <Text style={styles.practiceName}>{user?.clinic_name || 'City Heart Center'}</Text>
                <Text style={styles.practiceAddress}>
                  {user?.clinic_address || '4501 Medical Center Dr,\nSuite 300, San Francisco, CA 94112'}
                </Text>
              </View>
            </View>
            <View style={styles.practiceDivider} />
            <View style={styles.walkInsRow}>
              <Text style={styles.walkInsLabel}>Available for Walk-ins</Text>
              <Switch
                value={walkInsAvailable}
                onValueChange={setWalkInsAvailable}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </Card>
        </View>

        {/* Account & Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Settings</Text>
          <Card style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsItem} onPress={() => router.push('/notifications')}>
              <View style={styles.settingsItemLeft}>
                <Ionicons name="notifications" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.settingsItemText}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsItemDivider} />
            <TouchableOpacity style={styles.settingsItem} onPress={() => router.push('/privacy')}>
              <View style={styles.settingsItemLeft}>
                <Ionicons name="lock-closed" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.settingsItemText}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingsItemDivider} />
            <TouchableOpacity style={styles.settingsItem} onPress={handleLogout}>
              <View style={styles.settingsItemLeft}>
                <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
                <Text style={[styles.settingsItemText, { color: theme.colors.error }]}>Log Out</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: 24 * fontScale,
    fontWeight: '700',
    color: theme.colors.text,
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 16 * fontScale,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  headerDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 0,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.surface,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.border,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  userName: {
    fontSize: 26 * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  userSpecialty: {
    fontSize: 15 * fontScale,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  statsCard: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
  },
  statNumber: {
    fontSize: 28 * fontScale,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11 * fontScale,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18 * fontScale,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  subscriptionCard: {
    padding: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subscriptionLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  planIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  currentPlanLabel: {
    fontSize: 12 * fontScale,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  planName: {
    fontSize: 17 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  billingInfo: {
    fontSize: 13 * fontScale,
    color: theme.colors.textSecondary,
  },
  activeBadge: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11 * fontScale,
    fontWeight: '700',
    color: theme.colors.success,
    letterSpacing: 0.3,
  },
  subscriptionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14 * fontScale,
    color: theme.colors.textSecondary,
  },
  manageLink: {
    fontSize: 15 * fontScale,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  contactCard: {
    padding: 16,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12 * fontScale,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15 * fontScale,
    fontWeight: '500',
    color: theme.colors.text,
  },
  practiceCard: {
    padding: 16,
  },
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  practiceInfo: {
    flex: 1,
  },
  practiceLabel: {
    fontSize: 12 * fontScale,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  practiceName: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  practiceAddress: {
    fontSize: 14 * fontScale,
    color: theme.colors.textSecondary,
    lineHeight: 20 * fontScale,
  },
  practiceDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  walkInsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walkInsLabel: {
    fontSize: 15 * fontScale,
    color: theme.colors.text,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingsItemText: {
    fontSize: 16 * fontScale,
    fontWeight: '500',
    color: theme.colors.text,
  },
  settingsItemDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 52,
  },
});
