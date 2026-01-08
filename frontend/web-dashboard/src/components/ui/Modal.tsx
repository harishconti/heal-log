import { useEffect, useCallback, useRef, type ReactNode, useId } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional description for screen readers */
  ariaDescription?: string;
}

/**
 * Manages modal count using a ref-based counter stored on document body.
 * This avoids race conditions with module-level mutable state.
 */
function getModalCount(): number {
  const count = document.body.dataset.openModals;
  return count ? parseInt(count, 10) : 0;
}

function setModalCount(count: number): void {
  if (count <= 0) {
    delete document.body.dataset.openModals;
  } else {
    document.body.dataset.openModals = String(count);
  }
}

export function Modal({ isOpen, onClose, title, children, size = 'md', ariaDescription }: ModalProps) {
  // Generate unique IDs for ARIA attributes
  const titleId = useId();
  const descriptionId = useId();

  // Use ref to avoid stale closure issues with onClose callback
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Track if this modal instance has registered itself
  const hasRegisteredRef = useRef(false);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCloseRef.current();
    }
  }, []);

  // Focus trap handler
  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // If shift+tab on first element, move to last
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // If tab on last element, move to first
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Cleanup if modal was open and is now closing
      if (hasRegisteredRef.current) {
        const currentCount = getModalCount();
        setModalCount(currentCount - 1);
        if (currentCount - 1 <= 0) {
          document.body.style.overflow = 'unset';
        }
        hasRegisteredRef.current = false;

        // Restore focus to previous element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
          previousFocusRef.current = null;
        }
      }
      return;
    }

    // Save current focus before opening modal
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Register this modal
    if (!hasRegisteredRef.current) {
      const newCount = getModalCount() + 1;
      setModalCount(newCount);
      hasRegisteredRef.current = true;
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTabKey);

    // Move focus to close button when modal opens
    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);

      // Cleanup on unmount
      if (hasRegisteredRef.current) {
        const currentCount = getModalCount();
        setModalCount(currentCount - 1);
        if (currentCount - 1 <= 0) {
          document.body.style.overflow = 'unset';
        }
        hasRegisteredRef.current = false;

        // Restore focus to previous element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
          previousFocusRef.current = null;
        }
      }
    };
  }, [isOpen, handleEscape, handleTabKey]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={ariaDescription ? descriptionId : undefined}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop with blur */}
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal panel */}
        <div
          ref={modalRef}
          className={`
            relative bg-white rounded-2xl shadow-xl
            ${sizes[size]} w-full p-6 z-10
            transform transition-all
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 id={titleId} className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
              type="button"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Screen reader description */}
          {ariaDescription && (
            <p id={descriptionId} className="sr-only">
              {ariaDescription}
            </p>
          )}

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
