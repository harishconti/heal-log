import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, Platform } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { useFonts } from 'expo-font';

export interface Theme {
  colors: {
    primary: string;
    primaryMuted: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceHighlight: string;
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
    xxl: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
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
  shadows: {
    sm: any;
    md: any;
    lg: any;
  };
}

// Modern Healthcare Design System
const lightTheme: Theme = {
  colors: {
    primary: '#2563EB',        // Modern Royal Blue
    primaryMuted: '#EFF6FF',   // Very light blue for backgrounds
    secondary: '#64748B',      // Slate Gray
    background: '#F8FAFC',     // Very light slate background (cleaner than gray)
    surface: '#FFFFFF',        // Pure white
    surfaceHighlight: '#F1F5F9', // Light gray for pressed states
    error: '#EF4444',          // Red
    warning: '#F59E0B',        // Amber
    success: '#10B981',        // Emerald Green
    text: '#0F172A',           // Slate 900 (High contrast)
    textSecondary: '#64748B',  // Slate 500
    border: '#E2E8F0',         // Slate 200
    shadow: '#64748B',         // Shadow color
    card: '#FFFFFF',
    notification: '#2563EB',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
      xxxl: 40,
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
    full: 9999,
  },
  shadows: {
    sm: Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: { elevation: 8 },
    }),
  },
};

const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#60A5FA',        // Lighter blue for dark mode
    primaryMuted: '#1E293B',   // Dark Slate
    secondary: '#94A3B8',      // Slate 400
    background: '#0F172A',     // Slate 900
    surface: '#1E293B',        // Slate 800
    surfaceHighlight: '#334155', // Slate 700
    error: '#F87171',
    warning: '#FBBF24',
    success: '#34D399',
    text: '#F8FAFC',           // Slate 50
    textSecondary: '#94A3B8',  // Slate 400
    border: '#334155',         // Slate 700
    shadow: '#000000',
    card: '#1E293B',
    notification: '#60A5FA',
  },
  shadows: {
    sm: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
      },
      android: { elevation: 8 },
    }),
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

export const useInitializeTheme = () => {
  const { settings } = useAppStore();
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

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

  const getFontScale = (): number => {
    switch (settings.fontSize) {
      case 'small':
        return 0.9;
      case 'large':
        return 1.1;
      default:
        return 1.0;
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
