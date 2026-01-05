import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

export interface SearchFilters {
  query: string;
  condition: string;
  diagnosis: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  group: string;
  favoritesOnly: boolean;
  recentlyAdded: boolean; // Last 7 days
}

interface AdvancedSearchPanelProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  groups: string[];
}

const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  visible,
  onClose,
  filters,
  onFiltersChange,
  groups,
}) => {
  const { theme, fontScale } = useTheme();
  const styles = createStyles(theme, fontScale);

  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const updateFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setLocalFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    onClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleReset = useCallback(() => {
    const resetFilters: SearchFilters = {
      query: '',
      condition: '',
      diagnosis: '',
      dateFrom: null,
      dateTo: null,
      group: '',
      favoritesOnly: false,
      recentlyAdded: false,
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  }, [onFiltersChange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localFilters.condition) count++;
    if (localFilters.diagnosis) count++;
    if (localFilters.dateFrom) count++;
    if (localFilters.dateTo) count++;
    if (localFilters.group) count++;
    if (localFilters.favoritesOnly) count++;
    if (localFilters.recentlyAdded) count++;
    return count;
  }, [localFilters]);

  const datePresets = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];

  const applyDatePreset = (days: number) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    fromDate.setHours(0, 0, 0, 0);
    setLocalFilters((prev) => ({
      ...prev,
      dateFrom: fromDate,
      dateTo: today,
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Advanced Search</Text>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search by Condition */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="medkit-outline" size={16} color={theme.colors.primary} />
                {' '}Search by Condition
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., headache, fever, cough..."
                placeholderTextColor={theme.colors.textSecondary}
                value={localFilters.condition}
                onChangeText={(text) => updateFilter('condition', text)}
              />
            </View>

            {/* Search by Diagnosis */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="document-text-outline" size={16} color={theme.colors.primary} />
                {' '}Search by Diagnosis
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., hypertension, diabetes..."
                placeholderTextColor={theme.colors.textSecondary}
                value={localFilters.diagnosis}
                onChangeText={(text) => updateFilter('diagnosis', text)}
              />
            </View>

            {/* Date Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                {' '}Filter by Date Added
              </Text>

              {/* Quick Presets */}
              <View style={styles.presetRow}>
                {datePresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={[
                      styles.presetButton,
                      localFilters.dateFrom &&
                      Math.abs(
                        (new Date().getTime() - localFilters.dateFrom.getTime()) / (1000 * 60 * 60 * 24) - preset.days
                      ) < 1 &&
                        styles.presetButtonActive,
                    ]}
                    onPress={() => applyDatePreset(preset.days)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        localFilters.dateFrom &&
                        Math.abs(
                          (new Date().getTime() - localFilters.dateFrom.getTime()) / (1000 * 60 * 60 * 24) - preset.days
                        ) < 1 &&
                          styles.presetTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {localFilters.dateFrom && (
                <View style={styles.dateRangeDisplay}>
                  <Text style={styles.dateText}>
                    {localFilters.dateFrom.toLocaleDateString()} - {localFilters.dateTo?.toLocaleDateString() || 'Now'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setLocalFilters((prev) => ({ ...prev, dateFrom: null, dateTo: null }));
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Group Filter */}
            {groups.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="folder-outline" size={16} color={theme.colors.primary} />
                  {' '}Filter by Group
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.groupRow}>
                    <TouchableOpacity
                      style={[
                        styles.groupButton,
                        !localFilters.group && styles.groupButtonActive,
                      ]}
                      onPress={() => updateFilter('group', '')}
                    >
                      <Text
                        style={[
                          styles.groupText,
                          !localFilters.group && styles.groupTextActive,
                        ]}
                      >
                        All Groups
                      </Text>
                    </TouchableOpacity>
                    {groups.map((group) => (
                      <TouchableOpacity
                        key={group}
                        style={[
                          styles.groupButton,
                          localFilters.group === group && styles.groupButtonActive,
                        ]}
                        onPress={() => updateFilter('group', group)}
                      >
                        <Text
                          style={[
                            styles.groupText,
                            localFilters.group === group && styles.groupTextActive,
                          ]}
                        >
                          {group}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Quick Filters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="flash-outline" size={16} color={theme.colors.primary} />
                {' '}Quick Filters
              </Text>

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => updateFilter('favoritesOnly', !localFilters.favoritesOnly)}
              >
                <View style={styles.toggleInfo}>
                  <Ionicons
                    name={localFilters.favoritesOnly ? 'heart' : 'heart-outline'}
                    size={20}
                    color={localFilters.favoritesOnly ? theme.colors.error : theme.colors.textSecondary}
                  />
                  <Text style={styles.toggleLabel}>Favorites Only</Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    localFilters.favoritesOnly && styles.checkboxActive,
                  ]}
                >
                  {localFilters.favoritesOnly && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => updateFilter('recentlyAdded', !localFilters.recentlyAdded)}
              >
                <View style={styles.toggleInfo}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={localFilters.recentlyAdded ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <Text style={styles.toggleLabel}>Recently Added (Last 7 days)</Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    localFilters.recentlyAdded && styles.checkboxActive,
                  ]}
                >
                  {localFilters.recentlyAdded && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.footer}>
            {activeFilterCount > 0 && (
              <Text style={styles.filterCount}>
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
              </Text>
            )}
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any, fontScale: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    closeButton: {
      padding: 4,
    },
    title: {
      fontSize: 18 * fontScale,
      fontWeight: '600',
      color: theme.colors.text,
    },
    resetButton: {
      padding: 4,
    },
    resetText: {
      fontSize: 14 * fontScale,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    content: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14 * fontScale,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16 * fontScale,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    presetRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    presetButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    presetButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    presetText: {
      fontSize: 13 * fontScale,
      color: theme.colors.textSecondary,
    },
    presetTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    dateRangeDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 12,
    },
    dateText: {
      fontSize: 14 * fontScale,
      color: theme.colors.text,
    },
    groupRow: {
      flexDirection: 'row',
      gap: 8,
    },
    groupButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    groupButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    groupText: {
      fontSize: 14 * fontScale,
      color: theme.colors.textSecondary,
    },
    groupTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 8,
    },
    toggleInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    toggleLabel: {
      fontSize: 15 * fontScale,
      color: theme.colors.text,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    footer: {
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    filterCount: {
      fontSize: 13 * fontScale,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 12,
    },
    applyButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    applyText: {
      fontSize: 16 * fontScale,
      fontWeight: '600',
      color: '#fff',
    },
  });

export default AdvancedSearchPanel;
