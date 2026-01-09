import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { useAppStore } from '@/store/useAppStore';

export interface Theme {
  colors: {
    primary: string;
    primaryMuted: string;
    secondary: string;
    background: string;
    surface: string;
    error: string;
    warning: string;
    success: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
    card: string;
    notification: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    weights: {
      normal: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
}

// Healthcare-focused design system - clean, professional, trustworthy
const lightTheme: Theme = {
  colors: {
    primary: '#1A8CFF',        // Bright healthcare blue
    primaryMuted: '#E8F4FF',   // Light blue tint for backgrounds
    secondary: '#6B7280',      // Neutral gray
    background: '#F0F4F8',     // Soft blue-gray background
    surface: '#FFFFFF',        // Pure white for cards/inputs
    error: '#EF4444',          // Red for errors
    warning: '#F59E0B',        // Amber for warnings
    success: '#10B981',        // Green for success states
    text: '#111827',           // Near-black for primary text
    textSecondary: '#6B7280',  // Medium gray for secondary text
    border: '#E5E7EB',         // Light gray for borders
    shadow: '#1A8CFF',         // Blue tint shadow
    card: '#FFFFFF',           // White cards
    notification: '#1A8CFF',   // Blue notifications
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,  // For pills and fully rounded elements
  },
};

const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#4DA8FF',        // Lighter blue for dark mode
    primaryMuted: '#1E3A5F',   // Dark blue tint
    secondary: '#9CA3AF',      // Light gray
    background: '#0F1419',     // Deep dark blue-gray
    surface: '#1A2332',        // Elevated dark surface
    error: '#F87171',          // Lighter red
    warning: '#FBBF24',        // Brighter amber
    success: '#34D399',        // Brighter green
    text: '#F9FAFB',           // Off-white text
    textSecondary: '#9CA3AF',  // Light gray secondary
    border: '#2D3B4E',         // Dark blue-gray border
    shadow: '#000000',         // Pure black shadow
    card: '#1A2332',           // Dark card background
    notification: '#4DA8FF',   // Light blue
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  fontScale: number;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

import { useFonts } from 'expo-font';

export const useInitializeTheme = () => {
  const { settings } = useAppStore();
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // const [fontsLoaded] = useFonts({
  //   'SpaceMono-Regular': require('@/assets/fonts/SpaceMono-Regular.ttf'),
  // });
  const fontsLoaded = true;

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (settings.theme === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return settings.theme;
  };

  const theme = getEffectiveTheme() === 'dark' ? darkTheme : lightTheme;

  return { theme, fontsLoaded };
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { settings, updateSettings } = useAppStore();
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (settings.theme === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return settings.theme;
  };

  const currentTheme = getEffectiveTheme() === 'dark' ? darkTheme : lightTheme;
  const isDark = getEffectiveTheme() === 'dark';

  // Calculate font scale based on settings
  const getFontScale = (): number => {
    switch (settings.fontSize) {
      case 'small':
        return 0.9;
      case 'large':
        return 1.1;
      default:
        return 1.0; // medium
    }
  };

  const fontScale = getFontScale();

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        isDark,
        fontScale,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};