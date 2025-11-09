import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';

interface BetaWelcomeScreenProps {
  visible: boolean;
  onClose: () => void;
}

const BetaWelcomeScreen: React.FC<BetaWelcomeScreenProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleGetStarted = () => {
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.container}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Welcome to the Beta!</Text>
          <Text style={styles.subtitle}>Thank you for helping us test our app.</Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.featureText}>Patient Management</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="document-text-outline" size={24} color={theme.colors.secondary} />
              <Text style={styles.featureText}>Clinical Notes</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="sync-circle-outline" size={24} color={theme.colors.warning} />
              <Text style={styles.featureText}>Offline Sync</Text>
            </View>
          </View>

          <Text style={styles.betaNotice}>
            This is a beta version. Some features may not be fully functional.
          </Text>

          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    margin: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  featureList: {
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 10,
    color: theme.colors.text,
  },
  betaNotice: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
  },
  getStartedButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BetaWelcomeScreen;
