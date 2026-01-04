import { useEffect, useCallback, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Use ref to avoid stale closure issues with onClose callback
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Track if this modal instance has registered itself
  const hasRegisteredRef = useRef(false);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCloseRef.current();
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
      }
      return;
    }

    // Register this modal
    if (!hasRegisteredRef.current) {
      const newCount = getModalCount() + 1;
      setModalCount(newCount);
      hasRegisteredRef.current = true;
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);

      // Cleanup on unmount
      if (hasRegisteredRef.current) {
        const currentCount = getModalCount();
        setModalCount(currentCount - 1);
        if (currentCount - 1 <= 0) {
          document.body.style.overflow = 'unset';
        }
        hasRegisteredRef.current = false;
      }
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop with blur */}
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div
          className={`
            relative bg-white rounded-2xl shadow-xl
            ${sizes[size]} w-full p-6 z-10
            transform transition-all
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
