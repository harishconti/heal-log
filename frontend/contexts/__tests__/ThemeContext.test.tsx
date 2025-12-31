import React from 'react';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import { View, Text, Button } from 'react-native';
import { ThemeProvider, useTheme, Theme } from '../ThemeContext';

// Mock dependencies
jest.mock('react-native', () => {
    const rn = jest.requireActual('react-native');
    return {
        ...rn,
        Appearance: {
            getColorScheme: jest.fn(() => 'light'),
            addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
        },
    };
});

const mockUpdateSettings = jest.fn();
const mockSettings = {
    theme: 'light' as const,
    fontSize: 'medium' as const,
    hapticEnabled: true,
    offlineMode: false,
    autoSync: true,
    contactsSync: false,
};

jest.mock('@/store/useAppStore', () => ({
    useAppStore: () => ({
        settings: mockSettings,
        updateSettings: mockUpdateSettings,
    }),
}));

jest.mock('expo-font', () => ({
    useFonts: () => [true],
}));

// Test component that consumes ThemeContext
const ThemeConsumer: React.FC = () => {
    const { theme, isDark, fontScale, toggleTheme, setTheme } = useTheme();

    return (
        <View>
            <Text testID="primary-color">{theme.colors.primary}</Text>
            <Text testID="background-color">{theme.colors.background}</Text>
            <Text testID="text-color">{theme.colors.text}</Text>
            <Text testID="is-dark">{isDark.toString()}</Text>
            <Text testID="font-scale">{fontScale.toString()}</Text>
            <Button testID="toggle-theme" title="Toggle" onPress={toggleTheme} />
            <Button testID="set-light" title="Light" onPress={() => setTheme('light')} />
            <Button testID="set-dark" title="Dark" onPress={() => setTheme('dark')} />
            <Button testID="set-system" title="System" onPress={() => setTheme('system')} />
        </View>
    );
};

describe('ThemeContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSettings.theme = 'light';
        mockSettings.fontSize = 'medium';
    });

    describe('Light Theme Colors', () => {
        it('provides correct primary color', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const primaryColor = instance.findByProps({ testID: 'primary-color' });
            expect(primaryColor.props.children).toBe('#2ecc71');
        });

        it('provides correct background color for light theme', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const bgColor = instance.findByProps({ testID: 'background-color' });
            expect(bgColor.props.children).toBe('#f8f9fa');
        });

        it('provides correct text color for light theme', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const textColor = instance.findByProps({ testID: 'text-color' });
            expect(textColor.props.children).toBe('#333333');
        });

        it('isDark is false for light theme', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const isDark = instance.findByProps({ testID: 'is-dark' });
            expect(isDark.props.children).toBe('false');
        });
    });

    describe('Dark Theme Colors', () => {
        beforeEach(() => {
            mockSettings.theme = 'dark';
        });

        it('provides correct background color for dark theme', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const bgColor = instance.findByProps({ testID: 'background-color' });
            expect(bgColor.props.children).toBe('#121212');
        });

        it('provides correct text color for dark theme', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const textColor = instance.findByProps({ testID: 'text-color' });
            expect(textColor.props.children).toBe('#ffffff');
        });

        it('isDark is true for dark theme', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const isDark = instance.findByProps({ testID: 'is-dark' });
            expect(isDark.props.children).toBe('true');
        });

        it('primary color remains same in dark theme', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const primaryColor = instance.findByProps({ testID: 'primary-color' });
            expect(primaryColor.props.children).toBe('#2ecc71');
        });
    });

    describe('Color Schema', () => {
        it('light theme has all required colors', async () => {
            let capturedTheme: Theme | null = null;

            const CaptureTheme: React.FC = () => {
                const { theme } = useTheme();
                capturedTheme = theme;
                return null;
            };

            await act(async () => {
                renderer.create(
                    <ThemeProvider>
                        <CaptureTheme />
                    </ThemeProvider>
                );
            });

            expect(capturedTheme!.colors).toEqual({
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
            });
        });

        it('dark theme has all required colors', async () => {
            mockSettings.theme = 'dark';
            let capturedTheme: Theme | null = null;

            const CaptureTheme: React.FC = () => {
                const { theme } = useTheme();
                capturedTheme = theme;
                return null;
            };

            await act(async () => {
                renderer.create(
                    <ThemeProvider>
                        <CaptureTheme />
                    </ThemeProvider>
                );
            });

            expect(capturedTheme!.colors).toEqual({
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
            });
        });
    });

    describe('Spacing', () => {
        it('provides correct spacing values', async () => {
            let capturedTheme: Theme | null = null;

            const CaptureTheme: React.FC = () => {
                const { theme } = useTheme();
                capturedTheme = theme;
                return null;
            };

            await act(async () => {
                renderer.create(
                    <ThemeProvider>
                        <CaptureTheme />
                    </ThemeProvider>
                );
            });

            expect(capturedTheme!.spacing).toEqual({
                xs: 4,
                sm: 8,
                md: 16,
                lg: 24,
                xl: 32,
            });
        });
    });

    describe('Typography', () => {
        it('provides correct font sizes', async () => {
            let capturedTheme: Theme | null = null;

            const CaptureTheme: React.FC = () => {
                const { theme } = useTheme();
                capturedTheme = theme;
                return null;
            };

            await act(async () => {
                renderer.create(
                    <ThemeProvider>
                        <CaptureTheme />
                    </ThemeProvider>
                );
            });

            expect(capturedTheme!.typography.sizes).toEqual({
                xs: 12,
                sm: 14,
                md: 16,
                lg: 18,
                xl: 24,
                xxl: 32,
            });
        });

        it('provides correct font weights', async () => {
            let capturedTheme: Theme | null = null;

            const CaptureTheme: React.FC = () => {
                const { theme } = useTheme();
                capturedTheme = theme;
                return null;
            };

            await act(async () => {
                renderer.create(
                    <ThemeProvider>
                        <CaptureTheme />
                    </ThemeProvider>
                );
            });

            expect(capturedTheme!.typography.weights).toEqual({
                normal: '400',
                medium: '500',
                semibold: '600',
                bold: '700',
            });
        });
    });

    describe('Border Radius', () => {
        it('provides correct border radius values', async () => {
            let capturedTheme: Theme | null = null;

            const CaptureTheme: React.FC = () => {
                const { theme } = useTheme();
                capturedTheme = theme;
                return null;
            };

            await act(async () => {
                renderer.create(
                    <ThemeProvider>
                        <CaptureTheme />
                    </ThemeProvider>
                );
            });

            expect(capturedTheme!.borderRadius).toEqual({
                sm: 4,
                md: 8,
                lg: 12,
                xl: 16,
            });
        });
    });

    describe('Font Scale', () => {
        it('returns 1.0 for medium font size', async () => {
            mockSettings.fontSize = 'medium';

            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const fontScale = instance.findByProps({ testID: 'font-scale' });
            expect(fontScale.props.children).toBe('1');
        });

        it('returns 0.9 for small font size', async () => {
            mockSettings.fontSize = 'small';

            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const fontScale = instance.findByProps({ testID: 'font-scale' });
            expect(fontScale.props.children).toBe('0.9');
        });

        it('returns 1.1 for large font size', async () => {
            mockSettings.fontSize = 'large';

            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const fontScale = instance.findByProps({ testID: 'font-scale' });
            expect(fontScale.props.children).toBe('1.1');
        });
    });

    describe('Theme Toggle', () => {
        it('toggleTheme calls updateSettings with opposite theme', async () => {
            mockSettings.theme = 'light';

            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const toggleButton = instance.findByProps({ testID: 'toggle-theme' });

            await act(async () => {
                toggleButton.props.onPress();
            });

            expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'dark' });
        });

        it('toggleTheme from dark to light', async () => {
            mockSettings.theme = 'dark';

            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const toggleButton = instance.findByProps({ testID: 'toggle-theme' });

            await act(async () => {
                toggleButton.props.onPress();
            });

            expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'light' });
        });
    });

    describe('Set Theme', () => {
        it('setTheme to light calls updateSettings', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const lightButton = instance.findByProps({ testID: 'set-light' });

            await act(async () => {
                lightButton.props.onPress();
            });

            expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'light' });
        });

        it('setTheme to dark calls updateSettings', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const darkButton = instance.findByProps({ testID: 'set-dark' });

            await act(async () => {
                darkButton.props.onPress();
            });

            expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'dark' });
        });

        it('setTheme to system calls updateSettings', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const systemButton = instance.findByProps({ testID: 'set-system' });

            await act(async () => {
                systemButton.props.onPress();
            });

            expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'system' });
        });
    });

    describe('System Theme', () => {
        it('uses system light theme when theme is set to system', async () => {
            mockSettings.theme = 'system';
            const { Appearance } = require('react-native');
            (Appearance.getColorScheme as jest.Mock).mockReturnValue('light');

            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const isDark = instance.findByProps({ testID: 'is-dark' });
            expect(isDark.props.children).toBe('false');
        });

        it('uses system dark theme when theme is set to system', async () => {
            mockSettings.theme = 'system';
            const { Appearance } = require('react-native');
            (Appearance.getColorScheme as jest.Mock).mockReturnValue('dark');

            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            const instance = component!.root;
            const isDark = instance.findByProps({ testID: 'is-dark' });
            expect(isDark.props.children).toBe('true');
        });
    });

    describe('useTheme Hook', () => {
        it('throws error when used outside ThemeProvider', () => {
            const TestComponent = () => {
                useTheme();
                return null;
            };

            expect(() => {
                renderer.create(<TestComponent />);
            }).toThrow('useTheme must be used within a ThemeProvider');
        });
    });

    describe('Appearance Listener', () => {
        it('subscribes to appearance changes on mount', async () => {
            const { Appearance } = require('react-native');

            await act(async () => {
                renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            expect(Appearance.addChangeListener).toHaveBeenCalled();
        });

        it('cleans up listener on unmount', async () => {
            const { Appearance } = require('react-native');
            const mockRemove = jest.fn();
            (Appearance.addChangeListener as jest.Mock).mockReturnValue({ remove: mockRemove });

            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <ThemeProvider>
                        <ThemeConsumer />
                    </ThemeProvider>
                );
            });

            await act(async () => {
                component.unmount();
            });

            expect(mockRemove).toHaveBeenCalled();
        });
    });
});
