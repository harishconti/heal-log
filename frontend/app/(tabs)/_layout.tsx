import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/useAppStore';

export default function TabsLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { settings } = useAppStore();

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
          title: 'Patients',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: theme.colors.primaryMuted },
              ]}
              accessibilityLabel="Patients tab"
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
            >
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
          tabBarAccessibilityLabel: 'Patients tab - View and manage patient records',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: theme.colors.primaryMuted },
              ]}
              accessibilityLabel="Analytics tab"
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
            >
              <Ionicons
                name={focused ? 'analytics' : 'analytics-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
          tabBarAccessibilityLabel: 'Analytics tab - View statistics and reports',
        }}
      />
      <Tabs.Screen
        name="settings"
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
          tabBarAccessibilityLabel: 'Settings tab - App preferences and configuration',
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
});
