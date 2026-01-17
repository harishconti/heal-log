import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for merging Tailwind CSS classes with proper precedence.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 *
 * @example
 * cn('px-4 py-2', condition && 'bg-blue-600', className)
 * cn('text-sm font-medium', { 'text-red-600': hasError })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
