import React, { useEffect, useState } from 'react';
// import { useAuth } from './AuthContext';
import { useInitializeTheme } from './ThemeContext';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/useAppStore';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  // const { isLoading: isAuthLoading } = useAuth();
  const { fontsLoaded } = useInitializeTheme();
  const { settings, updateSettings } = useAppStore();
  const [hapticChecked, setHapticChecked] = useState(false);

  // Check haptic availability on mount
  useEffect(() => {
    const checkHapticAvailability = async () => {
      try {
        // On Android, check if haptics are available
        if (Platform.OS === 'android') {
          // Try to trigger a silent haptic to check availability
          await Haptics.selectionAsync();
        }
        // If we get here, haptics are available
        setHapticChecked(true);
      } catch (error) {
        // Haptics not available, disable the setting
        console.log('Haptic feedback not available on this device');
        updateSettings({ hapticEnabled: false });
        setHapticChecked(true);
      }
    };

    checkHapticAvailability();
  }, []);

  // if (isAuthLoading || !fontsLoaded) {
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
};

export default AppInitializer;
