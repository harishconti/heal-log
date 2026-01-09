import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';

export interface TabItem {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  variant?: 'underline' | 'pills' | 'segmented';
  fullWidth?: boolean;
  scrollable?: boolean;
  style?: ViewStyle;
}

/**
 * TabBar component for navigation between content sections
 *
 * @param tabs - Array of tab items
 * @param activeTab - Currently active tab key
 * @param onTabChange - Handler for tab changes
 * @param variant - Tab style variant (default: 'underline')
 * @param fullWidth - Whether tabs should take full width
 * @param scrollable - Whether tabs should be scrollable
 */
export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  fullWidth = true,
  scrollable = false,
  style,
}) => {
  const { theme } = useTheme();
  const { settings } = useAppStore();

  const handleTabPress = async (tabKey: string) => {
    if (settings.hapticEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTabChange(tabKey);
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
    };

    const variantStyles: Record<string, ViewStyle> = {
      underline: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      pills: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: 4,
      },
      segmented: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        padding: 4,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...style,
    };
  };

  const getTabStyle = (isActive: boolean): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    };

    if (fullWidth && !scrollable) {
      baseStyle.flex = 1;
    }

    const variantStyles: Record<string, ViewStyle> = {
      underline: {
        borderBottomWidth: 2,
        borderBottomColor: isActive ? theme.colors.primary : 'transparent',
        marginBottom: -1,
      },
      pills: {
        backgroundColor: isActive ? theme.colors.primary : 'transparent',
        borderRadius: theme.borderRadius.md,
      },
      segmented: {
        backgroundColor: isActive ? theme.colors.surface : 'transparent',
        borderRadius: theme.borderRadius.sm,
        ...(isActive && {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }),
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (isActive: boolean): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: theme.typography.sizes.sm,
      fontWeight: isActive ? '600' : '500',
    };

    const variantColors: Record<string, { active: string; inactive: string }> = {
      underline: {
        active: theme.colors.primary,
        inactive: theme.colors.textSecondary,
      },
      pills: {
        active: '#FFFFFF',
        inactive: theme.colors.textSecondary,
      },
      segmented: {
        active: theme.colors.text,
        inactive: theme.colors.textSecondary,
      },
    };

    return {
      ...baseStyle,
      color: isActive ? variantColors[variant].active : variantColors[variant].inactive,
    };
  };

  const getIconColor = (isActive: boolean): string => {
    const variantColors: Record<string, { active: string; inactive: string }> = {
      underline: {
        active: theme.colors.primary,
        inactive: theme.colors.textSecondary,
      },
      pills: {
        active: '#FFFFFF',
        inactive: theme.colors.textSecondary,
      },
      segmented: {
        active: theme.colors.text,
        inactive: theme.colors.textSecondary,
      },
    };

    return isActive ? variantColors[variant].active : variantColors[variant].inactive;
  };

  const renderTab = (tab: TabItem) => {
    const isActive = activeTab === tab.key;

    return (
      <TouchableOpacity
        key={tab.key}
        style={getTabStyle(isActive)}
        onPress={() => handleTabPress(tab.key)}
        activeOpacity={0.7}
      >
        {tab.icon && (
          <Ionicons
            name={tab.icon}
            size={18}
            color={getIconColor(isActive)}
            style={{ marginRight: tab.label ? 6 : 0 }}
          />
        )}
        <Text style={getTextStyle(isActive)}>{tab.label}</Text>
        {tab.badge !== undefined && tab.badge > 0 && (
          <View
            style={{
              backgroundColor: theme.colors.error,
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 6,
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const tabsContent = tabs.map(renderTab);

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={getContainerStyle()}
      >
        {tabsContent}
      </ScrollView>
    );
  }

  return <View style={getContainerStyle()}>{tabsContent}</View>;
};
