import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat' | 'primary' | 'success' | 'warning' | 'danger';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  loading?: boolean;
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  loading = false,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white border border-gray-200 shadow-lg',
    outlined: 'bg-white border-2 border-gray-200',
    flat: 'bg-gray-50 border border-gray-100',
    primary: 'bg-white border-2 border-primary-200 shadow-sm shadow-primary-500/5',
    success: 'bg-white border-2 border-emerald-200 shadow-sm shadow-emerald-500/5',
    warning: 'bg-white border-2 border-amber-200 shadow-sm shadow-amber-500/5',
    danger: 'bg-white border-2 border-danger-200 shadow-sm shadow-danger-500/5',
  };

  const hoverStyles = {
    default: 'hover:shadow-md hover:border-gray-300',
    elevated: 'hover:shadow-xl hover:border-gray-300',
    outlined: 'hover:shadow-md hover:border-gray-300',
    flat: 'hover:shadow-sm hover:border-gray-200 hover:bg-gray-100',
    primary: 'hover:shadow-lg hover:shadow-primary-500/10 hover:border-primary-300',
    success: 'hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-300',
    warning: 'hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-300',
    danger: 'hover:shadow-lg hover:shadow-danger-500/10 hover:border-danger-300',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-200 relative',
        variants[variant],
        paddingStyles[padding],
        hover && hoverStyles[variant],
        clickable && 'cursor-pointer active:scale-[0.98]',
        loading && 'animate-pulse pointer-events-none',
        className
      )}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  children,
  className,
}: CardHeaderProps) {
  if (children) {
    return (
      <div className={cn('mb-5 pb-4 border-b border-gray-100', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('flex items-start justify-between mb-5 pb-4 border-b border-gray-100', className)}>
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn('', className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-gray-200 flex gap-3', className)}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
