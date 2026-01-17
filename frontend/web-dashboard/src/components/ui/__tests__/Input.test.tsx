import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders label text correctly', () => {
      render(<Input label="Username" />);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('generates id from label', () => {
      render(<Input label="Email Address" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'email-address');
    });

    it('uses provided id over generated one', () => {
      render(<Input label="Email" id="custom-id" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('Error State', () => {
    it('displays error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('error message has danger color', () => {
      render(<Input error="Error message" />);
      const errorText = screen.getByText('Error message');
      expect(errorText).toHaveClass('text-danger-600');
    });

    it('input has error border styling', () => {
      render(<Input error="Error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-danger-500');
    });

    it('does not show help text when error is present', () => {
      render(<Input error="Error" helpText="Help text" />);
      expect(screen.queryByText('Help text')).not.toBeInTheDocument();
    });
  });

  describe('Help Text', () => {
    it('displays help text when no error', () => {
      render(<Input helpText="This is a hint" />);
      expect(screen.getByText('This is a hint')).toBeInTheDocument();
    });

    it('help text has gray color', () => {
      render(<Input helpText="Help text" />);
      const helpText = screen.getByText('Help text');
      expect(helpText).toHaveClass('text-gray-500');
    });
  });

  describe('Styling', () => {
    it('has full width', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('w-full');
    });

    it('has rounded border', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('rounded-lg');
    });

    it('has border styling', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-2');
    });

    it('has focus border styling', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:border-primary-600');
    });

    it('has disabled styling', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:bg-gray-50', 'disabled:cursor-not-allowed');
    });

    it('applies custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('label has correct styling', () => {
      render(<Input label="Email" />);
      const label = screen.getByText('Email');
      expect(label).toHaveClass('text-sm', 'font-semibold', 'text-gray-900');
    });
  });

  describe('Input Types', () => {
    it('renders as textbox by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      // Input without explicit type renders as text input (default HTML behavior)
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('renders email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders password input', () => {
      render(<Input type="password" />);
      // Password inputs don't have role="textbox"
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles value changes', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('handles focus events', () => {
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalled();
    });

    it('handles blur events', () => {
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalled();
    });

    it('respects disabled state', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('Placeholder', () => {
    it('displays placeholder text', () => {
      render(<Input placeholder="Enter your email" />);
      const input = screen.getByPlaceholderText('Enter your email');
      expect(input).toBeInTheDocument();
    });

    it('has placeholder color styling', () => {
      render(<Input placeholder="Placeholder" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('placeholder:text-gray-400');
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = { current: null as HTMLInputElement | null };
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Container', () => {
    it('wraps input in a full width container', () => {
      render(<Input label="Test" />);
      const container = screen.getByRole('textbox').closest('div')?.parentElement;
      expect(container).toHaveClass('w-full');
    });
  });

  describe('Accessibility', () => {
    it('associates label with input via htmlFor', () => {
      render(<Input label="Email" />);
      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', input.id);
    });
  });
});
