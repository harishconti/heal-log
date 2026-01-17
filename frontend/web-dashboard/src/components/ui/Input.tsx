import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: ReactNode;
  suffixIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helpText,
      icon,
      suffixIcon,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = error ? errorId : helpText ? helperId : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-gray-900 mb-2"
          >
            {label}
            {required && <span className="text-danger-600 ml-1">*</span>}
            {!required && (
              <span className="text-gray-400 font-normal ml-2">(optional)</span>
            )}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            className={cn(
              'w-full h-10 px-4 text-base rounded-lg',
              'border-2 border-gray-200 transition-all duration-200',
              'focus:border-primary-600 focus:outline-none',
              'focus:ring-1 focus:ring-primary-100',
              'placeholder:text-gray-400',
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              icon && 'pl-10',
              suffixIcon && 'pr-10',
              error && 'border-danger-500 bg-danger-50 focus:border-danger-600 focus:ring-danger-100',
              !error && !disabled && 'hover:border-gray-300',
              className
            )}
            {...props}
          />

          {suffixIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {suffixIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="mt-1.5 text-sm text-danger-600 font-medium flex items-center gap-1.5 animate-slide-up"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {error}
          </p>
        )}

        {helpText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
