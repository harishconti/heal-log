import { Stack, useRouter, usePathname } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useInitializeTheme } from '@/contexts/ThemeContext';
import { ActivityIndicator, View } from 'react-native';
import AppInitializer from '@/contexts/AppInitializer';
import { initMonitoring, ErrorBoundary } from '@/utils/monitoring';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";
import { trackOfflineOnlineTime } from '@/services/analytics';

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
  }, [user]);

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

  if (!fontsLoaded || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="welcome" />
      </Stack>
  );
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AppInitializer>
            <AppLayout />
          </AppInitializer>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
