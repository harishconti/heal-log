import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    FlatList,
    Alert,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { useRouter } from 'expo-router';
import { database } from '@/models/database';
import Patient from '@/models/Patient';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/useAppStore';
import uuid from 'react-native-uuid';

interface DeviceContact {
    id: string;
    name: string;
    phoneNumbers?: Array<{ number?: string }>;
    emails?: Array<{ email?: string }>;
}

export default function ContactsImportScreen() {
    const router = useRouter();
    const settings = useAppStore((state) => state.settings);

    const [contacts, setContacts] = useState<DeviceContact[]>([]);
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const triggerHaptic = () => {
        if (settings.hapticEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Contact permissions are needed to import contacts as patients.'
                );
                router.back();
                return;
            }

            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
            });

            if (data.length > 0) {
                setContacts(data as DeviceContact[]);
            } else {
                Alert.alert('No Contacts', 'No contacts found on  device.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load contacts');
        } finally {
            setLoading(false);
        }
    };

    const toggleContact = (contactId: string) => {
        triggerHaptic();
        setSelectedContacts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(contactId)) {
                newSet.delete(contactId);
            } else {
                newSet.add(contactId);
            }
            return newSet;
        });
    };

    const importSelectedContacts = async () => {
        if (selectedContacts.size === 0) {
            Alert.alert('No Selection', 'Please select contacts to import');
            return;
        }

        try {
            setImporting(true);
            const contactsToImport = contacts.filter(c => selectedContacts.has(c.id));

            await database.write(async () => {
                for (const contact of contactsToImport) {
                    const phone = contact.phoneNumbers?.[0]?.number || '';
                    const email = contact.emails?.[0]?.email || '';

                    await database.collections.get<Patient>('patients').create(patient => {
                        patient.patientId = `IMPORTED-${uuid.v4().toString().substring(0, 8)}`;
                        patient.name = contact.name || 'Unknown';
                        patient.phone = phone;
                        patient.email = email;
                        patient.address = '';
                        patient.location = '';
                        patient.initialComplaint = 'Imported from contacts';
                        patient.initialDiagnosis = '';
                        patient.photo = '';
                        patient.group = 'imported';
                        patient.isFavorite = false;
                    });
                }
            });

            if (settings.hapticEnabled) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            Alert.alert(
                'Success',
                `Imported ${selectedContacts.size} contact(s) as patients`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to import contacts');
        } finally {
            setImporting(false);
        }
    };

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2ecc71" />
                    <Text style={styles.loadingText}>Loading contacts...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Import Contacts</Text>
                <TouchableOpacity
                    onPress={importSelectedContacts}
                    disabled={importing || selectedContacts.size === 0}
                    style={styles.headerButton}
                >
                    {importing ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons
                            name="checkmark"
                            size={24}
                            color={selectedContacts.size > 0 ? "#fff" : "#666"}
                        />
                    )}
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Selection Count */}
            <View style={styles.selectionInfo}>
                <Text style={styles.selectionText}>
                    {selectedContacts.size} of {contacts.length} selected
                </Text>
                {selectedContacts.size > 0 && (
                    <TouchableOpacity
                        onPress={() => setSelectedContacts(new Set())}
                        style={styles.clearButton}
                    >
                        <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Contacts List */}
            <FlatList
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.contactItem}
                        onPress={() => toggleContact(item.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.checkbox}>
                            {selectedContacts.has(item.id) && (
                                <Ionicons name="checkmark" size={18} color="#fff" />
                            )}
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>{item.name}</Text>
                            {item.phoneNumbers?.[0]?.number && (
                                <Text style={styles.contactPhone}>
                                    {item.phoneNumbers[0].number}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="person-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No contacts found</Text>
                    </View>
                }
            />

            {/* Import Button */}
            {selectedContacts.size > 0 && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.importButton, importing && styles.importButtonDisabled]}
                        onPress={importSelectedContacts}
                        disabled={importing}
                    >
                        {importing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.importButtonText}>
                                Import {selectedContacts.size} Contact{selectedContacts.size > 1 ? 's' : ''}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
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
        width: 40,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        elevation: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    selectionInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    selectionText: {
        fontSize: 14,
        color: '#666',
    },
    clearButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    clearButtonText: {
        fontSize: 14,
        color: '#2ecc71',
        fontWeight: '600',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2ecc71',
        backgroundColor: '#2ecc71',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    contactPhone: {
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    importButton: {
        backgroundColor: '#2ecc71',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    importButtonDisabled: {
        opacity: 0.6,
    },
    importButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
