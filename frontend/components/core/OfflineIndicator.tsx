import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetwork } from '@/contexts/NetworkContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const OfflineIndicator = () => {
    const { isConnected } = useNetwork();
    const { theme } = useTheme();

    if (isConnected) {
        return null;
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.error }]}>
            <Ionicons name="cloud-offline" size={16} color="#fff" style={styles.icon} />
            <Text style={styles.text}>You are offline. Changes will sync when online.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        width: '100%',
    },
    icon: {
        marginRight: 8,
    },
    text: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default OfflineIndicator;
