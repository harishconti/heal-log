import React from 'react';
import renderer from 'react-test-renderer';
import OfflineIndicator from '../OfflineIndicator';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            colors: {
                error: '#e74c3c',
            },
        },
    }),
}));

const mockUseNetwork = jest.fn();
jest.mock('@/contexts/NetworkContext', () => ({
    useNetwork: () => mockUseNetwork(),
}));

describe('OfflineIndicator Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders nothing when connected', () => {
            mockUseNetwork.mockReturnValue({ isConnected: true });

            const tree = renderer.create(<OfflineIndicator />).toJSON();
            expect(tree).toBeNull();
        });

        it('renders indicator when offline', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const tree = renderer.create(<OfflineIndicator />).toJSON();
            expect(tree).not.toBeNull();
        });

        it('matches snapshot when offline', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const tree = renderer.create(<OfflineIndicator />).toJSON();
            expect(tree).toMatchSnapshot();
        });
    });

    describe('Icon', () => {
        it('displays cloud-offline icon', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const component = renderer.create(<OfflineIndicator />);
            const instance = component.root;
            const icon = instance.findByType('Ionicons' as any);

            expect(icon.props.name).toBe('cloud-offline');
        });

        it('icon has correct size', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const component = renderer.create(<OfflineIndicator />);
            const instance = component.root;
            const icon = instance.findByType('Ionicons' as any);

            expect(icon.props.size).toBe(16);
        });

        it('icon has white color', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const component = renderer.create(<OfflineIndicator />);
            const instance = component.root;
            const icon = instance.findByType('Ionicons' as any);

            expect(icon.props.color).toBe('#fff');
        });

        it('icon has right margin', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const component = renderer.create(<OfflineIndicator />);
            const instance = component.root;
            const icon = instance.findByType('Ionicons' as any);

            expect(icon.props.style.marginRight).toBe(8);
        });
    });

    describe('Message', () => {
        it('displays offline message', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const component = renderer.create(<OfflineIndicator />);
            const instance = component.root;
            const texts = instance.findAllByType('Text' as any);
            const messageText = texts.find((t: any) =>
                t.props.children === 'You are offline. Changes will sync when online.'
            );

            expect(messageText).toBeTruthy();
        });

        it('message has white color', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const component = renderer.create(<OfflineIndicator />);
            const instance = component.root;
            const text = instance.findByType('Text' as any);

            expect(text.props.style.color).toBe('#fff');
        });

        it('message has correct font size', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const component = renderer.create(<OfflineIndicator />);
            const instance = component.root;
            const text = instance.findByType('Text' as any);

            expect(text.props.style.fontSize).toBe(12);
        });

        it('message has semibold font weight', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const component = renderer.create(<OfflineIndicator />);
            const instance = component.root;
            const text = instance.findByType('Text' as any);

            expect(text.props.style.fontWeight).toBe('600');
        });
    });

    describe('Styling', () => {
        it('container has error background color from theme', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const tree = renderer.create(<OfflineIndicator />).toJSON() as any;

            expect(tree.props.style).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ backgroundColor: '#e74c3c' })
                ])
            );
        });

        it('container uses flexDirection row', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const tree = renderer.create(<OfflineIndicator />).toJSON() as any;
            const containerStyle = tree.props.style[0];

            expect(containerStyle.flexDirection).toBe('row');
        });

        it('container aligns items center', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const tree = renderer.create(<OfflineIndicator />).toJSON() as any;
            const containerStyle = tree.props.style[0];

            expect(containerStyle.alignItems).toBe('center');
        });

        it('container justifies content center', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const tree = renderer.create(<OfflineIndicator />).toJSON() as any;
            const containerStyle = tree.props.style[0];

            expect(containerStyle.justifyContent).toBe('center');
        });

        it('container has vertical padding', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const tree = renderer.create(<OfflineIndicator />).toJSON() as any;
            const containerStyle = tree.props.style[0];

            expect(containerStyle.paddingVertical).toBe(8);
        });

        it('container has horizontal padding', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const tree = renderer.create(<OfflineIndicator />).toJSON() as any;
            const containerStyle = tree.props.style[0];

            expect(containerStyle.paddingHorizontal).toBe(16);
        });

        it('container spans full width', () => {
            mockUseNetwork.mockReturnValue({ isConnected: false });

            const tree = renderer.create(<OfflineIndicator />).toJSON() as any;
            const containerStyle = tree.props.style[0];

            expect(containerStyle.width).toBe('100%');
        });
    });

    describe('Network State Changes', () => {
        it('shows indicator when going offline', () => {
            // Start connected
            mockUseNetwork.mockReturnValue({ isConnected: true });
            const component = renderer.create(<OfflineIndicator />);
            expect(component.toJSON()).toBeNull();

            // Go offline
            mockUseNetwork.mockReturnValue({ isConnected: false });
            component.update(<OfflineIndicator />);
            expect(component.toJSON()).not.toBeNull();
        });

        it('hides indicator when coming back online', () => {
            // Start offline
            mockUseNetwork.mockReturnValue({ isConnected: false });
            const component = renderer.create(<OfflineIndicator />);
            expect(component.toJSON()).not.toBeNull();

            // Come online
            mockUseNetwork.mockReturnValue({ isConnected: true });
            component.update(<OfflineIndicator />);
            expect(component.toJSON()).toBeNull();
        });
    });

    describe('Edge Cases', () => {
        it('handles undefined isConnected', () => {
            mockUseNetwork.mockReturnValue({ isConnected: undefined });

            // undefined is falsy, so should show indicator
            const tree = renderer.create(<OfflineIndicator />).toJSON();
            expect(tree).not.toBeNull();
        });

        it('handles null network context gracefully', () => {
            mockUseNetwork.mockReturnValue({});

            // Should not crash, isConnected will be undefined (falsy)
            const tree = renderer.create(<OfflineIndicator />).toJSON();
            expect(tree).not.toBeNull();
        });
    });
});
