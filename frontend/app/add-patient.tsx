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
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { compressImage, shouldCompressImage } from '@/services/image_service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema, PatientFormData } from '@/lib/validation';
import { ControlledInput } from '@/components/forms/ControlledInput';
import { PatientService } from '@/services/patient_service';
import { addBreadcrumb } from '@/utils/monitoring';
import { database } from '@/models/database';
import Patient from '@/models/Patient';
import { getErrorMessage } from '@/utils/errorMessages';

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
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [allGroups, setAllGroups] = useState<string[]>(MEDICAL_GROUPS);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  const LOCATION_OPTIONS = ['Clinic', 'Home Visit', 'Hospital', 'Emergency'];

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<PatientFormData>({
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

  const fetchAllGroups = React.useCallback(async () => {
    try {
      const patients = await database.collections.get<Patient>('patients').query().fetch();
      const uniqueGroups = [...new Set(patients.map(p => p.group).filter(Boolean))];
      // Merge with default groups, ensuring no duplicates
      const combined = [...new Set([...MEDICAL_GROUPS, ...uniqueGroups])];
      setAllGroups(combined.sort());
    } catch (error) {
      console.error('Error fetching groups:', error);
      setAllGroups(MEDICAL_GROUPS);
    }
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else {
      // Fetch all unique groups from database
      fetchAllGroups();
    }
  }, [isAuthenticated, router, fetchAllGroups]);

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
      quality: 0.8, // Higher initial quality, we'll compress further if needed
    });

    if (!result.canceled && result.assets[0].uri) {
      try {
        // Use image service for optimal compression
        const compressedBase64 = await compressImage(result.assets[0].uri, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.7,
        });
        setValue('photo', compressedBase64);
      } catch (error) {
        console.error('Image compression failed:', error);
        // Fallback to original if compression fails
        if (result.assets[0].base64) {
          setValue('photo', result.assets[0].base64);
        }
      }
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
      quality: 0.8, // Higher initial quality, we'll compress further if needed
    });

    if (!result.canceled && result.assets[0].uri) {
      try {
        // Use image service for optimal compression
        const compressedBase64 = await compressImage(result.assets[0].uri, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.7,
        });
        setValue('photo', compressedBase64);
      } catch (error) {
        console.error('Image compression failed:', error);
        // Fallback to original if compression fails
        if (result.assets[0].base64) {
          setValue('photo', result.assets[0].base64);
        }
      }
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

    // Sanitize inputs - trim whitespace
    const sanitizedData = {
      ...data,
      full_name: data.full_name?.trim(),
      email: data.email?.trim().toLowerCase(),
      phone_number: data.phone_number?.trim(),
      address: data.address?.trim(),
      initial_complaint: data.initial_complaint?.trim(),
      initial_diagnosis: data.initial_diagnosis?.trim(),
    };

    addBreadcrumb('patient', `Attempting to add new patient: ${sanitizedData.full_name}`);
    try {
      await PatientService.createPatient({
        ...sanitizedData,
        location,
        group: medicalGroup || 'general',
        photo,
        is_favorite: isFavorite,
      });

      Alert.alert('Success', 'Patient added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const errorText = error.response?.data?.detail || error.message || 'Failed to add patient';
      const userMessage = getErrorMessage(errorText, 'add_patient');
      Alert.alert('Error', userMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={theme.colors.surface} />
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
                  <Ionicons name="camera" size={32} color={theme.colors.textSecondary} />
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
              error={errors.full_name?.message}
            />
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <ControlledInput
                  control={control}
                  name="phone_number"
                  label="Phone"
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  error={errors.phone_number?.message}
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
                  error={errors.email?.message}
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
                  onPress={() => setShowLocationSelector(true)}
                >
                  <Text style={styles.pickerText}>{location}</Text>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Medical Group</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowGroupSelector(true)}
                >
                  <Text style={styles.pickerText}>
                    {medicalGroup.charAt(0).toUpperCase() + medicalGroup.slice(1).replace('_', ' ')}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
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
                  color={isFavorite ? theme.colors.error : theme.colors.textSecondary}
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

      {/* New Group Modal */}
      <Modal
        visible={showNewGroupModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter group name..."
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
              autoCapitalize="words"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowNewGroupModal(false);
                  setNewGroupName('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCreateButton}
                onPress={() => {
                  if (newGroupName.trim()) {
                    setValue('group', newGroupName.trim().toLowerCase().replace(/\s+/g, '_'));
                    setShowNewGroupModal(false);
                    setNewGroupName('');
                  }
                }}
              >
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Group Selector Modal */}
      <Modal
        visible={showGroupSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Select Medical Group</Text>
            <ScrollView style={styles.groupList}>
              <TouchableOpacity
                style={styles.createGroupOption}
                onPress={() => {
                  setShowGroupSelector(false);
                  setTimeout(() => setShowNewGroupModal(true), 300);
                }}
              >
                <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
                <Text style={[styles.groupOptionText, { color: theme.colors.primary, fontWeight: '600' }]}>
                  Create New Group
                </Text>
              </TouchableOpacity>
              {allGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.groupOption,
                    medicalGroup === group && styles.groupOptionSelected
                  ]}
                  onPress={() => {
                    setValue('group', group);
                    setShowGroupSelector(false);
                    fetchAllGroups(); // Refresh groups after selection
                  }}
                >
                  <Text style={[
                    styles.groupOptionText,
                    medicalGroup === group && styles.groupOptionTextSelected
                  ]}>
                    {group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' ')}
                  </Text>
                  {medicalGroup === group && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowGroupSelector(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Location Selector Modal */}
      <Modal
        visible={showLocationSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <View style={styles.locationList}>
              {LOCATION_OPTIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[
                    styles.groupOption,
                    location === loc && styles.groupOptionSelected
                  ]}
                  onPress={() => {
                    setValue('location', loc);
                    setShowLocationSelector(false);
                  }}
                >
                  <Text style={[
                    styles.groupOptionText,
                    location === loc && styles.groupOptionTextSelected
                  ]}>
                    {loc}
                  </Text>
                  {location === loc && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowLocationSelector(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 48,
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
    backgroundColor: theme.colors.card,
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
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: theme.colors.card,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
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
    color: theme.colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  textAreaInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 80,
    color: theme.colors.text,
  },
  pickerButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50
  },
  pickerText: {
    fontSize: 16,
    color: theme.colors.text,
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
    color: theme.colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  favoriteSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 36,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  modalCreateButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCreateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  groupList: {
    maxHeight: 400,
    width: '100%',
  },
  locationList: {
    width: '100%',
  },
  createGroupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  groupOptionSelected: {
    backgroundColor: theme.colors.primaryMuted,
  },
  groupOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  groupOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

