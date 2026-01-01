import React, { useState } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData, getPasswordStrength } from '@/lib/validation';
import { ControlledInput } from '@/components/forms/ControlledInput';
import { useTheme } from '@/contexts/ThemeContext';
import { getErrorMessage, isDuplicateEmailError } from '@/utils/errorMessages';

const SPECIALTIES = [
  // Therapy & frequent session professions (most likely to use app)
  'physiotherapy',
  'acupuncture',
  'nursing',
  'general',
  'family medicine',
  'internal medicine',
  'psychiatry',
  'dermatology',
  'pediatrics',
  'orthopedics',
  'cardiology',
  'neurology',
  'gynecology',
  'endocrinology',
  'pulmonology',
  'oncology',
  'ophthalmology',
  'urology',
  'dentistry',
  'homeopathy',
  'ayurveda',
  'surgery',
  'emergency medicine',
  'radiology',
  'anesthesiology',
  'pathology',
];

export default function RegisterScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [medicalSpecialty, setMedicalSpecialty] = useState('general');
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);

  const { register } = useAuth();
  const router = useRouter();
  const { theme, fontScale } = useTheme();

  const { control, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    }
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const passwordStrength = getPasswordStrength(password || '');
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Sanitize inputs before submission
      const sanitizedData = {
        ...data,
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || '',
      };

      const response = await register({
        ...sanitizedData,
        medical_specialty: medicalSpecialty,
      });

      // Check if OTP verification is required
      if (response?.requires_verification) {
        // Redirect to OTP verification screen
        router.push({
          pathname: '/verify-otp',
          params: { email: sanitizedData.email }
        });
      } else {
        // Legacy flow (if backend doesn't require verification)
        router.replace('/');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';

      // Smart redirect for duplicate email
      if (isDuplicateEmailError(errorMessage)) {
        Alert.alert(
          'Account Exists',
          'This email is already registered. Would you like to sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.back() }
          ]
        );
      } else {
        const userMessage = getErrorMessage(errorMessage, 'signup');
        Alert.alert('Registration Failed', userMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  const styles = getStyles(theme, fontScale);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join HealLog today</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            <ControlledInput
              control={control}
              name="full_name"
              placeholder="Full Name *"
              iconName="person"
              autoCapitalize="words"
              placeholderTextColor="#999"
              error={errors.full_name?.message}
            />
            <ControlledInput
              control={control}
              name="email"
              placeholder="Email Address *"
              iconName="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#999"
              error={errors.email?.message}
            />
            <ControlledInput
              control={control}
              name="phone"
              placeholder="Phone Number"
              iconName="call"
              keyboardType="phone-pad"
              placeholderTextColor="#999"
              error={errors.phone?.message}
            />

            <View style={styles.inputContainer}>
              <Ionicons name="medical" size={20} color="#666" style={styles.inputIcon} />
              <TouchableOpacity
                style={styles.pickerContainer}
                onPress={() => setShowSpecialtyModal(true)}
              >
                <Text style={styles.pickerText}>
                  {medicalSpecialty.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ControlledInput
              control={control}
              name="password"
              placeholder="Password * (min 8 chars, upper/lower/number/special)"
              iconName="lock-closed"
              isPassword
              placeholderTextColor="#999"
              error={errors.password?.message}
            />

            {/* Password Strength Indicator */}
            {password && password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View style={[
                    styles.strengthFill,
                    { width: `${(passwordStrength.score / 6) * 100}%`, backgroundColor: passwordStrength.color }
                  ]} />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            <ControlledInput
              control={control}
              name="confirmPassword"
              placeholder="Confirm Password *"
              iconName="lock-closed"
              isPassword
              placeholderTextColor="#999"
              error={errors.confirmPassword?.message}
            />

            {/* Real-time password match indicator */}
            {confirmPassword && confirmPassword.length > 0 && (
              <View style={styles.matchIndicator}>
                <Ionicons
                  name={passwordsMatch ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={passwordsMatch ? "#2ecc71" : "#e74c3c"}
                />
                <Text style={[styles.matchText, { color: passwordsMatch ? "#2ecc71" : "#e74c3c" }]}>
                  {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={navigateToLogin}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Specialty Picker Modal */}
      <Modal
        visible={showSpecialtyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSpecialtyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Department</Text>
              <TouchableOpacity onPress={() => setShowSpecialtyModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SPECIALTIES}
              keyExtractor={(item) => item}
              style={styles.specialtyList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.specialtyItem,
                    medicalSpecialty === item && styles.specialtyItemSelected
                  ]}
                  onPress={() => {
                    setMedicalSpecialty(item);
                    setShowSpecialtyModal(false);
                  }}
                >
                  <Text style={[
                    styles.specialtyText,
                    medicalSpecialty === item && styles.specialtyTextSelected
                  ]}>
                    {item.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Text>
                  {medicalSpecialty === item && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28 * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16 * fontScale,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  pickerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  pickerText: {
    fontSize: 16 * fontScale,
    color: theme.colors.text,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -8,
    gap: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12 * fontScale,
    fontWeight: '600',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -8,
    gap: 6,
  },
  matchText: {
    fontSize: 12 * fontScale,
    fontWeight: '500',
  },
  registerButton: {
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
  registerButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18 * fontScale,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16 * fontScale,
    color: theme.colors.textSecondary,
  },
  loginLinkBold: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
  },
  specialtyList: {
    paddingHorizontal: 16,
  },
  specialtyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  specialtyItemSelected: {
    backgroundColor: theme.colors.primaryMuted || `${theme.colors.primary}15`,
  },
  specialtyText: {
    fontSize: 16 * fontScale,
    color: theme.colors.text,
  },
  specialtyTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});