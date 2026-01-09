import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validation';
import { ControlledInput } from '@/components/forms/ControlledInput';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';
import { addBreadcrumb } from '@/utils/monitoring';
import { getErrorMessage, isVerificationError } from '@/utils/errorMessages';
import {
  checkBiometricCapabilities,
  attemptBiometricLogin,
  isBiometricLoginEnabled,
  BiometricCapabilities,
} from '@/services/biometricAuth';
import api from '@/services/api';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const { login, setToken, setUser } = useAuth();
  const router = useRouter();
  const { theme, fontScale } = useTheme();
  const { loading, setLoading, settings } = useAppStore();

  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const { control, handleSubmit, getValues } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check biometric capabilities on mount
  useEffect(() => {
    let isMounted = true;

    const checkBiometrics = async () => {
      const capabilities = await checkBiometricCapabilities();

      // Check if component is still mounted before updating state
      if (!isMounted) return;

      setBiometricCapabilities(capabilities);

      if (capabilities.isAvailable && capabilities.isEnrolled) {
        const enabled = await isBiometricLoginEnabled();

        // Check again after async operation
        if (!isMounted) return;

        setBiometricEnabled(enabled);

        // Auto-trigger biometric login if enabled
        if (enabled && settings.biometricEnabled) {
          handleBiometricLogin();
        }
      }
    };

    checkBiometrics();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    addBreadcrumb('auth', 'Biometric login attempt');

    try {
      const result = await attemptBiometricLogin();

      if (result.success && result.token) {
        // Validate the token with the server
        try {
          // Set the token temporarily
          if (Platform.OS === 'web') {
            window.sessionStorage?.setItem('token', result.token);
          } else {
            await SecureStore.setItemAsync('token', result.token);
          }

          // Verify token is still valid
          const response = await api.get('/api/auth/me');

          if (response.data.user) {
            setToken(result.token);
            setUser(response.data.user);
            addBreadcrumb('auth', 'Biometric login successful');
            router.replace('/');
          }
        } catch (error: any) {
          // Token is invalid, clear it
          if (Platform.OS === 'web') {
            window.sessionStorage?.removeItem('token');
          } else {
            await SecureStore.deleteItemAsync('token');
          }

          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in with your password.',
            [{ text: 'OK' }]
          );
        }
      } else if (result.error && result.error !== 'Authentication cancelled') {
        Alert.alert('Biometric Login Failed', result.error);
      }
    } catch (error: any) {
      console.error('Biometric login error:', error);
      Alert.alert('Error', 'Failed to authenticate with biometrics');
    } finally {
      setBiometricLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoading('auth', true);
    addBreadcrumb('auth', `User login attempt: ${data.email}`);
    try {
      await login(data.email, data.password);
      router.replace('/');
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';

      // Check if user needs to verify email
      if (isVerificationError(errorMessage)) {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email to continue. A verification code has been sent to your email.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Verify Now',
              onPress: () => router.push({
                pathname: '/verify-otp',
                params: { email: data.email }
              })
            }
          ]
        );
      } else {
        const userMessage = getErrorMessage(errorMessage, 'login');
        Alert.alert('Login Failed', userMessage);
      }
    } finally {
      setLoading('auth', false);
    }
  };

  const navigateToRegister = () => {
    router.push('/register');
  };

  const navigateToForgotPassword = () => {
    router.push('/forgot-password');
  };

  const getBiometricIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!biometricCapabilities) return 'finger-print';
    if (biometricCapabilities.biometricTypes.includes('facial')) {
      return Platform.OS === 'ios' ? 'scan' : 'happy-outline';
    }
    return 'finger-print';
  };

  const getBiometricLabel = (): string => {
    if (!biometricCapabilities) return 'Biometric Login';
    if (biometricCapabilities.biometricTypes.includes('facial')) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face';
    }
    return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  };

  const styles = getStyles(theme, fontScale);

  // Show biometric button when device has biometrics available
  const showBiometricButton = biometricCapabilities?.isAvailable &&
    biometricCapabilities?.isEnrolled;

  // Check if biometric login is ready to use (already set up)
  const biometricReady = biometricEnabled && settings.biometricEnabled;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="heart" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Welcome back, Doctor</Text>
            <Text style={styles.subtitle}>Securely access your patient logs</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <ControlledInput
              control={control}
              name="email"
              label="Medical ID or Email"
              placeholder="Enter your ID"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              iconName="person-outline"
            />

            <ControlledInput
              control={control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              isPassword
              iconName="lock-closed-outline"
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPasswordLink}
              onPress={navigateToForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              title="Log In"
              onPress={handleSubmit(onSubmit)}
              loading={loading.auth}
              disabled={loading.auth}
              icon="log-in-outline"
              iconPosition="right"
              size="large"
            />

            {/* Biometric Login Section */}
            {showBiometricButton && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or sign in with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.biometricRow}>
                  {biometricCapabilities?.biometricTypes.includes('facial') && (
                    <TouchableOpacity
                      style={styles.biometricButton}
                      onPress={() => {
                        if (biometricReady) {
                          handleBiometricLogin();
                        } else {
                          Alert.alert(
                            'Set Up Face ID',
                            'Sign in with your email and password first, then enable Face ID in Settings.',
                            [{ text: 'OK' }]
                          );
                        }
                      }}
                      disabled={biometricLoading}
                    >
                      {biometricLoading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                      ) : (
                        <Ionicons
                          name="happy-outline"
                          size={28}
                          color={biometricReady ? theme.colors.text : theme.colors.textSecondary}
                        />
                      )}
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={() => {
                      if (biometricReady) {
                        handleBiometricLogin();
                      } else {
                        Alert.alert(
                          `Set Up ${getBiometricLabel()}`,
                          `Sign in with your email and password first, then enable ${getBiometricLabel()} in Settings.`,
                          [{ text: 'OK' }]
                        );
                      }
                    }}
                    disabled={biometricLoading}
                  >
                    {biometricLoading ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <Ionicons
                        name="finger-print"
                        size={28}
                        color={biometricReady ? theme.colors.text : theme.colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* HIPAA Badge */}
            <View style={styles.hipaaBadge}>
              <Ionicons name="shield-checkmark" size={14} color={theme.colors.success} />
              <Text style={styles.hipaaText}>HIPAA COMPLIANT SECURE LOGIN</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, fontScale: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 28 * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16 * fontScale,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14 * fontScale,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: theme.colors.textSecondary,
    fontSize: 14 * fontScale,
  },
  biometricRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  biometricButton: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  registerText: {
    fontSize: 14 * fontScale,
    color: theme.colors.textSecondary,
  },
  registerLink: {
    fontSize: 14 * fontScale,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  hipaaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  hipaaText: {
    fontSize: 11 * fontScale,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
