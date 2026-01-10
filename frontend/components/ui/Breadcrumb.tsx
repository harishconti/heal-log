import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store/useAppStore';

export interface BreadcrumbItem {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: 'chevron' | 'slash' | 'dot';
  maxItems?: number;
  showHome?: boolean;
  onHomePress?: () => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = 'chevron',
  maxItems = 4,
  showHome = true,
  onHomePress,
}) => {
  const { theme } = useTheme();
  const { settings } = useAppStore();
  const styles = createStyles(theme);

  const triggerHaptic = async () => {
    if (settings.hapticEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePress = async (item: BreadcrumbItem) => {
    await triggerHaptic();
    item.onPress?.();
  };

  const getSeparatorIcon = () => {
    switch (separator) {
      case 'chevron':
        return 'chevron-forward';
      case 'slash':
        return null; // We'll use text
      case 'dot':
        return 'ellipse';
      default:
        return 'chevron-forward';
    }
  };

  const renderSeparator = (index: number) => {
    if (index === displayItems.length - 1) return null;

    const separatorIcon = getSeparatorIcon();

    if (separator === 'slash') {
      return <Text style={styles.slashSeparator}>/</Text>;
    }

    return (
      <View style={styles.separator}>
        <Ionicons
          name={separatorIcon as keyof typeof Ionicons.glyphMap}
          size={separator === 'dot' ? 6 : 14}
          color={theme.colors.textSecondary}
        />
      </View>
    );
  };

  // Handle collapsing items if there are too many
  let displayItems = items;
  let collapsed = false;

  if (items.length > maxItems) {
    collapsed = true;
    displayItems = [
      items[0],
      { label: '...', onPress: undefined },
      ...items.slice(-2),
    ];
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Home button */}
        {showHome && (
          <>
            <TouchableOpacity
              onPress={async () => {
                await triggerHaptic();
                onHomePress?.();
              }}
              style={styles.homeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="home-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
            {items.length > 0 && renderSeparator(-1)}
          </>
        )}

        {/* Breadcrumb items */}
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isCollapsed = collapsed && item.label === '...';

          return (
            <View key={`${item.label}-${index}`} style={styles.itemContainer}>
              {isCollapsed ? (
                <Text style={styles.collapsedText}>...</Text>
              ) : isLast ? (
                <View style={styles.lastItem}>
                  {item.icon && (
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={theme.colors.text}
                      style={styles.itemIcon}
                    />
                  )}
                  <Text style={styles.lastItemText} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handlePress(item)}
                  style={styles.item}
                  disabled={!item.onPress}
                >
                  {item.icon && (
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={item.onPress ? theme.colors.primary : theme.colors.textSecondary}
                      style={styles.itemIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.itemText,
                      !item.onPress && styles.disabledText,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              {renderSeparator(index)}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    scrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minHeight: 44,
    },
    homeButton: {
      padding: theme.spacing.xs,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
      maxWidth: 150,
    },
    lastItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
      maxWidth: 200,
    },
    itemIcon: {
      marginRight: theme.spacing.xs,
    },
    itemText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.medium,
    },
    lastItemText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
      fontWeight: theme.typography.weights.semibold,
    },
    disabledText: {
      color: theme.colors.textSecondary,
    },
    collapsedText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
      paddingHorizontal: theme.spacing.xs,
    },
    separator: {
      paddingHorizontal: theme.spacing.xs,
    },
    slashSeparator: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      paddingHorizontal: theme.spacing.xs,
    },
  });

export default Breadcrumb;
