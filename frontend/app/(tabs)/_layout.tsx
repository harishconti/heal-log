import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/useAppStore';

export default function TabsLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { settings } = useAppStore();
  const router = useRouter();

  const triggerHaptic = () => {
    if (settings.hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : 0),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
      screenListeners={{
        tabPress: () => {
          triggerHaptic();
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: theme.colors.primaryMuted },
              ]}
              accessibilityLabel="Home tab"
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
            >
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
          tabBarAccessibilityLabel: 'Home tab - Patient list',
        }}
      />
      <Tabs.Screen
        name="settings"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            triggerHaptic();
            router.push('/settings');
          },
        }}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: theme.colors.primaryMuted },
              ]}
              accessibilityLabel="Settings tab"
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
            >
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
          tabBarAccessibilityLabel: 'Settings tab - App preferences',
        }}
      />
      <Tabs.Screen
        name="pro"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            triggerHaptic();
            router.push('/upgrade');
          },
        }}
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={[
                styles.proIconContainer,
                { backgroundColor: focused ? theme.colors.primary : theme.colors.primaryMuted },
              ]}
              accessibilityLabel="Pro tab"
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
            >
              <Ionicons
                name="diamond"
                size={20}
                color={focused ? '#fff' : theme.colors.primary}
              />
            </View>
          ),
          tabBarAccessibilityLabel: 'Pro tab - Subscription and plans',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
