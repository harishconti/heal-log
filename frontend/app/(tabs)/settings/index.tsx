import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

const SettingsScreen = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();

    const menuItems = [
        { id: 'known-issues', title: 'Known Issues', screen: '/(tabs)/settings/known-issues' },
        { id: 'feedback', title: 'Submit Feedback', screen: '/(tabs)/settings/feedback' },
    ];

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => router.push(item.screen)}>
            <Text style={styles.itemText}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>
            <FlatList
                data={menuItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
            />
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 20,
    },
    item: {
        backgroundColor: theme.colors.card,
        padding: 20,
        borderRadius: 8,
        marginBottom: 10,
    },
    itemText: {
        fontSize: 18,
        color: theme.colors.text,
    },
});

export default SettingsScreen;
