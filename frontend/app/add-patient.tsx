import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema, PatientFormData } from '@/lib/validation';
import ControlledInput from '../components/forms/ControlledInput';
import { database } from '../models/database';
import Patient from '../models/Patient';
import uuid from 'react-native-uuid';

const MEDICAL_GROUPS = [
  'general',
  'cardiology', 
  'physiotherapy',
  'orthopedics',
  'neurology',
  'dermatology',
  'pediatrics',
  'psychiatry',
  'endocrinology',
  'pulmonology',
  'obstetric_cardiology',
  'post_surgical'
];

export default function AddPatientScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, setValue, watch } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone_number: '',
      date_of_birth: '',
      address: '',
    },
  });

  const photo = watch('photo');
  const isFavorite = watch('is_favorite');
  const location = watch('location', 'Clinic');
  const medicalGroup = watch('group', 'general');

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permissions are required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setValue('photo', result.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permissions are required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setValue('photo', result.assets[0].base64);
    }
  };

  const showImagePicker = () => {
    Alert.alert('Select Photo', 'Choose how to add a patient photo', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    try {
      await database.write(async () => {
        await database.collections.get<Patient>('patients').create(patient => {
          patient.patientId = `PAT-${uuid.v4()}`;
          patient.name = data.full_name;
          patient.phone = data.phone_number;
          patient.email = data.email;
          patient.address = data.address;
          patient.location = location;
          patient.initialComplaint = data.initial_complaint;
          patient.initialDiagnosis = data.initial_diagnosis;
          patient.photo = data.photo;
          patient.group = medicalGroup;
          patient.isFavorite = isFavorite;
        });
      });
      Alert.alert('Success', 'Patient added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to add patient';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Patient</Text>
          <TouchableOpacity 
            onPress={handleSubmit(onSubmit)}
            style={[styles.headerButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoContainer} onPress={showImagePicker}>
              {photo ? (
                <Image 
                  source={{ uri: `data:image/jpeg;base64,${photo}` }}
                  style={styles.patientPhoto}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={32} color="#666" />
                  <Text style={styles.photoText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <ControlledInput
              control={control}
              name="full_name"
              label="Full Name *"
              placeholder="Enter patient's full name"
              autoCapitalize="words"
            />
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <ControlledInput
                  control={control}
                  name="phone_number"
                  label="Phone"
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputHalf}>
                <ControlledInput
                  control={control}
                  name="email"
                  label="Email"
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <ControlledInput
              control={control}
              name="address"
              label="Address"
              placeholder="Patient's address"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Medical Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Location</Text>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert('Visit Location', 'Select visit location', [
                      { text: 'Clinic', onPress: () => setValue('location', 'Clinic') },
                      { text: 'Home Visit', onPress: () => setValue('location', 'Home Visit') },
                      { text: 'Hospital', onPress: () => setValue('location', 'Hospital') },
                      { text: 'Emergency', onPress: () => setValue('location', 'Emergency') },
                    ]);
                  }}
                >
                  <Text style={styles.pickerText}>{location}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Medical Group</Text>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert('Medical Group', 'Select medical specialty',
                      MEDICAL_GROUPS.map(group => ({
                        text: group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' '),
                        onPress: () => setValue('group', group),
                      }))
                    );
                  }}
                >
                  <Text style={styles.pickerText}>
                    {medicalGroup.charAt(0).toUpperCase() + medicalGroup.slice(1).replace('_', ' ')}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <ControlledInput
                control={control}
                name="initial_complaint"
                label="Initial Complaint"
                placeholder="Describe the patient's initial complaint or symptoms..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                />

            <ControlledInput
                control={control}
                name="initial_diagnosis"
                label="Initial Diagnosis"
                placeholder="Enter initial diagnosis or assessment..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
             />

          </View>

          {/* Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Options</Text>
            
            <TouchableOpacity 
              style={styles.favoriteOption}
              onPress={() => setValue('is_favorite', !isFavorite)}
            >
              <View style={styles.favoriteLeft}>
                <Ionicons 
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={24} 
                  color={isFavorite ? '#e74c3c' : '#666'}
                />
                <Text style={styles.favoriteText}>Mark as Favorite</Text>
              </View>
              <Text style={styles.favoriteSubtext}>
                Favorite patients appear at the top of your list
              </Text>
            </TouchableOpacity>
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
  header: {
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.5,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  photoContainer: {
    borderRadius: 60,
    overflow: 'hidden',
  },
  patientPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textAreaInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 80,
  },
  pickerButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  favoriteOption: {
    paddingVertical: 12,
  },
  favoriteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  favoriteText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  favoriteSubtext: {
    fontSize: 14,
    color: '#666',
    marginLeft: 36,
  },
});