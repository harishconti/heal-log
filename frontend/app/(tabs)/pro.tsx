import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

// Placeholder component that redirects to /profile
// The actual navigation is handled by the tab press listener in _layout.tsx
export default function ProScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Redirect to profile if directly accessed
    router.replace('/profile');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
