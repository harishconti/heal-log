import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/contexts/ThemeContext';

export interface ToastHandles {
  show: (message: string, type?: 'success' | 'error') => void;
}

const Toast = forwardRef<ToastHandles, {}>((props, ref) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error'>('success');
  const opacity = useState(new Animated.Value(0))[0];

  useImperativeHandle(ref, () => ({
    show(message, type = 'success') {
      setMessage(message);
      setType(type);
      setVisible(true);
    },
  }));

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const backgroundColor = type === 'success' ? theme.colors.success : theme.colors.error;
  const icon = type === 'success' ? 'checkmark-circle' : 'alert-circle';

  return (
    <Animated.View style={[styles.container, { backgroundColor, opacity }]}>
      <Ionicons name={icon} size={24} color="#fff" />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  message: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },
});

export default Toast;
