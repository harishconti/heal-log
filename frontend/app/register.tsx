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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '../lib/validation';
import ControlledInput from '../components/forms/ControlledInput';

const SPECIALTIES = [
  'general',
  'cardiology',
  'physiotherapy',
  'orthopedics',
  'neurology',
  'dermatology',
  'pediatrics',
  'psychiatry',
  'endocrinology',
  'pulmonology'
];

export default function RegisterScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [medicalSpecialty, setMedicalSpecialty] = useState('general');
  
  const { register } = useAuth();
  const router = useRouter();

  const { control, handleSubmit, setValue } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await register({
        ...data,
        medical_specialty: medicalSpecialty,
      });
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

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
              <Ionicons name="arrow-back" size={24} color="#2ecc71" />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Medical Contacts today</Text>
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
            />
            <ControlledInput
              control={control}
              name="phone"
              placeholder="Phone Number"
              iconName="call"
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />

            <View style={styles.inputContainer}>
              <Ionicons name="medical" size={20} color="#666" style={styles.inputIcon} />
              <TouchableOpacity 
                style={styles.pickerContainer}
                onPress={() => {
                  Alert.alert(
                    'Medical Specialty',
                    'Select your specialty',
                    SPECIALTIES.map(specialty => ({
                      text: specialty.charAt(0).toUpperCase() + specialty.slice(1),
                      onPress: () => setMedicalSpecialty(specialty)
                    }))
                  );
                }}
              >
                <Text style={styles.pickerText}>
                  {medicalSpecialty.charAt(0).toUpperCase() + medicalSpecialty.slice(1)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ControlledInput
              control={control}
              name="password"
              placeholder="Password *"
              iconName="lock-closed"
              isPassword
              placeholderTextColor="#999"
            />
            <ControlledInput
              control={control}
              name="confirmPassword"
              placeholder="Confirm Password *"
              iconName="lock-closed"
              isPassword
              placeholderTextColor="#999"
            />

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

          {/* Subscription Plans */}
          <View style={styles.plansSection}>
            <Text style={styles.plansTitle}>Subscription Plans</Text>
            <View style={styles.plans}>
              <View style={styles.plan}>
                <Text style={styles.planName}>Regular</Text>
                <Text style={styles.planPrice}>Free Trial</Text>
                <Text style={styles.planFeature}>• Android App</Text>
                <Text style={styles.planFeature}>• Basic Features</Text>
                <Text style={styles.planFeature}>• 30-day Trial</Text>
              </View>
              <View style={[styles.plan, styles.planPro]}>
                <Text style={styles.planName}>Pro</Text>
                <Text style={styles.planPrice}>$9.99/month</Text>
                <Text style={styles.planFeature}>• Android App</Text>
                <Text style={styles.planFeature}>• Web Dashboard</Text>
                <Text style={styles.planFeature}>• Advanced Analytics</Text>
                <Text style={styles.planFeature}>• Priority Support</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    fontSize: 16,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#2ecc71',
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
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16,
    color: '#666',
  },
  loginLinkBold: {
    color: '#2ecc71',
    fontWeight: '600',
  },
  plansSection: {
    marginTop: 'auto',
  },
  plansTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  plans: {
    flexDirection: 'row',
    gap: 12,
  },
  plan: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  planPro: {
    borderWidth: 2,
    borderColor: '#2ecc71',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 14,
    color: '#2ecc71',
    fontWeight: '500',
    marginBottom: 12,
  },
  planFeature: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});