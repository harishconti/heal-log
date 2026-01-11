import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  rounded?: 'default' | 'full';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, disabled, rounded = 'default', children, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center font-semibold
      transition-all duration-200 ease-out
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
      active:scale-[0.98]
    `;

    const radiusStyles = rounded === 'full' ? 'rounded-full' : 'rounded-xl';

    const variants = {
      primary: `
        bg-primary-600 text-white shadow-sm shadow-primary-500/30
        hover:bg-primary-700 hover:shadow-primary-500/40
        focus-visible:ring-primary-500
      `,
      secondary: `
        bg-gray-100 text-gray-800
        hover:bg-gray-200 hover:text-gray-900
        focus-visible:ring-gray-500
      `,
      outline: `
        border border-gray-200 bg-white text-gray-700
        hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900
        focus-visible:ring-primary-500
      `,
      ghost: `
        text-gray-600
        hover:bg-gray-50 hover:text-gray-900
        focus-visible:ring-gray-500
      `,
      danger: `
        bg-red-500 text-white shadow-sm shadow-red-500/30
        hover:bg-red-600 hover:shadow-red-500/40
        focus-visible:ring-red-500
      `,
      success: `
        bg-emerald-500 text-white shadow-sm shadow-emerald-500/30
        hover:bg-emerald-600 hover:shadow-emerald-500/40
        focus-visible:ring-emerald-500
      `,
    };

    const sizes = {
      sm: 'px-3.5 py-2 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-7 py-3.5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${radiusStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
