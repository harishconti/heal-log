import { Stack, useRouter, usePathname } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useInitializeTheme, useTheme } from '@/contexts/ThemeContext';
import { ActivityIndicator, View, StatusBar, Platform } from 'react-native';
import AppInitializer from '@/contexts/AppInitializer';
import { initMonitoring, ErrorBoundary } from '@/utils/monitoring';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";
import { trackOfflineOnlineTime } from '@/services/analytics';
import { NetworkProvider } from '@/contexts/NetworkContext';
import OfflineIndicator from '@/components/core/OfflineIndicator';
import { initializeBackgroundSync, cleanupBackgroundSync } from '@/services/backgroundSync';

// Dynamic status bar component that adapts to theme
const DynamicStatusBar = () => {
  const { theme, isDark } = useTheme();

  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={Platform.OS === 'android' ? theme.colors.primary : 'transparent'}
      translucent={Platform.OS === 'android'}
      animated={true}
    />
  );
};

initMonitoring();

const AppLayout = () => {
  const { fontsLoaded } = useInitializeTheme();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasSeenWelcome = await AsyncStorage.getItem('has_seen_beta_welcome');
        if (hasSeenWelcome === null && user) {
          router.replace('/welcome');
        }
      } catch (error) {
        console.error('Failed to access AsyncStorage', error);
      } finally {
        setIsReady(true);
      }
    };

    checkFirstLaunch();
  }, [user, router]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isInternetReachable !== null) {
        trackOfflineOnlineTime(state.isInternetReachable);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Initialize background sync when user is authenticated
  useEffect(() => {
    if (user) {
      initializeBackgroundSync();
    }

    return () => {
      cleanupBackgroundSync();
    };
  }, [user]);

  if (!fontsLoaded || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <DynamicStatusBar />
      <OfflineIndicator />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="register" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="analytics" options={{ headerShown: false }} />
        <Stack.Screen name="add-patient" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="patient/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="edit-patient/[id]" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <NetworkProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppInitializer>
              <AppLayout />
            </AppInitializer>
          </ThemeProvider>
        </AuthProvider>
      </NetworkProvider>
    </ErrorBoundary>
  );
}
