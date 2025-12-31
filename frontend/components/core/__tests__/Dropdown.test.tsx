import React from 'react';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import Dropdown from '../Dropdown';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            colors: {
                text: '#333333',
                textSecondary: '#666666',
                surface: '#ffffff',
                border: '#e9ecef',
            },
        },
    }),
}));

describe('Dropdown Component', () => {
    const mockOptions = [
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' },
        { label: 'Option 3', value: 'opt3' },
    ];
    const mockOnValueChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders correctly with default props', () => {
            const tree = renderer.create(
                <Dropdown
                    options={mockOptions}
                    selectedValue="opt1"
                    onValueChange={mockOnValueChange}
                />
            ).toJSON();
            expect(tree).toMatchSnapshot();
        });

        it('displays selected option label', () => {
            const component = renderer.create(
                <Dropdown
                    options={mockOptions}
                    selectedValue="opt2"
                    onValueChange={mockOnValueChange}
                />
            );
            const instance = component.root;
            const texts = instance.findAllByType('Text' as any);
            const selectedText = texts.find((t: any) => t.props.children === 'Option 2');
            expect(selectedText).toBeTruthy();
        });

        it('displays chevron-down icon', () => {
            const component = renderer.create(
                <Dropdown
                    options={mockOptions}
                    selectedValue="opt1"
                    onValueChange={mockOnValueChange}
                />
            );
            const instance = component.root;
            const icon = instance.findByType('Ionicons' as any);
            expect(icon.props.name).toBe('chevron-down');
        });

        it('icon has correct size and color', () => {
            const component = renderer.create(
                <Dropdown
                    options={mockOptions}
                    selectedValue="opt1"
                    onValueChange={mockOnValueChange}
                />
            );
            const instance = component.root;
            const icon = instance.findByType('Ionicons' as any);
            expect(icon.props.size).toBe(20);
            expect(icon.props.color).toBe('#666666');
        });
    });

    describe('Modal Behavior', () => {
        it('modal is initially not visible', () => {
            const component = renderer.create(
                <Dropdown
                    options={mockOptions}
                    selectedValue="opt1"
                    onValueChange={mockOnValueChange}
                />
            );
            const instance = component.root;
            const modal = instance.findByType('Modal' as any);
            expect(modal.props.visible).toBe(false);
        });

        it('opens modal when dropdown is pressed', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <Dropdown
                        options={mockOptions}
                        selectedValue="opt1"
                        onValueChange={mockOnValueChange}
                    />
                );
            });

            const instance = component!.root;
            const touchables = instance.findAllByType('TouchableOpacity' as any);
            const dropdownButton = touchables[0];

            await act(async () => {
                dropdownButton.props.onPress();
            });

            const modal = instance.findByType('Modal' as any);
            expect(modal.props.visible).toBe(true);
        });

        it('modal is transparent', () => {
            const component = renderer.create(
                <Dropdown
                    options={mockOptions}
                    selectedValue="opt1"
                    onValueChange={mockOnValueChange}
                />
            );
            const instance = component.root;
            const modal = instance.findByType('Modal' as any);
            expect(modal.props.transparent).toBe(true);
        });

        it('closes modal when overlay is pressed', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <Dropdown
                        options={mockOptions}
                        selectedValue="opt1"
                        onValueChange={mockOnValueChange}
                    />
                );
            });

            const instance = component!.root;

            // Open modal first
            const dropdownButton = instance.findAllByType('TouchableOpacity' as any)[0];
            await act(async () => {
                dropdownButton.props.onPress();
            });

            // Verify modal is open
            let modal = instance.findByType('Modal' as any);
            expect(modal.props.visible).toBe(true);

            // Close by pressing overlay (first touchable inside modal)
            const overlayTouchable = instance.findAllByType('TouchableOpacity' as any)[1];
            await act(async () => {
                overlayTouchable.props.onPress();
            });

            modal = instance.findByType('Modal' as any);
            expect(modal.props.visible).toBe(false);
        });
    });

    describe('Options', () => {
        it('renders all options in FlatList', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <Dropdown
                        options={mockOptions}
                        selectedValue="opt1"
                        onValueChange={mockOnValueChange}
                    />
                );
            });

            const instance = component!.root;

            // Open modal
            const dropdownButton = instance.findAllByType('TouchableOpacity' as any)[0];
            await act(async () => {
                dropdownButton.props.onPress();
            });

            const flatList = instance.findByType('FlatList' as any);
            expect(flatList.props.data).toEqual(mockOptions);
        });

        it('calls onValueChange when option is selected', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <Dropdown
                        options={mockOptions}
                        selectedValue="opt1"
                        onValueChange={mockOnValueChange}
                    />
                );
            });

            const instance = component!.root;

            // Open modal
            const dropdownButton = instance.findAllByType('TouchableOpacity' as any)[0];
            await act(async () => {
                dropdownButton.props.onPress();
            });

            // Render an option using renderItem
            const flatList = instance.findByType('FlatList' as any);
            const renderItem = flatList.props.renderItem;
            const optionComponent = renderer.create(
                renderItem({ item: mockOptions[1] })
            );

            const optionButton = optionComponent.root.findByType('TouchableOpacity' as any);
            await act(async () => {
                optionButton.props.onPress();
            });

            expect(mockOnValueChange).toHaveBeenCalledWith('opt2');
        });

        it('closes modal after selecting an option', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <Dropdown
                        options={mockOptions}
                        selectedValue="opt1"
                        onValueChange={mockOnValueChange}
                    />
                );
            });

            const instance = component!.root;

            // Open modal
            const dropdownButton = instance.findAllByType('TouchableOpacity' as any)[0];
            await act(async () => {
                dropdownButton.props.onPress();
            });

            // Select an option
            const flatList = instance.findByType('FlatList' as any);
            const renderItem = flatList.props.renderItem;
            const optionComponent = renderer.create(
                renderItem({ item: mockOptions[1] })
            );

            const optionButton = optionComponent.root.findByType('TouchableOpacity' as any);
            await act(async () => {
                optionButton.props.onPress();
            });

            const modal = instance.findByType('Modal' as any);
            expect(modal.props.visible).toBe(false);
        });

        it('FlatList uses value as keyExtractor', async () => {
            let component: ReactTestRenderer;

            await act(async () => {
                component = renderer.create(
                    <Dropdown
                        options={mockOptions}
                        selectedValue="opt1"
                        onValueChange={mockOnValueChange}
                    />
                );
            });

            const instance = component!.root;

            // Open modal
            const dropdownButton = instance.findAllByType('TouchableOpacity' as any)[0];
            await act(async () => {
                dropdownButton.props.onPress();
            });

            const flatList = instance.findByType('FlatList' as any);
            const key = flatList.props.keyExtractor(mockOptions[0]);
            expect(key).toBe('opt1');
        });
    });

    describe('Styling', () => {
        it('dropdown has correct border styling', () => {
            const component = renderer.create(
                <Dropdown
                    options={mockOptions}
                    selectedValue="opt1"
                    onValueChange={mockOnValueChange}
                />
            );
            const tree = component.toJSON() as any;
            expect(tree.props.style.borderWidth).toBe(1);
            expect(tree.props.style.borderColor).toBe('#e9ecef');
            expect(tree.props.style.borderRadius).toBe(8);
        });

        it('dropdown has correct background color', () => {
            const component = renderer.create(
                <Dropdown
                    options={mockOptions}
                    selectedValue="opt1"
                    onValueChange={mockOnValueChange}
                />
            );
            const tree = component.toJSON() as any;
            expect(tree.props.style.backgroundColor).toBe('#ffffff');
        });

        it('dropdown text has correct color', () => {
            const component = renderer.create(
                <Dropdown
                    options={mockOptions}
                    selectedValue="opt1"
                    onValueChange={mockOnValueChange}
                />
            );
            const instance = component.root;
            const texts = instance.findAllByType('Text' as any);
            const selectedText = texts.find((t: any) => t.props.children === 'Option 1');
            expect(selectedText?.props.style.color).toBe('#333333');
        });

        it('dropdown text has correct font size', () => {
            const component = renderer.create(
                <Dropdown
                    options={mockOptions}
                    selectedValue="opt1"
                    onValueChange={mockOnValueChange}
                />
            );
            const instance = component.root;
            const texts = instance.findAllByType('Text' as any);
            const selectedText = texts.find((t: any) => t.props.children === 'Option 1');
            expect(selectedText?.props.style.fontSize).toBe(16);
        });
    });

    describe('Edge Cases', () => {
        it('handles empty options array', () => {
            const component = renderer.create(
                <Dropdown
                    options={[]}
                    selectedValue=""
                    onValueChange={mockOnValueChange}
                />
            );
            expect(component.toJSON()).toBeDefined();
        });

        it('handles undefined selected value gracefully', () => {
            const component = renderer.create(
                <Dropdown
                    options={mockOptions}
                    selectedValue="nonexistent"
                    onValueChange={mockOnValueChange}
                />
            );
            const instance = component.root;
            const texts = instance.findAllByType('Text' as any);
            // Should not crash, label might be undefined
            expect(component.toJSON()).toBeDefined();
        });

        it('handles single option', () => {
            const singleOption = [{ label: 'Only Option', value: 'only' }];
            const component = renderer.create(
                <Dropdown
                    options={singleOption}
                    selectedValue="only"
                    onValueChange={mockOnValueChange}
                />
            );
            const instance = component.root;
            const texts = instance.findAllByType('Text' as any);
            const selectedText = texts.find((t: any) => t.props.children === 'Only Option');
            expect(selectedText).toBeTruthy();
        });
    });
});
