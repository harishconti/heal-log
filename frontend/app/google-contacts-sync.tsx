/**
 * Google Contacts Sync Screen
 *
 * Allows users to:
 * - Connect their Google account
 * - Import contacts from Google
 * - Review and resolve duplicate contacts
 * - View sync history and status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useGoogleContactsSync } from '@/hooks/useGoogleContactsSync';
import {
  DuplicateRecord,
  DuplicateResolution,
  formatConfidence,
  formatMatchReason,
  getStatusMessage,
} from '@/services/googleContactsService';

export default function GoogleContactsSyncScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const {
    // Connection
    isConnected,
    connectionStatus,
    connectionLoading,
    connectionError,
    connect,
    disconnect,
    refreshConnectionStatus,

    // Sync
    syncJob,
    syncLoading,
    syncError,
    isSyncing,
    startSync,
    cancelSync,

    // Duplicates
    duplicates,
    duplicatesCount,
    duplicatesLoading,
    hasPendingDuplicates,
    loadDuplicates,
    resolveDuplicate,
    skipDuplicate,
    skipAllDuplicates,

    // Helpers
    canSync,
  } = useGoogleContactsSync();

  // Selected duplicate for detail view
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateRecord | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  // Load duplicates when sync completes with duplicates
  useEffect(() => {
    if (syncJob?.status === 'completed' && syncJob.pending_duplicates_count > 0) {
      loadDuplicates();
    }
  }, [syncJob?.status]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message || 'Failed to connect Google account');
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Google Account',
      'This will remove the connection to your Google account. Synced patients will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnect();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to disconnect');
            }
          },
        },
      ]
    );
  };

  const handleStartSync = async () => {
    try {
      const isIncremental = connectionStatus?.last_sync_at != null;
      await startSync(isIncremental);
    } catch (error: any) {
      Alert.alert('Sync Failed', error.message || 'Failed to start sync');
    }
  };

  const handleCancelSync = async () => {
    Alert.alert(
      'Cancel Sync',
      'Are you sure you want to cancel the current sync?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: cancelSync,
        },
      ]
    );
  };

  const handleResolveDuplicate = async (resolution: DuplicateResolution) => {
    if (!selectedDuplicate) return;

    setResolving(true);
    try {
      await resolveDuplicate(selectedDuplicate.id, resolution);
      setSelectedDuplicate(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resolve duplicate');
    } finally {
      setResolving(false);
    }
  };

  const handleSkipDuplicate = async () => {
    if (!selectedDuplicate) return;

    setResolving(true);
    try {
      await skipDuplicate(selectedDuplicate.id);
      setSelectedDuplicate(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to skip duplicate');
    } finally {
      setResolving(false);
    }
  };

  const handleSkipAll = async () => {
    Alert.alert(
      'Skip All Duplicates',
      'This will skip all pending duplicates without importing them. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip All',
          style: 'destructive',
          onPress: async () => {
            try {
              await skipAllDuplicates();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to skip duplicates');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  // Render the connection card
  const renderConnectionCard = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons
          name={isConnected ? 'logo-google' : 'cloud-offline-outline'}
          size={32}
          color={isConnected ? '#4285F4' : '#999'}
        />
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>
            {isConnected ? 'Google Connected' : 'Connect Google Account'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {isConnected
              ? `Connected ${formatDate(connectionStatus?.connected_at || null)}`
              : 'Import contacts from your Google account'}
          </Text>
        </View>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isConnected ? '#2ecc71' : '#e74c3c' },
          ]}
        />
      </View>

      {connectionError && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color="#e74c3c" />
          <Text style={styles.errorText}>{connectionError}</Text>
        </View>
      )}

      {!isConnected ? (
        <TouchableOpacity
          style={[styles.primaryButton, connectionLoading && styles.disabledButton]}
          onPress={handleConnect}
          disabled={connectionLoading}
        >
          {connectionLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="logo-google" size={20} color="#fff" />
          )}
          <Text style={styles.buttonText}>
            {connectionLoading ? 'Connecting...' : 'Connect Google Account'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.connectedInfo}>
          <Text style={styles.statLabel}>Total Synced Patients</Text>
          <Text style={styles.statValue}>{connectionStatus?.total_synced_patients || 0}</Text>
          <Text style={styles.lastSyncText}>
            Last sync: {formatDate(connectionStatus?.last_sync_at || null)}
          </Text>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
            disabled={connectionLoading}
          >
            <Text style={styles.disconnectText}>Disconnect Account</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render the sync card
  const renderSyncCard = () => {
    if (!isConnected) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sync Contacts</Text>

        {syncError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#e74c3c" />
            <Text style={styles.errorText}>{syncError}</Text>
          </View>
        )}

        {isSyncing && syncJob && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>{getStatusMessage(syncJob.status)}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${syncJob.progress_percentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {syncJob.processed_contacts} of {syncJob.total_contacts} contacts
            </Text>
            <View style={styles.progressStats}>
              <Text style={styles.progressStat}>Created: {syncJob.created_patients}</Text>
              <Text style={styles.progressStat}>Updated: {syncJob.updated_patients}</Text>
              <Text style={styles.progressStat}>Duplicates: {syncJob.duplicates_found}</Text>
            </View>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSync}>
              <Text style={styles.cancelText}>Cancel Sync</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isSyncing && (
          <TouchableOpacity
            style={[styles.primaryButton, !canSync && styles.disabledButton]}
            onPress={handleStartSync}
            disabled={!canSync || syncLoading}
          >
            {syncLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="sync" size={20} color="#fff" />
            )}
            <Text style={styles.buttonText}>
              {connectionStatus?.last_sync_at ? 'Sync New Contacts' : 'Import All Contacts'}
            </Text>
          </TouchableOpacity>
        )}

        {syncJob?.status === 'completed' && (
          <View style={styles.completedBox}>
            <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
            <Text style={styles.completedText}>
              Sync completed! Created {syncJob.created_patients}, updated{' '}
              {syncJob.updated_patients} patients.
              {syncJob.duplicates_found > 0 &&
                ` ${syncJob.duplicates_found} duplicates need review.`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render duplicates card
  const renderDuplicatesCard = () => {
    if (!hasPendingDuplicates) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Review Duplicates ({duplicatesCount})</Text>
          <TouchableOpacity onPress={handleSkipAll}>
            <Text style={styles.skipAllText}>Skip All</Text>
          </TouchableOpacity>
        </View>

        {duplicatesLoading ? (
          <ActivityIndicator color="#2ecc71" />
        ) : (
          <View style={styles.duplicatesList}>
            {duplicates.slice(0, 5).map((dup) => (
              <TouchableOpacity
                key={dup.id}
                style={styles.duplicateItem}
                onPress={() => setSelectedDuplicate(dup)}
              >
                <View style={styles.duplicateInfo}>
                  <Text style={styles.duplicateName}>
                    {dup.google_contact.name}
                  </Text>
                  <Text style={styles.duplicatePhone}>
                    {dup.google_contact.phone || dup.google_contact.email || 'No contact info'}
                  </Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {formatConfidence(dup.highest_confidence)} match
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
            {duplicatesCount > 5 && (
              <TouchableOpacity style={styles.viewMoreButton} onPress={loadDuplicates}>
                <Text style={styles.viewMoreText}>
                  View all {duplicatesCount} duplicates
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render duplicate detail modal
  const renderDuplicateModal = () => (
    <Modal
      visible={selectedDuplicate !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSelectedDuplicate(null)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setSelectedDuplicate(null)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Resolve Duplicate</Text>
          <View style={styles.modalCloseButton} />
        </View>

        {selectedDuplicate && (
          <ScrollView style={styles.modalContent}>
            {/* Google Contact */}
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonHeader}>
                <Ionicons name="logo-google" size={24} color="#4285F4" />
                <Text style={styles.comparisonTitle}>Google Contact</Text>
              </View>
              <Text style={styles.comparisonName}>
                {selectedDuplicate.google_contact.name}
              </Text>
              {selectedDuplicate.google_contact.phone && (
                <Text style={styles.comparisonDetail}>
                  {selectedDuplicate.google_contact.phone}
                </Text>
              )}
              {selectedDuplicate.google_contact.email && (
                <Text style={styles.comparisonDetail}>
                  {selectedDuplicate.google_contact.email}
                </Text>
              )}
            </View>

            {/* Match Info */}
            <View style={styles.matchInfo}>
              <Text style={styles.matchConfidence}>
                {formatConfidence(selectedDuplicate.highest_confidence)} match confidence
              </Text>
              <View style={styles.matchReasons}>
                {selectedDuplicate.match_reasons.map((reason, idx) => (
                  <View key={idx} style={styles.matchReasonBadge}>
                    <Text style={styles.matchReasonText}>
                      {formatMatchReason(reason)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Matched Patient */}
            {selectedDuplicate.matched_patients[0] && (
              <View style={styles.comparisonCard}>
                <View style={styles.comparisonHeader}>
                  <Ionicons name="person" size={24} color="#2ecc71" />
                  <Text style={styles.comparisonTitle}>Existing Patient</Text>
                </View>
                <Text style={styles.comparisonName}>
                  {selectedDuplicate.matched_patients[0].patient_name}
                </Text>
                {selectedDuplicate.matched_patients[0].patient_phone && (
                  <Text style={styles.comparisonDetail}>
                    {selectedDuplicate.matched_patients[0].patient_phone}
                  </Text>
                )}
                {selectedDuplicate.matched_patients[0].patient_email && (
                  <Text style={styles.comparisonDetail}>
                    {selectedDuplicate.matched_patients[0].patient_email}
                  </Text>
                )}
              </View>
            )}

            {/* Resolution Options */}
            <View style={styles.resolutionOptions}>
              <TouchableOpacity
                style={[styles.resolutionButton, styles.keepButton]}
                onPress={() => handleResolveDuplicate('keep_existing')}
                disabled={resolving}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.resolutionButtonText}>Keep Existing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resolutionButton, styles.replaceButton]}
                onPress={() => handleResolveDuplicate('replace')}
                disabled={resolving}
              >
                <Ionicons name="swap-horizontal" size={20} color="#fff" />
                <Text style={styles.resolutionButtonText}>Replace with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resolutionButton, styles.createButton]}
                onPress={() => handleResolveDuplicate('create_new')}
                disabled={resolving}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.resolutionButtonText}>Create New Patient</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resolutionButton, styles.skipButton]}
                onPress={handleSkipDuplicate}
                disabled={resolving}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
                <Text style={[styles.resolutionButtonText, { color: '#666' }]}>
                  Skip
                </Text>
              </TouchableOpacity>
            </View>

            {resolving && (
              <ActivityIndicator
                color="#2ecc71"
                size="large"
                style={styles.resolvingIndicator}
              />
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Google Contacts Sync</Text>
        <TouchableOpacity onPress={refreshConnectionStatus} style={styles.headerButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderConnectionCard()}
        {renderSyncCard()}
        {renderDuplicatesCard()}

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.infoItem}>
            <Ionicons name="cloud-download-outline" size={24} color="#3498db" />
            <Text style={styles.infoText}>
              Connect your Google account to import contacts as patients
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="git-compare-outline" size={24} color="#3498db" />
            <Text style={styles.infoText}>
              Duplicates are detected automatically and can be reviewed
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="sync-outline" size={24} color="#3498db" />
            <Text style={styles.infoText}>
              Sync again anytime to import new contacts
            </Text>
          </View>
        </View>
      </ScrollView>

      {renderDuplicateModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16,
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdeaea',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    flex: 1,
  },
  connectedInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginVertical: 8,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  disconnectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  disconnectText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ecc71',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  progressStat: {
    fontSize: 12,
    color: '#666',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f8f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  completedText: {
    color: '#2ecc71',
    fontSize: 14,
    flex: 1,
  },
  skipAllText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  duplicatesList: {
    gap: 8,
  },
  duplicateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  duplicateInfo: {
    flex: 1,
  },
  duplicateName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  duplicatePhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#856404',
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewMoreText: {
    color: '#3498db',
    fontSize: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    padding: 8,
    width: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  comparisonCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  comparisonName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  comparisonDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  matchInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  matchConfidence: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f39c12',
    marginBottom: 8,
  },
  matchReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  matchReasonBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchReasonText: {
    fontSize: 12,
    color: '#1976d2',
  },
  resolutionOptions: {
    gap: 12,
    marginTop: 24,
  },
  resolutionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  resolutionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  keepButton: {
    backgroundColor: '#2ecc71',
  },
  replaceButton: {
    backgroundColor: '#3498db',
  },
  createButton: {
    backgroundColor: '#9b59b6',
  },
  skipButton: {
    backgroundColor: '#e0e0e0',
  },
  resolvingIndicator: {
    marginTop: 24,
  },
});
