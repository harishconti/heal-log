import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, required, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Determine which element describes the input
    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[14px] font-bold text-gray-800 mb-2"
          >
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
            {!required && <span className="text-gray-400 font-normal ml-2">(optional)</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            className={`
              block w-full rounded-lg border px-4 h-[44px]
              text-[14px] text-gray-900 placeholder-gray-400
              transition-all duration-200
              bg-white focus:bg-[#f8f9fa]
              focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${error
                ? 'border-red-300 focus:ring-red-100 focus:border-red-500'
                : 'border-gray-300 hover:border-gray-400'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium animate-slide-up"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
