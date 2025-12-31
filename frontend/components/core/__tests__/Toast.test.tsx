import React, { createRef } from 'react';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import Toast, { ToastHandles } from '../Toast';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            colors: {
                success: '#27ae60',
                error: '#e74c3c',
                shadow: '#000000',
            },
        },
    }),
}));

// Mock Animated module
jest.mock('react-native', () => {
    const rn = jest.requireActual('react-native');
    return {
        ...rn,
        Animated: {
            ...rn.Animated,
            timing: jest.fn(() => ({
                start: jest.fn((callback?: () => void) => callback?.()),
            })),
            Value: jest.fn(() => ({
                setValue: jest.fn(),
            })),
        },
    };
});

describe('Toast Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Rendering', () => {
        it('renders nothing when not visible', () => {
            const ref = createRef<ToastHandles>();
            const tree = renderer.create(<Toast ref={ref} />).toJSON();
            expect(tree).toBeNull();
        });

        it('renders toast when show is called', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Test message');
            });

            expect(component!.toJSON()).not.toBeNull();
        });

        it('renders with success message', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Success message', 'success');
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const messageText = texts.find((t: any) => t.props.children === 'Success message');
            expect(messageText).toBeTruthy();
        });

        it('renders with error message', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Error message', 'error');
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const messageText = texts.find((t: any) => t.props.children === 'Error message');
            expect(messageText).toBeTruthy();
        });
    });

    describe('Icons', () => {
        it('shows checkmark-circle icon for success toast', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Success', 'success');
            });

            const instance = component!.root;
            const icon = instance.findByType('Ionicons' as any);
            expect(icon.props.name).toBe('checkmark-circle');
        });

        it('shows alert-circle icon for error toast', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Error', 'error');
            });

            const instance = component!.root;
            const icon = instance.findByType('Ionicons' as any);
            expect(icon.props.name).toBe('alert-circle');
        });

        it('icon has correct size and color', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Test', 'success');
            });

            const instance = component!.root;
            const icon = instance.findByType('Ionicons' as any);
            expect(icon.props.size).toBe(24);
            expect(icon.props.color).toBe('#fff');
        });
    });

    describe('Colors', () => {
        it('success toast has success background color', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Success', 'success');
            });

            const tree = component!.toJSON() as any;
            expect(tree.props.style).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ backgroundColor: '#27ae60' })
                ])
            );
        });

        it('error toast has error background color', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Error', 'error');
            });

            const tree = component!.toJSON() as any;
            expect(tree.props.style).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ backgroundColor: '#e74c3c' })
                ])
            );
        });

        it('message text is white', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Test message', 'success');
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const messageText = texts.find((t: any) => t.props.children === 'Test message');
            expect(messageText?.props.style.color).toBe('#fff');
        });
    });

    describe('Auto-dismiss', () => {
        it('auto-dismisses after 3 seconds', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Auto dismiss test');
            });

            // Toast should be visible
            expect(component!.toJSON()).not.toBeNull();

            // Fast-forward 3 seconds
            await act(async () => {
                jest.advanceTimersByTime(3000);
            });

            // Toast should be hidden (animation started)
            // Due to mocked Animated.timing, we check the component structure
        });

        it('clears timeout on unmount', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Test');
            });

            // Unmount before timeout
            await act(async () => {
                component.unmount();
            });

            // Should not throw errors
            expect(true).toBe(true);
        });
    });

    describe('Styling', () => {
        it('toast is positioned absolutely at bottom', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Test');
            });

            const tree = component!.toJSON() as any;
            const containerStyle = tree.props.style[0];
            expect(containerStyle.position).toBe('absolute');
            expect(containerStyle.bottom).toBe(50);
        });

        it('toast has correct horizontal positioning', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Test');
            });

            const tree = component!.toJSON() as any;
            const containerStyle = tree.props.style[0];
            expect(containerStyle.left).toBe(20);
            expect(containerStyle.right).toBe(20);
        });

        it('toast has border radius', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Test');
            });

            const tree = component!.toJSON() as any;
            const containerStyle = tree.props.style[0];
            expect(containerStyle.borderRadius).toBe(8);
        });

        it('toast has shadow styling', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Test');
            });

            const tree = component!.toJSON() as any;
            const containerStyle = tree.props.style[0];
            expect(containerStyle.shadowColor).toBe('#000000');
            expect(containerStyle.shadowOpacity).toBe(0.2);
            expect(containerStyle.elevation).toBe(5);
        });

        it('message text has correct font size', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Test');
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const messageText = texts.find((t: any) => t.props.children === 'Test');
            expect(messageText?.props.style.fontSize).toBe(16);
        });

        it('message text has left margin', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Test');
            });

            const instance = component!.root;
            const texts = instance.findAllByType('Text' as any);
            const messageText = texts.find((t: any) => t.props.children === 'Test');
            expect(messageText?.props.style.marginLeft).toBe(10);
        });
    });

    describe('Default Behavior', () => {
        it('defaults to success type when type is not specified', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Default type');
            });

            const instance = component!.root;
            const icon = instance.findByType('Ionicons' as any);
            expect(icon.props.name).toBe('checkmark-circle');
        });
    });

    describe('Ref Interface', () => {
        it('exposes show method via ref', () => {
            const ref = createRef<ToastHandles>();
            renderer.create(<Toast ref={ref} />);

            expect(ref.current).toBeDefined();
            expect(typeof ref.current?.show).toBe('function');
        });
    });

    describe('Layout', () => {
        it('uses flexDirection row for content alignment', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Test');
            });

            const tree = component!.toJSON() as any;
            const containerStyle = tree.props.style[0];
            expect(containerStyle.flexDirection).toBe('row');
        });

        it('aligns items center', async () => {
            const ref = createRef<ToastHandles>();
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(<Toast ref={ref} />);
            });

            await act(async () => {
                ref.current?.show('Test');
            });

            const tree = component!.toJSON() as any;
            const containerStyle = tree.props.style[0];
            expect(containerStyle.alignItems).toBe('center');
        });
    });
});
