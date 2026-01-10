import type { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const baseStyles = 'bg-gray-200';

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
    none: '',
  };

  const variants = {
    text: 'rounded h-4 w-full',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  const sizeStyles: React.CSSProperties = {
    width: width ?? (variant === 'circular' ? height : undefined),
    height: height ?? (variant === 'text' ? undefined : '1rem'),
    ...style,
  };

  return (
    <div
      className={`${baseStyles} ${animations[animation]} ${variants[variant]} ${className}`}
      style={sizeStyles}
      aria-hidden="true"
      {...props}
    />
  );
}

// Pre-built skeleton components for common patterns
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={12} />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 flex gap-4 items-center">
            {rowIndex === 0 || Math.random() > 0.5 ? (
              <>
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 flex gap-4">
                  {Array.from({ length: columns - 1 }).map((_, colIndex) => (
                    <Skeleton
                      key={colIndex}
                      variant="text"
                      width={`${80 + Math.random() * 20}%`}
                      height={14}
                      className="flex-1"
                    />
                  ))}
                </div>
              </>
            ) : (
              Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  variant="text"
                  width={`${60 + Math.random() * 40}%`}
                  height={14}
                  className="flex-1"
                />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="rounded" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="60%" height={12} />
              <Skeleton variant="text" width="40%" height={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 250 }: { height?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex justify-between items-start mb-5">
        <div className="space-y-1">
          <Skeleton variant="text" width={120} height={18} />
          <Skeleton variant="text" width={80} height={14} />
        </div>
        <Skeleton variant="rounded" width={100} height={32} />
      </div>
      <Skeleton variant="rounded" width="100%" height={height} />
    </div>
  );
}
