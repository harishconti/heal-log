import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ options, selectedValue, onValueChange }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [modalVisible, setModalVisible] = useState(false);

  const selectedLabel = options.find((option) => option.value === selectedValue)?.label;

  const renderOption = ({ item }: { item: DropdownOption }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => {
        onValueChange(item.value);
        setModalVisible(false);
      }}
    >
      <Text style={styles.optionText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity style={styles.dropdown} onPress={() => setModalVisible(true)}>
        <Text style={styles.dropdownText}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  dropdownText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 10,
    width: '80%',
    maxHeight: '50%',
  },
  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 16,
  },
});

export default Dropdown;
