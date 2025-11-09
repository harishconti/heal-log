import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useInitializeTheme } from '../contexts/ThemeContext';
import { ActivityIndicator, View } from 'react-native';
import { initMonitoring, ErrorBoundary } from '../utils/monitoring';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BetaWelcomeScreen from './screens/BetaWelcomeScreen';

initMonitoring();

const AppLayout = () => {
  const { fontsLoaded } = useInitializeTheme();
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched === null) {
          setShowWelcomeScreen(true);
          await AsyncStorage.setItem('hasLaunched', 'true');
        }
      } catch (error) {
        console.error('Failed to access AsyncStorage', error);
      }
    };

    checkFirstLaunch();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="profile" />
      </Stack>
      <BetaWelcomeScreen
        visible={showWelcomeScreen}
        onClose={() => setShowWelcomeScreen(false)}
      />
    </>
  );
};

import AppInitializer from '../contexts/AppInitializer';

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