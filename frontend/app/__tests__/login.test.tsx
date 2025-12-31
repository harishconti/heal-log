import React from 'react';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import LoginScreen from '../login';

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

const mockLogin = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
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

jest.mock('@/store/useAppStore', () => ({
    useAppStore: () => ({
        loading: { login: false },
        setLoading: jest.fn(),
    }),
}));

jest.mock('@/utils/monitoring', () => ({
    addBreadcrumb: jest.fn(),
}));

jest.mock('@/utils/errorMessages', () => ({
    getErrorMessage: jest.fn((msg) => msg),
    isVerificationError: jest.fn(() => false),
}));

describe('LoginScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders correctly', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });
            expect(component!.toJSON()).toMatchSnapshot();
        });

        it('renders the HealLog title', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const title = texts.find((t: any) => t.props.children === 'HealLog');
            expect(title).toBeTruthy();
        });

        it('renders the subtitle', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const subtitle = texts.find((t: any) => t.props.children === 'Professional Patient Management');
            expect(subtitle).toBeTruthy();
        });

        it('renders medical icon', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const icons = instance.findAllByType('Ionicons' as any);
            const medicalIcon = icons.find((i: any) => i.props.name === 'medical');
            expect(medicalIcon).toBeTruthy();
            expect(medicalIcon.props.size).toBe(64);
            expect(medicalIcon.props.color).toBe('#2ecc71');
        });
    });

    describe('Form Fields', () => {
        it('renders email input field', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const emailInput = textInputs.find((i: any) => i.props.placeholder === 'Email Address');
            expect(emailInput).toBeTruthy();
        });

        it('email input has correct keyboard type', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const emailInput = textInputs.find((i: any) => i.props.placeholder === 'Email Address');
            expect(emailInput.props.keyboardType).toBe('email-address');
        });

        it('email input has autoCapitalize set to none', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const emailInput = textInputs.find((i: any) => i.props.placeholder === 'Email Address');
            expect(emailInput.props.autoCapitalize).toBe('none');
        });

        it('renders password input field', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const passwordInput = textInputs.find((i: any) => i.props.placeholder === 'Password');
            expect(passwordInput).toBeTruthy();
        });

        it('password input has secure text entry', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const textInputs = instance.findAllByType('TextInput' as any);
            const passwordInput = textInputs.find((i: any) => i.props.placeholder === 'Password');
            expect(passwordInput.props.secureTextEntry).toBe(true);
        });
    });

    describe('Buttons', () => {
        it('renders Sign In button', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const signInButton = texts.find((t: any) => t.props.children === 'Sign In');
            expect(signInButton).toBeTruthy();
        });

        it('Sign In button has primary color', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const touchables = instance.findAllByType('TouchableOpacity' as any);
            const signInButton = touchables.find((t: any) =>
                t.props.style?.backgroundColor === '#2ecc71' ||
                (Array.isArray(t.props.style) && t.props.style.some((s: any) => s?.backgroundColor === '#2ecc71'))
            );
            expect(signInButton).toBeTruthy();
        });

        it('renders Create New Account button', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const registerButton = texts.find((t: any) => t.props.children === 'Create New Account');
            expect(registerButton).toBeTruthy();
        });

        it('renders Forgot Password link', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const forgotPassword = texts.find((t: any) => t.props.children === 'Forgot Password?');
            expect(forgotPassword).toBeTruthy();
        });

        it('Forgot Password link has primary color', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const forgotPassword = texts.find((t: any) => t.props.children === 'Forgot Password?');
            expect(forgotPassword?.props.style.color).toBe('#2ecc71');
        });
    });

    describe('Features Section', () => {
        it('renders Patient Management feature', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const patientManagement = texts.find((t: any) => t.props.children === 'Patient Management');
            expect(patientManagement).toBeTruthy();
        });

        it('renders Medical Notes feature', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const medicalNotes = texts.find((t: any) => t.props.children === 'Medical Notes');
            expect(medicalNotes).toBeTruthy();
        });

        it('renders Cloud Sync feature', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const cloudSync = texts.find((t: any) => t.props.children === 'Cloud Sync');
            expect(cloudSync).toBeTruthy();
        });

        it('renders feature icons', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const icons = instance.findAllByType('Ionicons' as any);
            const peopleIcon = icons.find((i: any) => i.props.name === 'people');
            const documentIcon = icons.find((i: any) => i.props.name === 'document-text');
            const cloudIcon = icons.find((i: any) => i.props.name === 'cloud');

            expect(peopleIcon).toBeTruthy();
            expect(documentIcon).toBeTruthy();
            expect(cloudIcon).toBeTruthy();
        });
    });

    describe('Styling', () => {
        it('has correct background color from theme', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const tree = component!.toJSON() as any;
            expect(tree.props.style.backgroundColor).toBe('#f8f9fa');
        });

        it('title has correct text color', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const title = texts.find((t: any) => t.props.children === 'HealLog');
            expect(title?.props.style.color).toBe('#333333');
        });

        it('title has correct font size with scale', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const title = texts.find((t: any) => t.props.children === 'HealLog');
            expect(title?.props.style.fontSize).toBe(28); // 28 * fontScale(1)
        });

        it('subtitle has secondary text color', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const subtitle = texts.find((t: any) => t.props.children === 'Professional Patient Management');
            expect(subtitle?.props.style.color).toBe('#666666');
        });
    });

    describe('Divider', () => {
        it('renders divider with "or" text', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const dividerText = texts.find((t: any) => t.props.children === 'or');
            expect(dividerText).toBeTruthy();
        });

        it('divider text has secondary color', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const dividerText = texts.find((t: any) => t.props.children === 'or');
            expect(dividerText?.props.style.color).toBe('#666666');
        });
    });

    describe('Layout', () => {
        it('uses SafeAreaView as root container', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const tree = component!.toJSON() as any;
            expect(tree.type).toBe('RCTSafeAreaView');
        });

        it('uses KeyboardAvoidingView', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const keyboardAvoid = instance.findByType('KeyboardAvoidingView' as any);
            expect(keyboardAvoid).toBeTruthy();
        });

        it('uses ScrollView for content', async () => {
            let component: ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const instance = component!.root;
            const scrollView = instance.findByType('ScrollView' as any);
            expect(scrollView).toBeTruthy();
        });
    });
});
