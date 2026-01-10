import React, { useState, useCallback, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { TabBar, TabItem } from '@/components/ui/TabBar';
import { Button } from '@/components/ui/Button';

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
import { triggerChangeBasedSync } from '@/services/backgroundSync';

const TABS: TabItem[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'history', label: 'History' },
  { key: 'notes', label: 'Notes' },
];

function PatientDetailsScreen({ patient, notes }) {
  const { theme, fontScale } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const settings = useAppStore((state) => state.settings);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('initial');
  const [activeTab, setActiveTab] = useState('overview');

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
      setTimeout(() => {
        setVisibleNotesCount(prev => Math.min(prev + NOTES_PAGE_SIZE, notes?.length || 0));
        setIsLoadingMore(false);
      }, 100);
    }
  }, [hasMoreNotes, isLoadingMore, notes?.length]);

  const styles = createStyles(theme, fontScale);

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
      // Trigger immediate sync after favorite toggle
      triggerChangeBasedSync();
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

  const sendMessage = (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'No phone number available');
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`sms:${phoneNumber}`);
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
      // Trigger immediate sync after adding note
      triggerChangeBasedSync();
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
              // Trigger immediate sync after deleting note
              triggerChangeBasedSync();
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
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Unknown Date';
    }
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
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const renderOverviewTab = () => (
    <>
      {/* Contact & Demographics Card */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="person-outline" size={18} color={theme.colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Contact & Demographics</Text>
        </View>

        {patient.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="phone-portrait-outline" size={18} color={theme.colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>MOBILE</Text>
              <Text style={styles.infoValue}>{patient.phone}</Text>
            </View>
          </View>
        )}

        {patient.email && (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={theme.colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>EMAIL</Text>
              <Text style={styles.infoValue}>{patient.email}</Text>
            </View>
          </View>
        )}

        {patient.location && (
          <View style={styles.infoRow}>
            <Ionicons name="medical-outline" size={18} color={theme.colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>CARE SETTING</Text>
              <Text style={styles.infoValue}>{patient.location}</Text>
            </View>
          </View>
        )}

        {patient.address && (
          <View style={styles.infoRow}>
            <Ionicons name="home-outline" size={18} color={theme.colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>HOME ADDRESS</Text>
              <Text style={styles.infoValue}>{patient.address}</Text>
            </View>
          </View>
        )}

        {patient.emergencyContact && (
          <View style={[styles.infoRow, styles.emergencyRow]}>
            <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.error }]}>EMERGENCY CONTACT</Text>
              <Text style={styles.infoValue}>{patient.emergencyContact}</Text>
            </View>
          </View>
        )}
      </Card>

      {/* Diagnoses Card */}
      {patient.initialDiagnosis && (
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="medkit-outline" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Diagnoses</Text>
          </View>
          <View style={styles.chipRow}>
            <Chip
              label={patient.initialDiagnosis}
              variant="soft"
              color="default"
              size="medium"
            />
          </View>
        </Card>
      )}

      {/* Initial Complaint Card */}
      {patient.initialComplaint && (
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="clipboard-outline" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Initial Complaint</Text>
          </View>
          <Text style={styles.treatmentText}>{patient.initialComplaint}</Text>
        </Card>
      )}

      {/* Active Treatment Plan */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.primaryMuted }]}>
            <Ionicons name="checkbox-outline" size={18} color={theme.colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Active Treatment Plan</Text>
        </View>
        <Text style={styles.treatmentText}>
          {patient.activeTreatmentPlan || 'No active treatment plan specified.'}
        </Text>
      </Card>
    </>
  );

  const renderHistoryTab = () => (
    <Card style={styles.sectionCard}>
      <View style={styles.emptyState}>
        <Ionicons name="time-outline" size={48} color={theme.colors.border} />
        <Text style={styles.emptyStateText}>Medical history will appear here</Text>
        <Text style={styles.emptyStateSubtext}>Track patient visits and treatments over time</Text>
      </View>
    </Card>
  );

  const renderNotesTab = () => (
    <>
      <View style={styles.notesHeader}>
        <Text style={styles.notesCount}>Medical Notes ({notes?.length || 0})</Text>
        <TouchableOpacity
          style={styles.addNoteButton}
          onPress={() => {
            triggerHaptic();
            setShowAddNote(true);
          }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {notes && notes.length > 0 ? (
        notes.map((note: any) => (
          <TouchableOpacity
            key={note.id}
            activeOpacity={0.7}
            onLongPress={() => deleteNote(note.id)}
            delayLongPress={500}
          >
            <Card style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <View style={styles.noteHeaderLeft}>
                  <Chip
                    label={note.visitType}
                    variant="soft"
                    color="primary"
                    size="small"
                  />
                  <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
                </View>
              </View>
              <Text style={styles.noteContent}>{note.content}</Text>
              <Text style={styles.longPressHint}>Long press to delete</Text>
            </Card>
          </TouchableOpacity>
        ))
      ) : (
        <Card style={styles.sectionCard}>
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={theme.colors.border} />
            <Text style={styles.emptyStateText}>No notes yet</Text>
            <Text style={styles.emptyStateSubtext}>Add notes to track patient progress</Text>
          </View>
        </Card>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic();
            router.back();
          }}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Profile</Text>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic();
            router.push(`/edit-patient/${patient.id}`);
          }}
          style={styles.headerButton}
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Profile Header */}
        <View style={styles.profileHeader}>
          {/* Avatar with status indicator */}
          <View style={styles.avatarContainer}>
            {patient.photo ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${patient.photo}` }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={theme.colors.textSecondary} />
              </View>
            )}
            <View style={styles.statusIndicator} />
          </View>

          {/* Patient Name and Info */}
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientMeta}>
            ID: #{patient.patientId} • {patient.group || 'General Group'}
          </Text>

          {/* Age/Gender Chips */}
          <View style={styles.chipRow}>
            {patient.yearOfBirth && (
              <Chip
                label={`${new Date().getFullYear() - patient.yearOfBirth} Yrs`}
                variant="outlined"
                color="default"
                size="small"
              />
            )}
            {patient.gender && (
              <Chip
                label={patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                variant="outlined"
                color="default"
                size="small"
              />
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => makeCall(patient.phone)}
            >
              <Ionicons name="call-outline" size={24} color={theme.colors.text} />
              <Text style={styles.quickActionText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => sendMessage(patient.phone)}
            >
              <Ionicons name="mail-outline" size={24} color={theme.colors.text} />
              <Text style={styles.quickActionText}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push(`/edit-patient/${patient.id}`)}
            >
              <Ionicons name="create-outline" size={24} color={theme.colors.text} />
              <Text style={styles.quickActionText}>Edit Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <TabBar
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="underline"
          style={styles.tabBar}
        />

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'notes' && renderNotesTab()}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <Button
          title="Schedule"
          onPress={() => Alert.alert('Schedule', 'Scheduling feature coming soon')}
          variant="outline"
          icon="calendar-outline"
          fullWidth={false}
          style={styles.scheduleButton}
        />
        <Button
          title="Add Log Entry"
          onPress={() => {
            triggerHaptic();
            setShowAddNote(true);
          }}
          icon="add"
          fullWidth={false}
          style={styles.addLogButton}
        />
      </View>

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
                    onPress={() => setNewNoteType(type)}
                  >
                    <Chip
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                      variant={newNoteType === type ? 'filled' : 'soft'}
                      color={newNoteType === type ? 'primary' : 'default'}
                      size="medium"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note Content</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Enter medical note..."
                placeholderTextColor={theme.colors.textSecondary}
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
    Q.where('patient_id', id),
    Q.sortBy('created_at', Q.desc)
  ).observe(),
}));

const EnhancedPatientDetails = enhance(PatientDetailsScreen);

export default function PatientDetailsContainer() {
  const { id } = useLocalSearchParams();
  return <EnhancedPatientDetails id={id} />;
}

const createStyles = (theme: any, fontScale: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
  },
  editText: {
    fontSize: 16 * fontScale,
    color: theme.colors.primary,
    fontWeight: '500',
    textAlign: 'right',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.success,
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  patientName: {
    fontSize: 24 * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  patientMeta: {
    fontSize: 14 * fontScale,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 8,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 4,
  },
  quickActionText: {
    fontSize: 12 * fontScale,
    color: theme.colors.textSecondary,
  },
  tabBar: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
  },
  tabContent: {
    padding: 16,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  emergencyRow: {
    borderBottomWidth: 0,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11 * fontScale,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15 * fontScale,
    color: theme.colors.text,
  },
  treatmentText: {
    fontSize: 14 * fontScale,
    color: theme.colors.textSecondary,
    lineHeight: 22 * fontScale,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16 * fontScale,
    color: theme.colors.text,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14 * fontScale,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notesCount: {
    fontSize: 16 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
  },
  addNoteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteCard: {
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noteDate: {
    fontSize: 12 * fontScale,
    color: theme.colors.textSecondary,
  },
  noteContent: {
    fontSize: 14 * fontScale,
    color: theme.colors.text,
    lineHeight: 22 * fontScale,
  },
  longPressHint: {
    fontSize: 11 * fontScale,
    color: theme.colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  scheduleButton: {
    flex: 0.4,
  },
  addLogButton: {
    flex: 0.6,
  },
  // Modal Styles
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  modalCancel: {
    fontSize: 16 * fontScale,
    color: theme.colors.error,
  },
  modalTitle: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalSave: {
    fontSize: 16 * fontScale,
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
    fontSize: 14 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  visitTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noteInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    fontSize: 16 * fontScale,
    minHeight: 150,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
});
