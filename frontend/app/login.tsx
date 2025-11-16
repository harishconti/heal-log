import React from 'react';
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
import ControlledInput from '@/components/forms/ControlledInput';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';
import { addBreadcrumb } from '@/utils/monitoring';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const { loading, setLoading } = useAppStore();

  const { control, handleSubmit, setValue } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'dr.sarah@clinic.com', // Pre-filled for demo
      password: 'password123',   // Pre-filled for demo
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading('login', true);
    addBreadcrumb('auth', `User login attempt: ${data.email}`);
    try {
      await login(data.email, data.password);
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An unexpected error occurred.');
    } finally {
      setLoading('login', false);
    }
  };

  const navigateToRegister = () => {
    router.push('/register');
  };

  const loadDemoAccount = (userType: 'cardiology' | 'physiotherapy') => {
    if (userType === 'cardiology') {
      setValue('email', 'dr.sarah@clinic.com');
      setValue('password', 'password123');
    } else {
      setValue('email', 'dr.mike@physio.com');
      setValue('password', 'password123');
    }
  };

  const styles = getStyles(theme);

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
            <Text style={styles.title}>Medical Contacts</Text>
            <Text style={styles.subtitle}>Professional Patient Management</Text>
          </View>

          {/* Demo Accounts */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Demo Accounts:</Text>
            <View style={styles.demoButtons}>
              <TouchableOpacity 
                style={styles.demoButton}
                onPress={() => loadDemoAccount('cardiology')}
              >
                <Text style={styles.demoButtonText}>Dr. Sarah (Cardiology)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.demoButton}
                onPress={() => loadDemoAccount('physiotherapy')}
              >
                <Text style={styles.demoButtonText}>Dr. Mike (Physiotherapy)</Text>
              </TouchableOpacity>
            </View>
          </View>

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

            <TouchableOpacity 
              style={[styles.loginButton, loading.login && styles.loginButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading.login}
            >
              {loading.login ? (
                <ActivityIndicator color="#fff" />
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

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="people" size={24} color={theme.colors.primary} />
              <Text style={styles.featureText}>Patient Management</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="document-text" size={24} color={theme.colors.primary} />
              <Text style={styles.featureText}>Medical Notes</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="cloud" size={24} color={theme.colors.primary} />
              <Text style={styles.featureText}>Cloud Sync</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
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
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  demoSection: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  demoButtons: {
    gap: 8,
  },
  demoButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loginButtonDisabled: {
    backgroundColor: theme.colors.primaryMuted,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
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
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '600',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 'auto',
  },
  feature: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
