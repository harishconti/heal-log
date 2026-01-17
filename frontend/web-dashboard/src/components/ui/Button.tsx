import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      icon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-lg ' +
      'transition-all duration-200 ease-out ' +
      'focus:outline-2 focus:outline-offset-2 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ' +
      'active:scale-[0.98]';

    const variants = {
      primary:
        'bg-primary-600 text-white shadow-md hover:bg-primary-700 hover:shadow-lg ' +
        'hover:-translate-y-0.5 active:translate-y-0 focus:outline-primary-600',
      secondary:
        'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 ' +
        'focus:outline-gray-400',
      outline:
        'border-2 border-gray-300 text-gray-900 bg-white ' +
        'hover:border-primary-600 hover:text-primary-600 hover:bg-primary-50 ' +
        'focus:outline-primary-600',
      ghost:
        'text-gray-700 hover:bg-gray-100 focus:outline-gray-400',
      danger:
        'bg-danger-500 text-white shadow-md hover:bg-danger-600 hover:shadow-lg ' +
        'hover:-translate-y-0.5 active:translate-y-0 focus:outline-danger-600',
      success:
        'bg-success-500 text-white shadow-md hover:bg-success-600 hover:shadow-lg ' +
        'hover:-translate-y-0.5 active:translate-y-0 focus:outline-success-600',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
