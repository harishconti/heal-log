import React from 'react';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import RegisterScreen from '../register';

// Mock all dependencies
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
}));

const mockRegister = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        register: mockRegister,
        user: null,
    }),
}));

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            colors: {
                primary: '#2ecc71',
                secondary: '#3498db',
                background: '#f8f9fa',
                surface: '#ffffff',
                text: '#333333',
                textSecondary: '#666666',
                border: '#e9ecef',
                primaryMuted: '#a8e6cf',
            },
        },
        fontScale: 1,
    }),
}));

jest.mock('@/utils/errorMessages', () => ({
    getErrorMessage: jest.fn((msg) => msg),
    isDuplicateEmailError: jest.fn(() => false),
}));

describe('RegisterScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders correctly', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });
            expect(component!.toJSON()).toMatchSnapshot();
        });

        it('renders Create Account title', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const title = texts.find((t: any) => t.props.children === 'Create Account');
            expect(title).toBeTruthy();
        });

        it('renders subtitle', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const subtitle = texts.find((t: any) => t.props.children === 'Join HealLog today');
            expect(subtitle).toBeTruthy();
        });

        it('renders back button', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const icons = instance.findAllByType('Ionicons' as any);
            const backIcon = icons.find((i: any) => i.props.name === 'arrow-back');
            expect(backIcon).toBeTruthy();
        });
    });

    describe('Form Fields', () => {
        it('renders Full Name input', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const nameInput = textInputs.find((i: any) => i.props.placeholder === 'Full Name *');
            expect(nameInput).toBeTruthy();
        });

        it('Full Name input has autoCapitalize set to words', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const nameInput = textInputs.find((i: any) => i.props.placeholder === 'Full Name *');
            expect(nameInput.props.autoCapitalize).toBe('words');
        });

        it('renders Email input', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const emailInput = textInputs.find((i: any) => i.props.placeholder === 'Email Address *');
            expect(emailInput).toBeTruthy();
        });

        it('Email input has email keyboard type', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const emailInput = textInputs.find((i: any) => i.props.placeholder === 'Email Address *');
            expect(emailInput.props.keyboardType).toBe('email-address');
        });

        it('renders Phone Number input', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const phoneInput = textInputs.find((i: any) => i.props.placeholder === 'Phone Number');
            expect(phoneInput).toBeTruthy();
        });

        it('Phone input has phone-pad keyboard type', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const phoneInput = textInputs.find((i: any) => i.props.placeholder === 'Phone Number');
            expect(phoneInput.props.keyboardType).toBe('phone-pad');
        });

        it('renders Password input', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const passwordInput = textInputs.find((i: any) =>
                i.props.placeholder?.includes('Password *') && i.props.placeholder?.includes('min 8 chars')
            );
            expect(passwordInput).toBeTruthy();
        });

        it('renders Confirm Password input', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const confirmInput = textInputs.find((i: any) => i.props.placeholder === 'Confirm Password *');
            expect(confirmInput).toBeTruthy();
        });

        it('Password inputs have secure text entry', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const secureInputs = textInputs.filter((i: any) => i.props.secureTextEntry === true);
            expect(secureInputs.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Specialty Picker', () => {
        it('renders specialty picker', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            // Default specialty is 'general', displayed as 'General'
            const specialtyText = texts.find((t: any) => t.props.children === 'General');
            expect(specialtyText).toBeTruthy();
        });

        it('shows chevron-down icon for specialty picker', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const icons = instance.findAllByType('Ionicons' as any);
            const chevronIcon = icons.find((i: any) => i.props.name === 'chevron-down');
            expect(chevronIcon).toBeTruthy();
        });

        it('shows medical icon for specialty field', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const icons = instance.findAllByType('Ionicons' as any);
            const medicalIcon = icons.find((i: any) => i.props.name === 'medical');
            expect(medicalIcon).toBeTruthy();
        });

        it('modal is initially not visible', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const modal = instance.findByType('Modal' as any);
            expect(modal.props.visible).toBe(false);
        });

        it('opens specialty modal when picker is pressed', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const touchables = instance.findAllByType('TouchableOpacity' as any);
            // Find the picker touchable (contains 'General' text)
            const pickerTouchable = touchables.find((t: any) => {
                try {
                    const texts = t.findAllByType('Text' as any);
                    return texts.some((text: any) => text.props.children === 'General');
                } catch {
                    return false;
                }
            });

            await act(async () => {
                pickerTouchable?.props.onPress();
            });

            const modal = instance.findByType('Modal' as any);
            expect(modal.props.visible).toBe(true);
        });

        it('modal shows Select Department title', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const touchables = instance.findAllByType('TouchableOpacity' as any);
            const pickerTouchable = touchables.find((t: any) => {
                try {
                    const texts = t.findAllByType('Text' as any);
                    return texts.some((text: any) => text.props.children === 'General');
                } catch {
                    return false;
                }
            });

            await act(async () => {
                pickerTouchable?.props.onPress();
            });

            const texts = instance.findAllByType('Text' as any);
            const modalTitle = texts.find((t: any) => t.props.children === 'Select Department');
            expect(modalTitle).toBeTruthy();
        });
    });

    describe('Buttons', () => {
        it('renders Create Account button', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const createAccountBtn = texts.find((t: any) => t.props.children === 'Create Account');
            expect(createAccountBtn).toBeTruthy();
        });

        it('Create Account button has primary background color', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const touchables = instance.findAllByType('TouchableOpacity' as any);
            const createAccountButton = touchables.find((t: any) => {
                const style = t.props.style;
                if (Array.isArray(style)) {
                    return style.some((s: any) => s?.backgroundColor === '#2ecc71');
                }
                return style?.backgroundColor === '#2ecc71';
            });
            expect(createAccountButton).toBeTruthy();
        });

        it('renders Sign In link', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const signInLink = texts.find((t: any) =>
                t.props.children?.includes?.('Already have an account?') ||
                t.props.children === 'Sign In'
            );
            expect(signInLink).toBeTruthy();
        });
    });

    describe('Form Icons', () => {
        it('shows person icon for name field', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const icons = instance.findAllByType('Ionicons' as any);
            const personIcon = icons.find((i: any) => i.props.name === 'person');
            expect(personIcon).toBeTruthy();
        });

        it('shows mail icon for email field', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const icons = instance.findAllByType('Ionicons' as any);
            const mailIcon = icons.find((i: any) => i.props.name === 'mail');
            expect(mailIcon).toBeTruthy();
        });

        it('shows call icon for phone field', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const icons = instance.findAllByType('Ionicons' as any);
            const callIcon = icons.find((i: any) => i.props.name === 'call');
            expect(callIcon).toBeTruthy();
        });

        it('shows lock-closed icons for password fields', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const icons = instance.findAllByType('Ionicons' as any);
            const lockIcons = icons.filter((i: any) => i.props.name === 'lock-closed');
            expect(lockIcons.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Styling', () => {
        it('has correct background color', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const tree = component!.toJSON() as any;
            expect(tree.props.style.backgroundColor).toBe('#f8f9fa');
        });

        it('title has correct styling', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const title = texts.find((t: any) => t.props.children === 'Create Account');
            expect(title?.props.style.color).toBe('#333333');
            expect(title?.props.style.fontWeight).toBe('bold');
            expect(title?.props.style.fontSize).toBe(28);
        });

        it('subtitle has secondary color', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const subtitle = texts.find((t: any) => t.props.children === 'Join HealLog today');
            expect(subtitle?.props.style.color).toBe('#666666');
        });
    });

    describe('Layout', () => {
        it('uses SafeAreaView as root', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const tree = component!.toJSON() as any;
            expect(tree.type).toBe('RCTSafeAreaView');
        });

        it('uses KeyboardAvoidingView', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const keyboardAvoid = instance.findByType('KeyboardAvoidingView' as any);
            expect(keyboardAvoid).toBeTruthy();
        });

        it('uses ScrollView', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            const scrollView = instance.findByType('ScrollView' as any);
            expect(scrollView).toBeTruthy();
        });
    });

    describe('Specialty List', () => {
        it('specialty list contains General option', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            // Open modal
            const touchables = instance.findAllByType('TouchableOpacity' as any);
            const pickerTouchable = touchables.find((t: any) => {
                try {
                    const texts = t.findAllByType('Text' as any);
                    return texts.some((text: any) => text.props.children === 'General');
                } catch {
                    return false;
                }
            });

            await act(async () => {
                pickerTouchable?.props.onPress();
            });

            const flatList = instance.findByType('FlatList' as any);
            expect(flatList.props.data).toContain('general');
        });

        it('specialty list contains Cardiology option', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<RegisterScreen />);
            });

            const instance = component!.root;
            // Open modal
            const touchables = instance.findAllByType('TouchableOpacity' as any);
            const pickerTouchable = touchables.find((t: any) => {
                try {
                    const texts = t.findAllByType('Text' as any);
                    return texts.some((text: any) => text.props.children === 'General');
                } catch {
                    return false;
                }
            });

            await act(async () => {
                pickerTouchable?.props.onPress();
            });

            const flatList = instance.findByType('FlatList' as any);
            expect(flatList.props.data).toContain('cardiology');
        });
    });
});
