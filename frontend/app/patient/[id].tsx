import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  Linking,
  Clipboard,
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Constants for lazy loading
const NOTES_PAGE_SIZE = 20;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// WatermelonDB imports
import { database } from '@/models/database';
import Patient from '@/models/Patient';
import PatientNote from '@/models/PatientNote';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { NoteService } from '@/services/note_service';

function PatientDetailsScreen({ patient, notes }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const settings = useAppStore((state) => state.settings);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('initial');

  // Lazy loading state for notes
  const [visibleNotesCount, setVisibleNotesCount] = useState(NOTES_PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Memoized visible notes for lazy loading
  const visibleNotes = useMemo(() => {
    if (!notes) return [];
    return notes.slice(0, visibleNotesCount);
  }, [notes, visibleNotesCount]);

  const hasMoreNotes = notes && notes.length > visibleNotesCount;

  // Load more notes handler
  const loadMoreNotes = useCallback(() => {
    if (hasMoreNotes && !isLoadingMore) {
      setIsLoadingMore(true);
      // Simulate async loading for smooth UX
      setTimeout(() => {
        setVisibleNotesCount(prev => Math.min(prev + NOTES_PAGE_SIZE, notes?.length || 0));
        setIsLoadingMore(false);
      }, 100);
    }
  }, [hasMoreNotes, isLoadingMore, notes?.length]);

  const styles = createStyles(theme);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (settings.hapticEnabled) {
      Haptics.impactAsync(style);
    }
  };

  const toggleFavorite = async () => {
    if (!patient) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await database.write(async () => {
        await patient.update(p => {
          p.isFavorite = !p.isFavorite;
        });
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const makeCall = (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'No phone number available');
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const addNote = async () => {
    if (!patient || !newNote.trim()) return;
    try {
      await database.write(async () => {
        await database.collections.get<PatientNote>('clinical_notes').create(note => {
          note.patientId = patient.id;
          note.content = newNote.trim();
          note.visitType = newNoteType;
          note.userId = user?.id || 'unknown';
          note.createdAt = new Date();
          note.updatedAt = new Date();
        });
      });
      setNewNote('');
      setShowAddNote(false);
      if (settings.hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      Alert.alert('Error', 'Failed to add note');
    }
  };

  const deleteNote = (noteId: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await NoteService.deleteNote(noteId);
              if (settings.hapticEnabled) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error('Failed to delete note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    // Defensive check: if date is invalid or epoch (Jan 1, 1970), show fallback
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Unknown Date';
    }
    // Check if date is before year 2000 (likely corrupt/epoch data)
    if (date.getFullYear() < 2000) {
      return 'Unknown Date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2ecc71" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          triggerHaptic();
          router.back();
        }} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Details</Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
          <Ionicons
            name={patient.isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={patient.isFavorite ? '#e74c3c' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Patient Info Card */}
        <View style={styles.patientCard}>
          <View style={styles.patientHeader}>
            {patient.photo ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${patient.photo}` }}
                style={styles.patientPhoto}
              />
            ) : (
              <View style={styles.patientPhotoPlaceholder}>
                <Ionicons name="person" size={48} color="#666" />
              </View>
            )}

            <View style={styles.patientBasicInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientId}>ID: {patient.patientId}</Text>
              <View style={styles.groupBadge}>
                <Text style={styles.groupText}>{patient.group || 'General'}</Text>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            {patient.phone && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => makeCall(patient.phone)}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={20} color="#2ecc71" />
                <Text style={[styles.contactText, { flex: 1 }]}>{patient.phone}</Text>
                <View style={styles.callButton}>
                  <Ionicons name="call-outline" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
            {patient.email && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => {
                  Clipboard.setString(patient.email);
                  triggerHaptic();
                  Alert.alert('Copied', 'Email address copied to clipboard');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="mail" size={20} color="#3498db" />
                <Text style={[styles.contactText, { flex: 1 }]}>{patient.email}</Text>
                <View style={[styles.callButton, { backgroundColor: '#3498db' }]}>
                  <Ionicons name="copy-outline" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
            {patient.address && (
              <View style={styles.contactItem}>
                <Ionicons name="location" size={20} color="#f39c12" />
                <Text style={styles.contactText}>{patient.address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.medicalCard}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <View style={styles.medicalItem}>
            <Text style={styles.medicalLabel}>Location:</Text>
            <Text style={styles.medicalValue}>{patient.location || 'Not specified'}</Text>
          </View>
          <View style={styles.medicalItem}>
            <Text style={styles.medicalLabel}>Initial Complaint:</Text>
            <Text style={styles.medicalValue}>{patient.initialComplaint || 'Not specified'}</Text>
          </View>
          <View style={styles.medicalItem}>
            <Text style={styles.medicalLabel}>Initial Diagnosis:</Text>
            <Text style={styles.medicalValue}>{patient.initialDiagnosis || 'Not specified'}</Text>
          </View>
        </View>

        {/* Notes Section - Virtualized with FlashList for performance */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Text style={styles.sectionTitle}>Medical Notes ({notes?.length || 0})</Text>
            <TouchableOpacity
              style={styles.addNoteButton}
              onPress={() => {
                triggerHaptic();
                setShowAddNote(true);
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {notes && notes.length > 0 ? (
            <View>
              {notes.map((note: any) => (
                <View key={note.id} style={styles.noteItem}>
                  <View style={styles.noteHeader}>
                    <View style={styles.noteHeaderLeft}>
                      <Text style={styles.noteType}>{note.visitType}</Text>
                      <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteNoteButton}
                      onPress={() => deleteNote(note.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.noteContent}>{note.content}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyNotes}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyNotesText}>No notes yet</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              triggerHaptic();
              router.push(`/edit-patient/${patient.id}`);
            }}
          >
            <Ionicons name="create" size={20} color="#fff" />
            <Text style={styles.buttonText}>Edit Patient</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Note Modal */}
      <Modal
        visible={showAddNote}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddNote(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddNote(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TouchableOpacity onPress={addNote}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Visit Type</Text>
              <View style={styles.visitTypeButtons}>
                {['initial', 'follow-up', 'regular', 'emergency'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.visitTypeButton,
                      newNoteType === type && styles.activeVisitType
                    ]}
                    onPress={() => setNewNoteType(type)}
                  >
                    <Text style={[
                      styles.visitTypeText,
                      newNoteType === type && styles.activeVisitTypeText
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note Content</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Enter medical note..."
                value={newNote}
                onChangeText={setNewNote}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const enhance = withObservables(['id'], ({ id }) => ({
  patient: database.collections.get<Patient>('patients').findAndObserve(id),
  notes: database.collections.get<PatientNote>('clinical_notes').query(
    Q.where('patient_id', id)
  ).observe(),
}));

const EnhancedPatientDetails = enhance(PatientDetailsScreen);

export default function PatientDetailsContainer() {
  const { id } = useLocalSearchParams();
  return <EnhancedPatientDetails id={id} />;
}



const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.error,
    marginVertical: 16,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  scrollContent: {
    paddingBottom: 32,
  },
  patientCard: {
    backgroundColor: theme.colors.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  patientPhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientBasicInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  patientId: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  groupBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  groupText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  contactSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicalCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  medicalItem: {
    marginBottom: 12,
  },
  medicalLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  medicalValue: {
    fontSize: 16,
    color: theme.colors.text,
  },
  notesCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addNoteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteItem: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  deleteNoteButton: {
    padding: 4,
  },
  noteType: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  noteDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  noteContent: {
    fontSize: 16,
    color: theme.colors.text,
  },
  emptyNotes: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyNotesText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyNotesSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  notesListContainer: {
    minHeight: 100,
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
  },
  loadMoreText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    paddingHorizontal: 16,
  },
  editButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  upgradeTextContainer: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  modalCancel: {
    fontSize: 16,
    color: theme.colors.error,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalSave: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  visitTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  visitTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  activeVisitType: {
    backgroundColor: theme.colors.primary,
  },
  visitTypeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  activeVisitTypeText: {
    color: '#fff',
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
});
