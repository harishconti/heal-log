import React from 'react';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import { Button, ButtonProps } from '../Button';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: {
        Medium: 'medium',
    },
}));

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            colors: {
                primary: '#2ecc71',
                secondary: '#3498db',
                error: '#e74c3c',
                success: '#27ae60',
                border: '#e9ecef',
            },
            spacing: {
                xs: 4,
                sm: 8,
                md: 16,
                lg: 24,
            },
            typography: {
                sizes: {
                    sm: 14,
                    md: 16,
                    lg: 18,
                },
                weights: {
                    semibold: '600',
                },
            },
            borderRadius: {
                md: 8,
            },
        },
    }),
}));

jest.mock('@/store/useAppStore', () => ({
    useAppStore: () => ({
        settings: { hapticEnabled: true },
    }),
}));

describe('Button Component', () => {
    const mockOnPress = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders correctly with default props', () => {
            const tree = renderer.create(
                <Button title="Test Button" onPress={mockOnPress} />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('renders button title text', () => {
            const component = renderer.create(
                <Button title="Click Me" onPress={mockOnPress} />
            );
            const instance = component.root;
            const textElement = instance.findByType('Text' as any);
            expect(textElement.props.children).toBe('Click Me');
        });
    });

    describe('Variants', () => {
        it('renders primary variant correctly', () => {
            const tree = renderer.create(
                <Button title="Primary" onPress={mockOnPress} variant="primary" />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('renders secondary variant correctly', () => {
            const tree = renderer.create(
                <Button title="Secondary" onPress={mockOnPress} variant="secondary" />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('renders outline variant correctly', () => {
            const tree = renderer.create(
                <Button title="Outline" onPress={mockOnPress} variant="outline" />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('renders danger variant correctly', () => {
            const tree = renderer.create(
                <Button title="Danger" onPress={mockOnPress} variant="danger" />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('renders success variant correctly', () => {
            const tree = renderer.create(
                <Button title="Success" onPress={mockOnPress} variant="success" />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('primary variant has green background color', () => {
            const component = renderer.create(
                <Button title="Primary" onPress={mockOnPress} variant="primary" />
            );
            const root = component.toJSON() as any;
            expect(root.props.style.backgroundColor).toBe('#2ecc71');
        });

        it('secondary variant has blue background color', () => {
            const component = renderer.create(
                <Button title="Secondary" onPress={mockOnPress} variant="secondary" />
            );
            const root = component.toJSON() as any;
            expect(root.props.style.backgroundColor).toBe('#3498db');
        });

        it('outline variant has transparent background', () => {
            const component = renderer.create(
                <Button title="Outline" onPress={mockOnPress} variant="outline" />
            );
            const root = component.toJSON() as any;
            expect(root.props.style.backgroundColor).toBe('transparent');
            expect(root.props.style.borderColor).toBe('#2ecc71');
        });

        it('danger variant has red background color', () => {
            const component = renderer.create(
                <Button title="Danger" onPress={mockOnPress} variant="danger" />
            );
            const root = component.toJSON() as any;
            expect(root.props.style.backgroundColor).toBe('#e74c3c');
        });

        it('success variant has dark green background color', () => {
            const component = renderer.create(
                <Button title="Success" onPress={mockOnPress} variant="success" />
            );
            const root = component.toJSON() as any;
            expect(root.props.style.backgroundColor).toBe('#27ae60');
        });
    });

    describe('Sizes', () => {
        it('renders small size correctly', () => {
            const tree = renderer.create(
                <Button title="Small" onPress={mockOnPress} size="small" />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('renders medium size correctly', () => {
            const tree = renderer.create(
                <Button title="Medium" onPress={mockOnPress} size="medium" />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('renders large size correctly', () => {
            const tree = renderer.create(
                <Button title="Large" onPress={mockOnPress} size="large" />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('small size has minHeight of 36', () => {
            const component = renderer.create(
                <Button title="Small" onPress={mockOnPress} size="small" />
            );
            const root = component.toJSON() as any;
            expect(root.props.style.minHeight).toBe(36);
        });

        it('medium size has minHeight of 44', () => {
            const component = renderer.create(
                <Button title="Medium" onPress={mockOnPress} size="medium" />
            );
            const root = component.toJSON() as any;
            expect(root.props.style.minHeight).toBe(44);
        });

        it('large size has minHeight of 52', () => {
            const component = renderer.create(
                <Button title="Large" onPress={mockOnPress} size="large" />
            );
            const root = component.toJSON() as any;
            expect(root.props.style.minHeight).toBe(52);
        });
    });

    describe('States', () => {
        it('renders disabled state correctly', () => {
            const tree = renderer.create(
                <Button title="Disabled" onPress={mockOnPress} disabled />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('disabled button has reduced opacity', () => {
            const component = renderer.create(
                <Button title="Disabled" onPress={mockOnPress} disabled />
            );
            const root = component.toJSON() as any;
            expect(root.props.style.opacity).toBe(0.6);
        });

        it('disabled button has disabled prop set to true', () => {
            const component = renderer.create(
                <Button title="Disabled" onPress={mockOnPress} disabled />
            );
            const root = component.toJSON() as any;
            expect(root.props.disabled).toBe(true);
        });

        it('renders loading state correctly', () => {
            const tree = renderer.create(
                <Button title="Loading" onPress={mockOnPress} loading />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('loading button shows ActivityIndicator', () => {
            const component = renderer.create(
                <Button title="Loading" onPress={mockOnPress} loading />
            );
            const instance = component.root;
            const activityIndicator = instance.findByType('ActivityIndicator' as any);
            expect(activityIndicator).toBeTruthy();
        });

        it('loading button is disabled', () => {
            const component = renderer.create(
                <Button title="Loading" onPress={mockOnPress} loading />
            );
            const root = component.toJSON() as any;
            expect(root.props.disabled).toBe(true);
        });
    });

    describe('Icons', () => {
        it('renders button with left icon', () => {
            const tree = renderer.create(
                <Button
                    title="With Icon"
                    onPress={mockOnPress}
                    icon="add"
                    iconPosition="left"
                />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('renders button with right icon', () => {
            const tree = renderer.create(
                <Button
                    title="With Icon"
                    onPress={mockOnPress}
                    icon="arrow-forward"
                    iconPosition="right"
                />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('icon is present when specified', () => {
            const component = renderer.create(
                <Button title="With Icon" onPress={mockOnPress} icon="add" />
            );
            const instance = component.root;
            const icon = instance.findByType('Ionicons' as any);
            expect(icon.props.name).toBe('add');
        });
    });

    describe('Interactions', () => {
        it('calls onPress when pressed', async () => {
            const component = renderer.create(
                <Button title="Click Me" onPress={mockOnPress} />
            );
            const root = component.toJSON() as any;

            await act(async () => {
                root.props.onPress();
            });

            expect(mockOnPress).toHaveBeenCalledTimes(1);
        });

        it('does not call onPress when disabled', async () => {
            const component = renderer.create(
                <Button title="Disabled" onPress={mockOnPress} disabled />
            );
            const instance = component.root;
            const touchable = instance.findByProps({ disabled: true });

            // Disabled buttons should not trigger onPress
            expect(touchable.props.disabled).toBe(true);
        });

        it('does not call onPress when loading', async () => {
            const component = renderer.create(
                <Button title="Loading" onPress={mockOnPress} loading />
            );
            const instance = component.root;
            const touchable = instance.findByProps({ disabled: true });

            expect(touchable.props.disabled).toBe(true);
        });

        it('triggers haptic feedback when pressed', async () => {
            const Haptics = require('expo-haptics');
            const component = renderer.create(
                <Button title="Haptic" onPress={mockOnPress} hapticFeedback />
            );
            const root = component.toJSON() as any;

            await act(async () => {
                root.props.onPress();
            });

            expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
        });

        it('does not trigger haptic feedback when hapticFeedback is false', async () => {
            const Haptics = require('expo-haptics');
            const component = renderer.create(
                <Button title="No Haptic" onPress={mockOnPress} hapticFeedback={false} />
            );
            const root = component.toJSON() as any;

            await act(async () => {
                root.props.onPress();
            });

            expect(Haptics.impactAsync).not.toHaveBeenCalled();
        });
    });

    describe('Custom Styles', () => {
        it('applies custom style prop', () => {
            const customStyle = { marginTop: 20 };
            const component = renderer.create(
                <Button title="Custom" onPress={mockOnPress} style={customStyle} />
            );
            const root = component.toJSON() as any;
            expect(root.props.style.marginTop).toBe(20);
        });

        it('applies custom textStyle prop', () => {
            const component = renderer.create(
                <Button
                    title="Custom Text"
                    onPress={mockOnPress}
                    textStyle={{ fontSize: 20 }}
                />
            );
            const instance = component.root;
            const textElement = instance.findByType('Text' as any);
            expect(textElement.props.style.fontSize).toBe(20);
        });
    });

    describe('Text Colors by Variant', () => {
        it('primary variant has white text', () => {
            const component = renderer.create(
                <Button title="Primary" onPress={mockOnPress} variant="primary" />
            );
            const instance = component.root;
            const textElement = instance.findByType('Text' as any);
            expect(textElement.props.style.color).toBe('#ffffff');
        });

        it('outline variant has primary color text', () => {
            const component = renderer.create(
                <Button title="Outline" onPress={mockOnPress} variant="outline" />
            );
            const instance = component.root;
            const textElement = instance.findByType('Text' as any);
            expect(textElement.props.style.color).toBe('#2ecc71');
        });

        it('danger variant has white text', () => {
            const component = renderer.create(
                <Button title="Danger" onPress={mockOnPress} variant="danger" />
            );
            const instance = component.root;
            const textElement = instance.findByType('Text' as any);
            expect(textElement.props.style.color).toBe('#ffffff');
        });
    });

    describe('Accessibility', () => {
        it('has active opacity of 0.7 for touch feedback', () => {
            const component = renderer.create(
                <Button title="Accessible" onPress={mockOnPress} />
            );
            const root = component.toJSON() as any;
            expect(root.props.activeOpacity).toBe(0.7);
        });
    });
});
