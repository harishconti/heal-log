import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema, PatientFormData } from '../../lib/validation';
import ControlledInput from '../../components/forms/ControlledInput';
import { database } from '../../models/database';
import Patient from '../../models/Patient';
import withObservables from '@nozbe/with-observables';

const MEDICAL_GROUPS = [
  'general', 'cardiology', 'physiotherapy', 'orthopedics', 'neurology',
  'dermatology', 'pediatrics', 'psychiatry', 'endocrinology', 'pulmonology',
  'obstetric_cardiology', 'post_surgical'
];

function EditPatientScreen({ patient }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, setValue, watch, reset, formState: { isDirty } } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const photo = watch('photo');
  const isFavorite = watch('is_favorite');
  const location = watch('location');
  const medicalGroup = watch('group');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (patient) {
      const patientData = {
        full_name: patient.name || '',
        phone_number: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        photo: patient.photo || '',
        is_favorite: patient.isFavorite || false,
        location: patient.location || 'Clinic',
        group: patient.group || 'general',
        initial_complaint: patient.initialComplaint || '',
        initial_diagnosis: patient.initialDiagnosis || '',
      };
      reset(patientData);
    }
  }, [patient, reset]);


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll access is needed.');
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
      setValue('photo', result.assets[0].base64, { shouldDirty: true });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setValue('photo', result.assets[0].base64, { shouldDirty: true });
    }
  };

  const showImagePicker = () => {
    Alert.alert('Update Photo', 'Choose an option', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
      { text: 'Remove Photo', onPress: () => setValue('photo', '', { shouldDirty: true }), style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onSubmit = async (data: PatientFormData) => {
    if (!patient) return;
    setSaving(true);
    try {
      await database.write(async () => {
        await patient.update(p => {
          p.name = data.full_name;
          p.phone = data.phone_number;
          p.email = data.email;
          p.address = data.address;
          p.photo = data.photo;
          p.isFavorite = data.is_favorite;
          p.location = data.location;
          p.group = data.group;
          p.initialComplaint = data.initial_complaint;
          p.initialDiagnosis = data.initial_diagnosis;
        });
      });
      Alert.alert('Success', 'Patient updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const message = 'Failed to update patient';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const deletePatient = () => {
    if (!patient) return;
    Alert.alert(
      'Delete Patient', 'Are you sure? This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await patient.destroyPermanently();
              });
              Alert.alert('Deleted', 'Patient removed successfully.', [
                { text: 'OK', onPress: () => router.replace('/') },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete patient');
            }
          },
        },
      ]
    );
  };

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Loading patient data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Patient</Text>
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            style={[styles.headerButton, (!isDirty || saving) && styles.disabledButton]}
            disabled={!isDirty || saving}
          >
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoContainer} onPress={showImagePicker}>
              {photo ? (
                <Image source={{ uri: `data:image/jpeg;base64,${photo}` }} style={styles.patientPhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={32} color="#666" />
                  <Text style={styles.photoText}>Update Photo</Text>
                </View>
              )}
              <View style={styles.photoOverlay}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <ControlledInput control={control} name="full_name" label="Full Name *" placeholder="Patient's full name" autoCapitalize="words" />
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <ControlledInput control={control} name="phone_number" label="Phone" placeholder="Phone number" keyboardType="phone-pad" />
              </View>
              <View style={styles.inputHalf}>
                <ControlledInput control={control} name="email" label="Email" placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
              </View>
            </View>
            <ControlledInput control={control} name="address" label="Address" placeholder="Patient's address" multiline numberOfLines={2} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Location</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => Alert.alert('Visit Location', 'Select location', [
                  { text: 'Clinic', onPress: () => setValue('location', 'Clinic', { shouldDirty: true }) },
                  { text: 'Home Visit', onPress: () => setValue('location', 'Home Visit', { shouldDirty: true }) },
                  { text: 'Hospital', onPress: () => setValue('location', 'Hospital', { shouldDirty: true }) },
                  { text: 'Emergency', onPress: () => setValue('location', 'Emergency', { shouldDirty: true }) },
                ])}>
                  <Text style={styles.pickerText}>{location || 'Select location'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Medical Group</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => Alert.alert('Medical Group', 'Select specialty',
                  MEDICAL_GROUPS.map(group => ({
                    text: group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' '),
                    onPress: () => setValue('group', group, { shouldDirty: true }),
                  }))
                )}>
                  <Text style={styles.pickerText}>{medicalGroup ? medicalGroup.charAt(0).toUpperCase() + medicalGroup.slice(1).replace('_', ' ') : 'Select'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
            <ControlledInput control={control} name="initial_complaint" label="Initial Complaint" placeholder="Patient's initial complaint" multiline numberOfLines={3} />
            <ControlledInput control={control} name="initial_diagnosis" label="Initial Diagnosis" placeholder="Initial diagnosis" multiline numberOfLines={3} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Options</Text>
            <TouchableOpacity style={styles.favoriteOption} onPress={() => setValue('is_favorite', !isFavorite, { shouldDirty: true })}>
              <View style={styles.favoriteLeft}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#e74c3c' : '#666'} />
                <Text style={styles.favoriteText}>Mark as Favorite</Text>
              </View>
              <Text style={styles.favoriteSubtext}>Favorites appear at the top of your list</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dangerSection}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={deletePatient}>
              <Ionicons name="trash" size={20} color="#e74c3c" />
              <Text style={styles.deleteText}>Delete Patient</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const enhance = withObservables(['id'], ({ id }) => ({
  patient: database.collections.get<Patient>('patients').findAndObserve(id),
}));

const EnhancedEditPatient = enhance(EditPatientScreen);

export default function EditPatientContainer() {
  const { id } = useLocalSearchParams();
  return <EnhancedEditPatient id={id} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  keyboardAvoid: { flex: 1 },
  header: { backgroundColor: '#2ecc71', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, paddingTop: 48 },
  headerButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  saveText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  disabledButton: { opacity: 0.5 },
  scrollContent: { paddingBottom: 32 },
  photoSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff', marginBottom: 16 },
  photoContainer: { position: 'relative', borderRadius: 60, overflow: 'hidden' },
  patientPhoto: { width: 120, height: 120, borderRadius: 60 },
  photoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#dee2e6', borderStyle: 'dashed' },
  photoText: { fontSize: 12, color: '#666', marginTop: 4 },
  photoOverlay: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#2ecc71', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  section: { backgroundColor: '#fff', marginBottom: 16, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  inputHalf: { flex: 1 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },
  pickerButton: { backgroundColor: '#f8f9fa', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#e9ecef', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50 },
  pickerText: { fontSize: 16, color: '#333' },
  favoriteOption: { paddingVertical: 12 },
  favoriteLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  favoriteText: { fontSize: 16, color: '#333', marginLeft: 12, fontWeight: '500' },
  favoriteSubtext: { fontSize: 14, color: '#666', marginLeft: 36 },
  dangerSection: { backgroundColor: '#fff', marginBottom: 16, padding: 16 },
  dangerTitle: { fontSize: 18, fontWeight: '600', color: '#e74c3c', marginBottom: 16 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#e74c3c', gap: 8 },
  deleteText: { fontSize: 16, color: '#e74c3c', fontWeight: '500' },
});