import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import appJson from '@/app.json';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
  label: string;
  value?: string;
  onPress: () => void;
  theme: any;
  fontScale: number;
}

const SettingItem = ({
  icon,
  iconColor,
  iconBgColor,
  label,
  value,
  onPress,
  theme,
  fontScale,
}: SettingItemProps) => (
  <TouchableOpacity style={styles(theme, fontScale).settingItem} onPress={onPress}>
    <View style={styles(theme, fontScale).settingLeft}>
      <View style={[styles(theme, fontScale).iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles(theme, fontScale).settingLabel}>{label}</Text>
    </View>
    <View style={styles(theme, fontScale).settingRight}>
      {value && <Text style={styles(theme, fontScale).settingValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </View>
  </TouchableOpacity>
);

export default function AppSettingsScreen() {
  const { theme, fontScale } = useTheme();
  const { logout } = useAuth();
  const { settings } = useAppStore();
  const router = useRouter();
  const dynamicStyles = styles(theme, fontScale);

  const getThemeDisplayValue = (): string => {
    switch (settings.theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
      default:
        return 'System';
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

  const handleLanguagePress = () => {
    Alert.alert('Language', 'Language settings coming soon');
  };

  const handleThemePress = () => {
    router.push('/(tabs)/settings');
  };

  const handleNotificationsPress = () => {
    Alert.alert('Notifications', 'Notification settings coming soon');
  };

  const handlePrivacyPress = () => {
    Alert.alert('Privacy & Security', 'Privacy settings coming soon');
  };

  const handleHelpCenterPress = () => {
    router.push('/(tabs)/settings/known-issues');
  };

  const handleAboutPress = () => {
    Alert.alert(
      'About HEAL LOG',
      `Version ${appJson.expo.version}\n\nHEAL LOG is a comprehensive patient management app designed for healthcare professionals.\n\n© 2024 HEAL LOG`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>App Settings</Text>
      </View>

      <View style={dynamicStyles.headerDivider} />

      <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
        {/* App Preferences Section */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>App Preferences</Text>
          <Card style={dynamicStyles.sectionCard}>
            <SettingItem
              icon="globe-outline"
              iconColor="#1A8CFF"
              iconBgColor="#E8F4FF"
              label="Language"
              value="English"
              onPress={handleLanguagePress}
              theme={theme}
              fontScale={fontScale}
            />
            <View style={dynamicStyles.itemDivider} />
            <SettingItem
              icon="color-palette"
              iconColor="#9B59B6"
              iconBgColor="#F5E8FF"
              label="Theme"
              value={getThemeDisplayValue()}
              onPress={handleThemePress}
              theme={theme}
              fontScale={fontScale}
            />
          </Card>
        </View>

        {/* General Section */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>General</Text>
          <Card style={dynamicStyles.sectionCard}>
            <SettingItem
              icon="notifications"
              iconColor="#F5A623"
              iconBgColor="#FFF8E8"
              label="Notifications"
              onPress={handleNotificationsPress}
              theme={theme}
              fontScale={fontScale}
            />
            <View style={dynamicStyles.itemDivider} />
            <SettingItem
              icon="lock-closed"
              iconColor="#27AE60"
              iconBgColor="#E8F8F0"
              label="Privacy & Security"
              onPress={handlePrivacyPress}
              theme={theme}
              fontScale={fontScale}
            />
          </Card>
        </View>

        {/* Help & Support Section */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Help & Support</Text>
          <Card style={dynamicStyles.sectionCard}>
            <SettingItem
              icon="help-circle"
              iconColor="#1A8CFF"
              iconBgColor="#E8F4FF"
              label="Help Center"
              onPress={handleHelpCenterPress}
              theme={theme}
              fontScale={fontScale}
            />
            <View style={dynamicStyles.itemDivider} />
            <SettingItem
              icon="information-circle"
              iconColor="#E91E63"
              iconBgColor="#FCE8F0"
              label="About App"
              onPress={handleAboutPress}
              theme={theme}
              fontScale={fontScale}
            />
          </Card>
        </View>

        {/* Log Out Button */}
        <View style={dynamicStyles.logoutSection}>
          <TouchableOpacity style={dynamicStyles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
            <Text style={dynamicStyles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={dynamicStyles.versionText}>Version {appJson.expo.version}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (theme: any, fontScale: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  headerDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  content: {
    flex: 1,
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
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingLabel: {
    fontSize: 16 * fontScale,
    color: theme.colors.text,
    fontWeight: '400',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15 * fontScale,
    color: theme.colors.textSecondary,
  },
  itemDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 70,
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.surface,
    gap: 8,
  },
  logoutText: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    color: theme.colors.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14 * fontScale,
    color: theme.colors.textSecondary,
    marginTop: 24,
  },
});
