import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useInitializeTheme } from '../contexts/ThemeContext';
import { ActivityIndicator, View } from 'react-native';

const AppLayout = () => {
  const { fontsLoaded } = useInitializeTheme();

  if (!fontsLoaded) {
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
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </AuthProvider>
  );
}