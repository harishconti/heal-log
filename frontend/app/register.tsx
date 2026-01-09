import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
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
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { getErrorMessage, isDuplicateEmailError } from '@/utils/errorMessages';

const SPECIALTIES = [
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

      if (response?.requires_verification) {
        router.push({
          pathname: '/verify-otp',
          params: { email: sanitizedData.email }
        });
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';

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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-add-outline" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join HealLog to manage your patient logs securely</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            <ControlledInput
              control={control}
              name="full_name"
              label="Full Name"
              placeholder="Enter your full name"
              iconName="person-outline"
              autoCapitalize="words"
              error={errors.full_name?.message}
            />

            <ControlledInput
              control={control}
              name="email"
              label="Email Address"
              placeholder="Enter your email"
              iconName="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email?.message}
            />

            <ControlledInput
              control={control}
              name="phone"
              label="Phone Number (Optional)"
              placeholder="Enter phone number"
              iconName="call-outline"
              keyboardType="phone-pad"
              error={errors.phone?.message}
            />

            {/* Department/Specialty Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Medical Department</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowSpecialtyModal(true)}
              >
                <Ionicons name="medical-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.pickerText}>
                  {medicalSpecialty.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ControlledInput
              control={control}
              name="password"
              label="Password"
              placeholder="Create a strong password"
              iconName="lock-closed-outline"
              isPassword
              helperText="Min 8 chars with upper, lower, number & special"
              error={errors.password?.message}
            />

            {/* Password Strength Indicator */}
            {password && password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${(passwordStrength.score / 6) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            <ControlledInput
              control={control}
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Re-enter your password"
              iconName="lock-closed-outline"
              isPassword
              error={errors.confirmPassword?.message}
            />

            {/* Real-time password match indicator */}
            {confirmPassword && confirmPassword.length > 0 && (
              <View style={styles.matchIndicator}>
                <Ionicons
                  name={passwordsMatch ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={passwordsMatch ? theme.colors.success : theme.colors.error}
                />
                <Text style={[styles.matchText, { color: passwordsMatch ? theme.colors.success : theme.colors.error }]}>
                  {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                </Text>
              </View>
            )}

            <Button
              title="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              icon="person-add-outline"
              iconPosition="right"
              size="large"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.footerLink}>Sign In</Text>
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
              <TouchableOpacity
                onPress={() => setShowSpecialtyModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SPECIALTIES}
              keyExtractor={(item) => item}
              style={styles.specialtyList}
              showsVerticalScrollIndicator={false}
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
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
    lineHeight: 24 * fontScale,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14 * fontScale,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  pickerText: {
    flex: 1,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14 * fontScale,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    fontSize: 14 * fontScale,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  specialtyList: {
    paddingHorizontal: 16,
  },
  specialtyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    marginVertical: 2,
  },
  specialtyItemSelected: {
    backgroundColor: theme.colors.primaryMuted,
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
