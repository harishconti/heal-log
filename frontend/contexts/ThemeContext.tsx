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
  };
}

// Minimalistic indigo/slate color palette
const lightTheme: Theme = {
  colors: {
    primary: '#5b7cf9',
    primaryMuted: '#a3b8fc',
    secondary: '#6b7280',
    background: '#f9fafb',
    surface: '#ffffff',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    shadow: '#000000',
    card: '#ffffff',
    notification: '#5b7cf9',
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
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
  },
};

const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#7c9dff',
    primaryMuted: '#4a6bcc',
    secondary: '#9ca3af',
    background: '#0f1115',
    surface: '#1a1d24',
    error: '#f87171',
    warning: '#fbbf24',
    success: '#34d399',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    border: '#2d3139',
    shadow: '#000000',
    card: '#1a1d24',
    notification: '#7c9dff',
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