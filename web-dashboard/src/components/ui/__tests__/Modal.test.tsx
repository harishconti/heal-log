import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset body overflow
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
          <div>Modal content</div>
        </Modal>
      );
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('renders modal when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div>Modal content</div>
        </Modal>
      );
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('renders modal title', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="My Modal Title">
          <div>Content</div>
        </Modal>
      );
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveTextContent('My Modal Title');
    });

    it('renders children content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div data-testid="modal-content">Modal body content</div>
        </Modal>
      );
      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
      expect(screen.getByText('Modal body content')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size correctly', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title" size="sm">
          <div>Content</div>
        </Modal>
      );
      const modalContent = screen.getByRole('heading', { level: 2 }).closest('.relative');
      expect(modalContent).toHaveClass('max-w-sm');
    });

    it('applies medium size by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const modalContent = screen.getByRole('heading', { level: 2 }).closest('.relative');
      expect(modalContent).toHaveClass('max-w-md');
    });

    it('applies large size correctly', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title" size="lg">
          <div>Content</div>
        </Modal>
      );
      const modalContent = screen.getByRole('heading', { level: 2 }).closest('.relative');
      expect(modalContent).toHaveClass('max-w-lg');
    });

    it('applies xl size correctly', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title" size="xl">
          <div>Content</div>
        </Modal>
      );
      const modalContent = screen.getByRole('heading', { level: 2 }).closest('.relative');
      expect(modalContent).toHaveClass('max-w-xl');
    });
  });

  describe('Close Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const backdrop = document.querySelector('.bg-black\\/50');
      fireEvent.click(backdrop!);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose for other key presses', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Overflow', () => {
    it('sets body overflow to hidden when open', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('resets body overflow when closed', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Styling', () => {
    it('modal container has fixed positioning', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const modalContainer = document.querySelector('.fixed');
      expect(modalContainer).toBeInTheDocument();
    });

    it('modal container has high z-index', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const modalContainer = document.querySelector('.z-50');
      expect(modalContainer).toBeInTheDocument();
    });

    it('modal content has white background', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const modalContent = screen.getByRole('heading', { level: 2 }).closest('.relative');
      expect(modalContent).toHaveClass('bg-white');
    });

    it('modal content has rounded corners', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const modalContent = screen.getByRole('heading', { level: 2 }).closest('.relative');
      expect(modalContent).toHaveClass('rounded-xl');
    });

    it('modal content has shadow', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const modalContent = screen.getByRole('heading', { level: 2 }).closest('.relative');
      expect(modalContent).toHaveClass('shadow-xl');
    });

    it('modal content has padding', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const modalContent = screen.getByRole('heading', { level: 2 }).closest('.relative');
      expect(modalContent).toHaveClass('p-6');
    });

    it('modal content has full width', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const modalContent = screen.getByRole('heading', { level: 2 }).closest('.relative');
      expect(modalContent).toHaveClass('w-full');
    });

    it('title has correct styling', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-gray-900');
    });

    it('header has flex layout with spacing', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const header = screen.getByRole('heading', { level: 2 }).parentElement;
      expect(header).toHaveClass('flex', 'items-center', 'justify-between', 'mb-4');
    });
  });

  describe('Close Button Styling', () => {
    it('close button has correct styling', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveClass('p-1', 'text-gray-400', 'rounded-lg');
    });

    it('close button has hover states', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveClass('hover:text-gray-600', 'hover:bg-gray-100');
    });
  });

  describe('Backdrop', () => {
    it('renders semi-transparent backdrop', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const backdrop = document.querySelector('.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });

    it('backdrop covers full screen', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      const backdrop = document.querySelector('.bg-black\\/50');
      expect(backdrop).toHaveClass('fixed', 'inset-0');
    });
  });

  describe('Cleanup', () => {
    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const { unmount } = render(
        <Modal isOpen={true} onClose={mockOnClose} title="Title">
          <div>Content</div>
        </Modal>
      );
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});
