import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useInitializeTheme } from '../contexts/ThemeContext';

const AppLayout = () => {
  const { theme, fontsLoaded } = useInitializeTheme();

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </AuthProvider>
  );
}