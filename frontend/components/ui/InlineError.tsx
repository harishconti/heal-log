import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface InlineErrorProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: any;
}

/**
 * InlineError - Non-intrusive error display component
 *
 * Use this instead of Alert.alert for inline feedback that doesn't
 * interrupt the user's workflow.
 *
 * @param message - Error message to display
 * @param type - Severity level (error, warning, info)
 * @param onRetry - Optional retry callback
 * @param onDismiss - Optional dismiss callback
 */
export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  type = 'error',
  onRetry,
  onDismiss,
  style,
}) => {
  const { theme, fontScale } = useTheme();
  const styles = getStyles(theme);

  const getColors = () => {
    switch (type) {
      case 'warning':
        return {
          bg: `${theme.colors.warning}15`,
          border: theme.colors.warning,
          text: theme.colors.warning,
          icon: 'warning' as const,
        };
      case 'info':
        return {
          bg: theme.colors.primaryMuted,
          border: theme.colors.primary,
          text: theme.colors.primary,
          icon: 'information-circle' as const,
        };
      default:
        return {
          bg: `${theme.colors.error}15`,
          border: theme.colors.error,
          text: theme.colors.error,
          icon: 'alert-circle' as const,
        };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        style,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name={colors.icon}
        size={20}
        color={colors.text}
        style={styles.icon}
      />
      <Text
        style={[
          styles.message,
          { color: colors.text, fontSize: 14 * fontScale },
        ]}
      >
        {message}
      </Text>
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={styles.actionButton}
            accessibilityLabel="Retry"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh" size={18} color={colors.text} />
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.actionButton}
            accessibilityLabel="Dismiss"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * ErrorBanner - Full-width error banner for screen-level errors
 */
export const ErrorBanner: React.FC<InlineErrorProps> = (props) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return <InlineError {...props} style={[styles.banner, props.style]} />;
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    marginVertical: theme.spacing.xs,
  },
  banner: {
    borderRadius: 0,
    marginVertical: 0,
    borderLeftWidth: 4,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontWeight: theme.typography.weights.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default InlineError;
