import React, { useEffect } from 'react';
// import { useAuth } from './AuthContext';
import { useInitializeTheme } from './ThemeContext';
import { View, ActivityIndicator } from 'react-native';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  // const { isLoading: isAuthLoading } = useAuth();
  const { fontsLoaded } = useInitializeTheme();

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
