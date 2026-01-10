import type { ReactNode, ElementType } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ElementType;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className = '',
  size = 'md',
}: EmptyStateProps) {
  const sizes = {
    sm: {
      container: 'py-8',
      iconWrapper: 'w-12 h-12 mb-3',
      icon: 'h-6 w-6',
      title: 'text-base',
      description: 'text-sm max-w-xs',
    },
    md: {
      container: 'py-16',
      iconWrapper: 'w-16 h-16 mb-4',
      icon: 'h-7 w-7',
      title: 'text-lg',
      description: 'text-sm max-w-sm',
    },
    lg: {
      container: 'py-24',
      iconWrapper: 'w-20 h-20 mb-5',
      icon: 'h-8 w-8',
      title: 'text-xl',
      description: 'text-base max-w-md',
    },
  };

  const sizeConfig = sizes[size];

  return (
    <div className={`text-center ${sizeConfig.container} ${className}`}>
      {Icon && (
        <div
          className={`${sizeConfig.iconWrapper} bg-gray-100 rounded-2xl flex items-center justify-center mx-auto`}
        >
          <Icon className={`${sizeConfig.icon} text-gray-400`} aria-hidden="true" />
        </div>
      )}
      <h3 className={`font-medium text-gray-900 mb-2 ${sizeConfig.title}`}>{title}</h3>
      {description && (
        <p className={`text-gray-500 mx-auto mb-6 ${sizeConfig.description}`}>{description}</p>
      )}
      {(action || secondaryAction || children) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

// Common empty state presets
export function NoResultsState({
  searchTerm,
  onClear,
  className = '',
}: {
  searchTerm?: string;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      title="No results found"
      description={
        searchTerm
          ? `No results match "${searchTerm}". Try adjusting your search or filters.`
          : 'Try adjusting your search or filter criteria.'
      }
      action={
        onClear
          ? {
              label: 'Clear filters',
              onClick: onClear,
              variant: 'outline',
            }
          : undefined
      }
      className={className}
    />
  );
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
  className = '',
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      title="Error"
      description={message}
      action={
        onRetry
          ? {
              label: 'Try again',
              onClick: onRetry,
              variant: 'primary',
            }
          : undefined
      }
      className={className}
    />
  );
}
