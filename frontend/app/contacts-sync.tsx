import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PatientService } from '@/services/patient_service';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';

interface PatientContactData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  patient_id: string;
  group?: string;
}

export default function ContactsSyncScreen() {
  const { isAuthenticated } = useAuth();
  const { theme, fontScale } = useTheme();
  const router = useRouter();

  const [patients, setPatients] = useState<PatientContactData[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [callLogs, setCallLogs] = useState([]);
  const [phoneSupported, setPhoneSupported] = useState(false);
  const [smsSupported, setSmsSupported] = useState(false);

  const styles = createStyles(theme, fontScale);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    loadPatients();
    loadScreenData();
    checkPhoneCapabilities();
  }, [isAuthenticated]);

  const loadPatients = async () => {
    try {
      setPatientsLoading(true);
      const fetchedPatients = await PatientService.getPatients();
      const patientData: PatientContactData[] = fetchedPatients.map(p => ({
        id: p.id,
        name: p.name,
        phone: p.phone || '',
        email: p.email || '',
        patient_id: p.patientId || '',
        group: p.group || 'general',
      }));
      setPatients(patientData);
    } catch (error) {
      console.error('Error loading patients:', error);
      Alert.alert('Error', 'Failed to load patients. Please try again.');
    } finally {
      setPatientsLoading(false);
    }
  };

  const loadScreenData = async () => {
    try {
      const syncSetting = await AsyncStorage.getItem('contacts_sync_enabled');
      setSyncEnabled(syncSetting === 'true');

      const lastSync = await AsyncStorage.getItem('medical_contacts_synced');
      setLastSyncTime(lastSync);

      try {
        const { PhoneIntegration } = await import('@/utils/phoneIntegration');
        const logs = await PhoneIntegration.getCallLogs();
        setCallLogs(logs.slice(0, 10));
      } catch (phoneError) {
        console.error('Error loading phone integration module:', phoneError);
      }
    } catch (error) {
      console.error('Error loading screen-specific data:', error);
    }
  };

  const checkPhoneCapabilities = async () => {
    try {
      const { PhoneIntegration } = await import('../utils/phoneIntegration');

      const [canCall, canSMS] = await Promise.all([
        PhoneIntegration.canMakePhoneCalls(),
        PhoneIntegration.canSendSMS()
      ]);

      setPhoneSupported(canCall);
      setSmsSupported(canSMS);
    } catch (error) {
      console.error('Error checking phone capabilities:', error);
      setPhoneSupported(false);
      setSmsSupported(false);
    }
  };

  const handleSyncContacts = async () => {
    try {
      setSyncing(true);

      let PhoneIntegration;
      try {
        const module = await import('../utils/phoneIntegration');
        PhoneIntegration = module.PhoneIntegration;
      } catch (importError) {
        console.error('Failed to load phone integration module:', importError);
        Alert.alert('Error', 'Phone integration is not available on this device.');
        return;
      }

      const contactData = patients
        .filter(p => p.phone)
        .map(p => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          email: p.email || '',
          patient_id: p.patient_id,
          group: p.group || 'general'
        }));

      const success = await PhoneIntegration.syncContactsToDevice(contactData);

      if (success) {
        Alert.alert(
          'Success',
          `Successfully synced ${contactData.length} medical contacts to your device. You will now see patient names when they call.`,
          [{ text: 'OK' }]
        );

        await AsyncStorage.setItem('contacts_sync_enabled', 'true');
        setSyncEnabled(true);
        await loadScreenData();
      } else {
        Alert.alert(
          'Sync Failed',
          'Failed to sync contacts. Please check permissions and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while syncing contacts');
    } finally {
      setSyncing(false);
    }
  };

  const handleRemoveContacts = async () => {
    Alert.alert(
      'Remove Medical Contacts',
      'This will remove all medical contacts from your device contacts. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setSyncing(true);

              let PhoneIntegration;
              try {
                const module = await import('@/utils/phoneIntegration');
                PhoneIntegration = module.PhoneIntegration;
              } catch (importError) {
                console.error('Failed to load phone integration module:', importError);
                Alert.alert('Error', 'Phone integration is not available on this device.');
                setSyncing(false);
                return;
              }

              const success = await PhoneIntegration.removeContactsFromDevice();

              if (success) {
                Alert.alert('Success', 'Medical contacts removed from device');
                await AsyncStorage.setItem('contacts_sync_enabled', 'false');
                setSyncEnabled(false);
                await loadScreenData();
              } else {
                Alert.alert('Error', 'Failed to remove contacts');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred while removing contacts');
            } finally {
              setSyncing(false);
            }
          }
        }
      ]
    );
  };

  const formatCallTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (patientsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading contacts data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const patientsWithPhone = patients.filter(p => p.phone).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contacts Integration</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusIconContainer}>
              <Ionicons name="phone-portrait-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Device Integration</Text>
              <Text style={styles.statusSubtitle}>
                {syncEnabled ? 'Medical contacts synced' : 'Contacts not synced'}
              </Text>
            </View>
            <Chip
              label={syncEnabled ? 'Active' : 'Inactive'}
              variant="filled"
              color={syncEnabled ? 'success' : 'error'}
              size="small"
            />
          </View>

          {lastSyncTime && (
            <Text style={styles.lastSyncText}>
              Last synced: {new Date(lastSyncTime).toLocaleString()}
            </Text>
          )}
        </Card>

        {/* Sync Management Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="sync-outline" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Sync Management</Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Syncing adds your medical patients to your device contacts, enabling caller ID when they call.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.syncButton, syncing && styles.disabledButton]}
            onPress={handleSyncContacts}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="sync" size={20} color="#fff" />
            )}
            <Text style={styles.buttonText}>
              {syncing ? 'Syncing...' : 'Sync Contacts'}
            </Text>
          </TouchableOpacity>

          {syncEnabled && (
            <TouchableOpacity
              style={[styles.removeButton, syncing && styles.disabledButton]}
              onPress={handleRemoveContacts}
              disabled={syncing}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.buttonText}>Remove Contacts</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.syncCount}>
            {patientsWithPhone} patients with phone numbers
          </Text>
        </Card>

        {/* Device Capabilities Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="hardware-chip-outline" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Device Capabilities</Text>
          </View>

          <View style={styles.capabilityRow}>
            <Ionicons
              name={phoneSupported ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={phoneSupported ? theme.colors.success : theme.colors.error}
            />
            <Text style={styles.capabilityText}>Phone Calls</Text>
          </View>

          <View style={[styles.capabilityRow, styles.capabilityRowLast]}>
            <Ionicons
              name={smsSupported ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={smsSupported ? theme.colors.success : theme.colors.error}
            />
            <Text style={styles.capabilityText}>SMS Messages</Text>
          </View>
        </Card>

        {/* Recent Calls Card */}
        {callLogs.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="call-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Recent Patient Calls</Text>
            </View>

            {callLogs.map((call, index) => (
              <View key={index} style={[styles.callLogItem, index === callLogs.length - 1 && styles.callLogItemLast]}>
                <View style={styles.callInfo}>
                  <Ionicons name="call-outline" size={20} color={theme.colors.success} />
                  <View style={styles.callDetails}>
                    <Text style={styles.callPatient}>{call.patientName}</Text>
                    <Text style={styles.callPhone}>{call.phone}</Text>
                  </View>
                </View>
                <Text style={styles.callTime}>{formatCallTime(call.timestamp)}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Instructions Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="help-circle-outline" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>How It Works</Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Tap "Sync Contacts" to add your medical patients to your device contacts
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              When patients call, you'll see their name and patient ID on caller ID
            </Text>
          </View>

          <View style={[styles.instructionItem, styles.instructionItemLast]}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Use "Remove Contacts" if you want to clear medical contacts from your device
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
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
  loadingText: {
    marginTop: 16,
    fontSize: 16 * fontScale,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusSubtitle: {
    fontSize: 14 * fontScale,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  lastSyncText: {
    fontSize: 12 * fontScale,
    color: theme.colors.textSecondary,
    marginTop: 12,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primaryMuted,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    fontSize: 14 * fontScale,
    color: theme.colors.primary,
    flex: 1,
  },
  syncButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  removeButton: {
    backgroundColor: theme.colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16 * fontScale,
    fontWeight: '600',
  },
  syncCount: {
    fontSize: 12 * fontScale,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  capabilityRowLast: {
    borderBottomWidth: 0,
  },
  capabilityText: {
    fontSize: 16 * fontScale,
    color: theme.colors.text,
  },
  callLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  callLogItemLast: {
    borderBottomWidth: 0,
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  callDetails: {
    flex: 1,
  },
  callPatient: {
    fontSize: 16 * fontScale,
    fontWeight: '500',
    color: theme.colors.text,
  },
  callPhone: {
    fontSize: 14 * fontScale,
    color: theme.colors.textSecondary,
  },
  callTime: {
    fontSize: 12 * fontScale,
    color: theme.colors.textSecondary,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  instructionItemLast: {
    marginBottom: 0,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    color: '#fff',
    fontSize: 14 * fontScale,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 14 * fontScale,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 20 * fontScale,
  },
});
