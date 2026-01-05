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
    const checkBiometrics = async () => {
      const capabilities = await checkBiometricCapabilities();
      setBiometricCapabilities(capabilities);

      if (capabilities.isAvailable && capabilities.isEnrolled) {
        const enabled = await isBiometricLoginEnabled();
        setBiometricEnabled(enabled);

        // Auto-trigger biometric login if enabled
        if (enabled && settings.biometricEnabled) {
          handleBiometricLogin();
        }
      }
    };

    checkBiometrics();
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
      return Platform.OS === 'ios' ? 'Sign in with Face ID' : 'Sign in with Face';
    }
    return Platform.OS === 'ios' ? 'Sign in with Touch ID' : 'Sign in with Fingerprint';
  };

  const styles = getStyles(theme, fontScale);

  const showBiometricButton = biometricCapabilities?.isAvailable &&
    biometricCapabilities?.isEnrolled &&
    biometricEnabled;

  const showBiometricSetupHint = biometricCapabilities?.isAvailable &&
    biometricCapabilities?.isEnrolled &&
    !biometricEnabled;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="medical" size={64} color={theme.colors.primary} />
            <Text style={styles.title}>HealLog</Text>
            <Text style={styles.subtitle}>Professional Patient Management</Text>
          </View>

          {/* Biometric Login Button */}
          {showBiometricButton && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={biometricLoading}
            >
              {biometricLoading ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name={getBiometricIcon()}
                    size={32}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.biometricText}>{getBiometricLabel()}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {showBiometricButton && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in with email</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {/* Login Form */}
          <View style={styles.form}>
            <ControlledInput
              control={control}
              name="email"
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={theme.colors.textSecondary}
            />
            <ControlledInput
              control={control}
              name="password"
              placeholder="Password"
              isPassword
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPasswordLink}
              onPress={navigateToForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading.auth && styles.loginButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading.auth}
            >
              {loading.auth ? (
                <ActivityIndicator color={theme.colors.surface} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={navigateToRegister}
            >
              <Text style={styles.registerButtonText}>Create New Account</Text>
            </TouchableOpacity>
          </View>

          {/* Biometric Setup Hint */}
          {showBiometricSetupHint && (
            <View style={styles.biometricHint}>
              <View style={styles.biometricHintIcon}>
                <Ionicons
                  name={getBiometricIcon()}
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.biometricHintTextContainer}>
                <Text style={styles.biometricHintTitle}>
                  {getBiometricLabel()} Available
                </Text>
                <Text style={styles.biometricHintDescription}>
                  Enable quick sign-in with {getBiometricLabel().toLowerCase()} in Settings after logging in
                </Text>
              </View>
            </View>
          )}

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
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28 * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16 * fontScale,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  biometricButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  biometricText: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 8,
  },
  form: {
    marginBottom: 32,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14 * fontScale,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loginButtonDisabled: {
    backgroundColor: theme.colors.primaryMuted,
  },
  loginButtonText: {
    color: theme.colors.surface,
    fontSize: 18 * fontScale,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
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
  registerButton: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: theme.colors.primary,
    fontSize: 16 * fontScale,
    fontWeight: '600',
  },
  biometricHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
  },
  biometricHintIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  biometricHintTextContainer: {
    flex: 1,
  },
  biometricHintTitle: {
    fontSize: 15 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  biometricHintDescription: {
    fontSize: 13 * fontScale,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
