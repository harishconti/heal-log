import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientFormSchema, PatientFormValues } from '@/lib/validation';
import { ControlledInput } from './ControlledInput';

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

const LOCATIONS = [
  'Clinic',
  'Home Visit',
  'Hospital',
  'Emergency',
  'Telemedicine'
];

// Maximum image size in bytes (2MB) - prevents memory issues and DoS
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_SIZE_MB = 2;

export interface PatientFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<PatientFormValues>;
  onSubmit: (data: PatientFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  submitButtonText?: string;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  mode,
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  submitButtonText
}) => {
  const { theme } = useTheme();
  const { settings } = useAppStore();
  
  const { control, handleSubmit, formState: { errors, isDirty }, setValue, watch } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: initialData.name || '',
      phone: initialData.phone || '',
      email: initialData.email || '',
      address: initialData.address || '',
      location: initialData.location || 'Clinic',
      initial_complaint: initialData.initial_complaint || '',
      initial_diagnosis: initialData.initial_diagnosis || '',
      photo: initialData.photo || '',
      group: initialData.group || 'general',
      is_favorite: initialData.is_favorite || false
    }
  });

  const photo = watch('photo');
  const isFavorite = watch('is_favorite');
  const location = watch('location');
  const group = watch('group');

  const updateFormData = async (field: keyof PatientFormValues, value: string | boolean) => {
    setValue(field, value, { shouldDirty: true });
    
    if (settings.hapticEnabled) {
      try {
        await Haptics.selectionAsync();
      } catch (error) {
        // Haptic feedback is optional
      }
    }
  };

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
      base64: true
    });

    if (!result.canceled && result.assets[0].base64) {
      // Validate image size (base64 is ~33% larger than binary)
      const base64Size = result.assets[0].base64.length * 0.75;
      if (base64Size > MAX_IMAGE_SIZE_BYTES) {
        Alert.alert(
          'Image Too Large',
          `Please select an image smaller than ${MAX_IMAGE_SIZE_MB}MB. The selected image is approximately ${(base64Size / (1024 * 1024)).toFixed(1)}MB.`
        );
        return;
      }
      await updateFormData('photo', result.assets[0].base64);
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
      base64: true
    });

    if (!result.canceled && result.assets[0].base64) {
      // Validate image size (base64 is ~33% larger than binary)
      const base64Size = result.assets[0].base64.length * 0.75;
      if (base64Size > MAX_IMAGE_SIZE_BYTES) {
        Alert.alert(
          'Image Too Large',
          `The photo is too large (${(base64Size / (1024 * 1024)).toFixed(1)}MB). Please try again with lower quality settings.`
        );
        return;
      }
      await updateFormData('photo', result.assets[0].base64);
    }
  };

  const showImagePicker = () => {
    const options = [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' as const }
    ];

    if (photo && mode === 'edit') {
      options.splice(2, 0, { 
        text: 'Remove Photo', 
        onPress: () => updateFormData('photo', ''),
        style: 'destructive' as const
      });
    }

    Alert.alert(
      mode === 'edit' ? 'Update Photo' : 'Add Photo',
      'Choose how to add patient photo',
      options
    );
  };

  const showLocationPicker = () => {
    Alert.alert(
      'Visit Location',
      'Select visit location',
      LOCATIONS.map(location => ({
        text: location,
        onPress: () => updateFormData('location', location)
      }))
    );
  };

  const showGroupPicker = () => {
    Alert.alert(
      'Medical Group',
      'Select medical specialty',
      MEDICAL_GROUPS.map(group => ({
        text: group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' '),
        onPress: () => updateFormData('group', group)
      }))
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo Section */}
        <View style={[styles.photoSection, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity style={styles.photoContainer} onPress={showImagePicker}>
            {photo ? (
              <Image 
                source={{ uri: `data:image/jpeg;base64,${photo}` }}
                style={styles.patientPhoto}
              />
            ) : (
              <View style={[styles.photoPlaceholder, { borderColor: theme.colors.border }]}>
                <Ionicons name="camera" size={32} color={theme.colors.textSecondary} />
                <Text style={[styles.photoText, { color: theme.colors.textSecondary }]}>
                  {mode === 'edit' ? 'Update Photo' : 'Add Photo'}
                </Text>
              </View>
            )}
            {mode === 'edit' && photo && (
              <View style={[styles.photoOverlay, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Basic Information</Text>
          
          <ControlledInput
            control={control}
            name="name"
            label="Full Name *"
            placeholder="Enter patient's full name"
            error={errors.name?.message}
          />

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <ControlledInput
                control={control}
                name="phone"
                label="Phone"
                placeholder="Phone number"
                keyboardType="phone-pad"
                error={errors.phone?.message}
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
            error={errors.address?.message}
          />
        </View>

        {/* Medical Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Medical Information</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Location</Text>
              <TouchableOpacity 
                style={[styles.pickerButton, { 
                  backgroundColor: theme.colors.background, 
                  borderColor: theme.colors.border 
                }]}
                onPress={showLocationPicker}
              >
                <Text style={[styles.pickerText, { color: theme.colors.text }]}>
                  {location}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputHalf}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Medical Group</Text>
              <TouchableOpacity 
                style={[styles.pickerButton, { 
                  backgroundColor: theme.colors.background, 
                  borderColor: theme.colors.border 
                }]}
                onPress={showGroupPicker}
              >
                <Text style={[styles.pickerText, { color: theme.colors.text }]}>
                  {group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' ')}
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
            error={errors.initial_complaint?.message}
          />

          <ControlledInput
            control={control}
            name="initial_diagnosis"
            label="Initial Diagnosis"
            placeholder="Enter initial diagnosis or assessment..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            error={errors.initial_diagnosis?.message}
          />
        </View>

        {/* Options */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Options</Text>
          
          <TouchableOpacity 
            style={styles.favoriteOption}
            onPress={() => updateFormData('is_favorite', !isFavorite)}
          >
            <View style={styles.favoriteLeft}>
              <Ionicons 
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24} 
                color={isFavorite ? theme.colors.error : theme.colors.textSecondary}
              />
              <Text style={[styles.favoriteText, { color: theme.colors.text }]}>Mark as Favorite</Text>
            </View>
            <Text style={[styles.favoriteSubtext, { color: theme.colors.textSecondary }]}>
              Favorite patients appear at the top of your list
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: theme.colors.textSecondary }]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.submitButton, 
              { backgroundColor: theme.colors.primary },
              (!isDirty || loading) && styles.disabledButton
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : (submitButtonText || (mode === 'edit' ? 'Save Changes' : 'Add Patient'))}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 12,
    marginTop: 4,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textAreaInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 80,
  },
  pickerButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
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
    marginLeft: 12,
    fontWeight: '500',
  },
  favoriteSubtext: {
    fontSize: 14,
    marginLeft: 36,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});