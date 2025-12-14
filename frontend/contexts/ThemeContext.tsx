import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { useAppStore } from '@/store/useAppStore';

export interface Theme {
  colors: {
    primary: string;
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

const lightTheme: Theme = {
  colors: {
    primary: '#2ecc71',
    secondary: '#3498db',
    background: '#f8f9fa',
    surface: '#ffffff',
    error: '#e74c3c',
    warning: '#f39c12',
    success: '#27ae60',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e9ecef',
    shadow: '#000000',
    card: '#ffffff',
    notification: '#2ecc71',
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
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#2ecc71',
    secondary: '#3498db',
    background: '#121212',
    surface: '#1e1e1e',
    error: '#ef5350',
    warning: '#ff9800',
    success: '#4caf50',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    border: '#333333',
    shadow: '#000000',
    card: '#2d2d2d',
    notification: '#2ecc71',
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