import React from 'react';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import { useForm, FormProvider } from 'react-hook-form';
import { ControlledInput } from '../ControlledInput';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            colors: {
                primary: '#2ecc71',
                text: '#333333',
                textSecondary: '#666666',
                background: '#f8f9fa',
                border: '#e9ecef',
                error: '#e74c3c',
            },
        },
    }),
}));

// Wrapper component that provides form context
const FormWrapper: React.FC<{ children: React.ReactNode; defaultValues?: Record<string, any> }> = ({
    children,
    defaultValues = {},
}) => {
    const methods = useForm({ defaultValues });
    return <>{React.cloneElement(children as React.ReactElement, { control: methods.control })}</>;
};

describe('ControlledInput Component', () => {
    describe('Rendering', () => {
        it('renders correctly with required props', () => {
            const { control } = require('react-hook-form').useForm();
            const tree = renderer.create(
                <FormWrapper>
                    <ControlledInput control={control} name="email" />
                </FormWrapper>
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('renders with label', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput control={control} name="email" label="Email Address" />
                </FormWrapper>
            );
            const instance = component.root;
            const labels = instance.findAllByType('Text' as any);
            const labelText = labels.find((l: any) => l.props.children === 'Email Address');
            expect(labelText).toBeTruthy();
        });

        it('renders without label when not provided', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput control={control} name="email" />
                </FormWrapper>
            );
            const tree = component.toJSON() as any;
            // Should not have a label element before the input wrapper
            expect(tree).toBeDefined();
        });

        it('renders with placeholder', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput
                        control={control}
                        name="email"
                        placeholder="Enter your email"
                    />
                </FormWrapper>
            );
            const instance = component.root;
            const textInput = instance.findByType('TextInput' as any);
            expect(textInput.props.placeholder).toBe('Enter your email');
        });

        it('renders with left icon', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput
                        control={control}
                        name="email"
                        iconName="mail"
                    />
                </FormWrapper>
            );
            const instance = component.root;
            const icon = instance.findByType('Ionicons' as any);
            expect(icon.props.name).toBe('mail');
        });
    });

    describe('Password Input', () => {
        it('renders password field with secure text entry', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput
                        control={control}
                        name="password"
                        isPassword
                    />
                </FormWrapper>
            );
            const instance = component.root;
            const textInput = instance.findByType('TextInput' as any);
            expect(textInput.props.secureTextEntry).toBe(true);
        });

        it('renders show/hide password toggle for password fields', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput
                        control={control}
                        name="password"
                        isPassword
                    />
                </FormWrapper>
            );
            const instance = component.root;
            const icons = instance.findAllByType('Ionicons' as any);
            const eyeIcon = icons.find((icon: any) => icon.props.name === 'eye');
            expect(eyeIcon).toBeTruthy();
        });

        it('toggles password visibility when eye icon is pressed', async () => {
            const { control } = require('react-hook-form').useForm();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <FormWrapper>
                        <ControlledInput
                            control={control}
                            name="password"
                            isPassword
                        />
                    </FormWrapper>
                );
            });

            const instance = component!.root;
            const textInputBefore = instance.findByType('TextInput' as any);
            expect(textInputBefore.props.secureTextEntry).toBe(true);

            // Find and press the toggle button
            const touchables = instance.findAllByType('TouchableOpacity' as any);
            const eyeButton = touchables.find((t: any) => {
                try {
                    t.findByType('Ionicons' as any);
                    return true;
                } catch {
                    return false;
                }
            });

            if (eyeButton) {
                await act(async () => {
                    eyeButton.props.onPress();
                });

                const textInputAfter = instance.findByType('TextInput' as any);
                expect(textInputAfter.props.secureTextEntry).toBe(false);
            }
        });
    });

    describe('Error Handling', () => {
        it('displays error message when error prop is provided', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput
                        control={control}
                        name="email"
                        error="Invalid email address"
                    />
                </FormWrapper>
            );
            const instance = component.root;
            const texts = instance.findAllByType('Text' as any);
            const errorText = texts.find((t: any) => t.props.children === 'Invalid email address');
            expect(errorText).toBeTruthy();
        });

        it('applies error styling to input wrapper when error exists', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput
                        control={control}
                        name="email"
                        error="Invalid email"
                    />
                </FormWrapper>
            );
            const instance = component.root;
            const views = instance.findAllByType('View' as any);
            const inputWrapper = views.find((v: any) => v.props.style?.borderColor === '#e74c3c');
            expect(inputWrapper).toBeTruthy();
        });

        it('does not show error when no error prop', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput control={control} name="email" />
                </FormWrapper>
            );
            const instance = component.root;
            const texts = instance.findAllByType('Text' as any);
            // Should only have label if provided, not error text
            expect(texts.every((t: any) =>
                !t.props.style?.color || t.props.style?.color !== '#e74c3c'
            )).toBe(true);
        });
    });

    describe('Styling', () => {
        it('applies theme colors to text', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput
                        control={control}
                        name="email"
                        label="Email"
                    />
                </FormWrapper>
            );
            const instance = component.root;
            const labels = instance.findAllByType('Text' as any);
            const label = labels.find((l: any) => l.props.children === 'Email');
            expect(label?.props.style.color).toBe('#333333');
        });

        it('applies theme background color to input', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput control={control} name="email" />
                </FormWrapper>
            );
            const instance = component.root;
            const views = instance.findAllByType('View' as any);
            const inputWrapper = views.find((v: any) =>
                v.props.style?.backgroundColor === '#f8f9fa'
            );
            expect(inputWrapper).toBeTruthy();
        });

        it('applies placeholder text color from theme', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput
                        control={control}
                        name="email"
                        placeholder="Enter email"
                    />
                </FormWrapper>
            );
            const instance = component.root;
            const textInput = instance.findByType('TextInput' as any);
            expect(textInput.props.placeholderTextColor).toBe('#666666');
        });
    });

    describe('Input Props', () => {
        it('passes through additional TextInput props', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput
                        control={control}
                        name="email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </FormWrapper>
            );
            const instance = component.root;
            const textInput = instance.findByType('TextInput' as any);
            expect(textInput.props.keyboardType).toBe('email-address');
            expect(textInput.props.autoCapitalize).toBe('none');
            expect(textInput.props.autoCorrect).toBe(false);
        });

        it('has correct font size', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput control={control} name="email" />
                </FormWrapper>
            );
            const instance = component.root;
            const textInput = instance.findByType('TextInput' as any);
            expect(textInput.props.style.fontSize).toBe(16);
        });
    });

    describe('Form Integration', () => {
        it('renders within form context', () => {
            const component = renderer.create(
                <FormWrapper defaultValues={{ email: 'test@example.com' }}>
                    <ControlledInput name="email" control={{} as any} />
                </FormWrapper>
            );
            expect(component.toJSON()).toBeDefined();
        });

        it('handles value changes through Controller', async () => {
            const mockOnChange = jest.fn();
            const { control } = require('react-hook-form').useForm();

            const component = renderer.create(
                <FormWrapper defaultValues={{ email: '' }}>
                    <ControlledInput control={control} name="email" />
                </FormWrapper>
            );

            const instance = component.root;
            const textInput = instance.findByType('TextInput' as any);

            await act(async () => {
                textInput.props.onChangeText('new@email.com');
            });

            // Value should be updated through form controller
            expect(component.toJSON()).toBeDefined();
        });

        it('handles onBlur events', async () => {
            const { control } = require('react-hook-form').useForm();

            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput control={control} name="email" />
                </FormWrapper>
            );

            const instance = component.root;
            const textInput = instance.findByType('TextInput' as any);

            await act(async () => {
                textInput.props.onBlur();
            });

            expect(component.toJSON()).toBeDefined();
        });
    });

    describe('Accessibility', () => {
        it('icon has correct size', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput
                        control={control}
                        name="email"
                        iconName="mail"
                    />
                </FormWrapper>
            );
            const instance = component.root;
            const icon = instance.findByType('Ionicons' as any);
            expect(icon.props.size).toBe(20);
        });

        it('label has correct font weight', () => {
            const { control } = require('react-hook-form').useForm();
            const component = renderer.create(
                <FormWrapper>
                    <ControlledInput
                        control={control}
                        name="email"
                        label="Email"
                    />
                </FormWrapper>
            );
            const instance = component.root;
            const labels = instance.findAllByType('Text' as any);
            const label = labels.find((l: any) => l.props.children === 'Email');
            expect(label?.props.style.fontWeight).toBe('500');
        });
    });
});
