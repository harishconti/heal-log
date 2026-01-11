import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

// ============================================================================
// VARIANT A - KPI CARD (Primary Metrics)
// Height: 120-140px, Large numbers (48-64px), subtle gradient background
// ============================================================================

type TrendDirection = 'up' | 'down' | 'neutral';
type ColorScheme = 'primary' | 'success' | 'warning' | 'danger' | 'violet' | 'amber';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  colorScheme?: ColorScheme;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  subtitle?: string;
}

const colorSchemes = {
  primary: {
    bg: 'bg-primary-50/60',
    iconBg: 'bg-gradient-to-br from-primary-500 to-primary-600',
    iconColor: 'text-white',
    accent: 'bg-primary-500',
    border: 'border-primary-100',
  },
  success: {
    bg: 'bg-emerald-50/60',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    iconColor: 'text-white',
    accent: 'bg-emerald-500',
    border: 'border-emerald-100',
  },
  warning: {
    bg: 'bg-amber-50/60',
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
    iconColor: 'text-white',
    accent: 'bg-amber-500',
    border: 'border-amber-100',
  },
  danger: {
    bg: 'bg-red-50/60',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
    iconColor: 'text-white',
    accent: 'bg-red-500',
    border: 'border-red-100',
  },
  violet: {
    bg: 'bg-violet-50/60',
    iconBg: 'bg-gradient-to-br from-violet-500 to-violet-600',
    iconColor: 'text-white',
    accent: 'bg-violet-500',
    border: 'border-violet-100',
  },
  amber: {
    bg: 'bg-amber-50/60',
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
    iconColor: 'text-white',
    accent: 'bg-amber-500',
    border: 'border-amber-100',
  },
};

export function KPICard({
  title,
  value,
  icon: Icon,
  colorScheme = 'primary',
  trend,
  subtitle,
}: KPICardProps) {
  const colors = colorSchemes[colorScheme];

  const TrendIcon = trend?.direction === 'up' ? ArrowUp : trend?.direction === 'down' ? ArrowDown : Minus;
  const trendColor = trend?.direction === 'up'
    ? 'text-emerald-600 bg-emerald-50'
    : trend?.direction === 'down'
      ? 'text-red-600 bg-red-50'
      : 'text-gray-500 bg-gray-50';

  return (
    <div
      className={`
        relative overflow-hidden
        ${colors.bg} ${colors.border}
        rounded-2xl border
        p-6 lg:p-8
        min-h-[120px] lg:min-h-[140px]
        transition-all duration-300
        hover:shadow-lg hover:shadow-gray-200/50
        group
      `}
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${colors.accent} opacity-80`} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Label - 12-13px, font-weight 500 */}
          <p className="text-[13px] font-medium text-gray-500 mb-2 tracking-wide uppercase">
            {title}
          </p>

          {/* Large number - 48-54px, font-weight 600 */}
          <p className="text-4xl lg:text-[54px] font-semibold text-gray-900 leading-none tracking-tight">
            {value}
          </p>

          {/* Trend indicator or subtitle */}
          {trend && (
            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-gray-400">{trend.label}</span>
              )}
            </div>
          )}

          {subtitle && !trend && (
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        {/* Icon container */}
        <div
          className={`
            flex-shrink-0
            w-12 h-12 lg:w-14 lg:h-14
            ${colors.iconBg}
            rounded-xl lg:rounded-2xl
            flex items-center justify-center
            shadow-lg
            group-hover:scale-110
            transition-transform duration-300
          `}
        >
          <Icon className={`h-6 w-6 lg:h-7 lg:w-7 ${colors.iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VARIANT B - DATA CARD (Tables/Lists)
// Full-width, clean white background, 56-64px row height
// ============================================================================

interface DataCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DataCard({
  title,
  subtitle,
  action,
  children,
  className = '',
}: DataCardProps) {
  return (
    <div
      className={`
        bg-white
        rounded-2xl
        border border-gray-200
        shadow-sm shadow-gray-100/50
        overflow-hidden
        ${className}
      `}
    >
      {/* Header - darker background, bold text, 24px padding */}
      <div className="bg-gray-50/80 border-b border-gray-100 px-6 py-4 lg:px-8 lg:py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 lg:px-8 lg:py-6">
        {children}
      </div>
    </div>
  );
}

// Data row component for lists within DataCard
interface DataRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  isHoverable?: boolean;
}

export function DataRow({
  children,
  onClick,
  className = '',
  isHoverable = true,
}: DataRowProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`
        w-full
        flex items-center gap-4
        px-4 py-4
        min-h-[56px] lg:min-h-[64px]
        rounded-xl
        ${isHoverable ? 'hover:bg-gray-50 transition-colors duration-150' : ''}
        ${onClick ? 'cursor-pointer text-left' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// VARIANT C - CHART CARD (Visualizations)
// 300-400px min height, generous padding, clean background
// ============================================================================

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  minHeight?: number;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  minHeight = 320,
  className = '',
}: ChartCardProps) {
  return (
    <div
      className={`
        bg-white
        rounded-2xl
        border border-gray-100
        shadow-sm shadow-gray-100/60
        overflow-hidden
        ${className}
      `}
    >
      {/* Header with 32px padding */}
      <div className="px-6 pt-6 pb-4 lg:px-8 lg:pt-8 lg:pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* Title: 18px bold */}
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>

      {/* Chart area with margins from edges */}
      <div
        className="px-4 pb-6 lg:px-6 lg:pb-8"
        style={{ minHeight }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// VARIANT D - ACTION CARD (Sidebar/Quick Links)
// Distinct background, left accent border, 44px touch targets
// ============================================================================

interface ActionCardProps {
  title?: string;
  children: ReactNode;
  accentColor?: 'primary' | 'emerald' | 'amber' | 'violet';
  className?: string;
}

const accentColors = {
  primary: {
    bg: 'bg-primary-50/50',
    border: 'border-l-primary-500',
    hoverBg: 'hover:bg-primary-50',
  },
  emerald: {
    bg: 'bg-emerald-50/50',
    border: 'border-l-emerald-500',
    hoverBg: 'hover:bg-emerald-50',
  },
  amber: {
    bg: 'bg-amber-50/50',
    border: 'border-l-amber-500',
    hoverBg: 'hover:bg-amber-50',
  },
  violet: {
    bg: 'bg-violet-50/50',
    border: 'border-l-violet-500',
    hoverBg: 'hover:bg-violet-50',
  },
};

export function ActionCard({
  title,
  children,
  accentColor = 'primary',
  className = '',
}: ActionCardProps) {
  const colors = accentColors[accentColor];

  return (
    <div
      className={`
        ${colors.bg}
        rounded-2xl
        border border-gray-100
        border-l-4 ${colors.border}
        overflow-hidden
        ${className}
      `}
    >
      {title && (
        <div className="px-5 pt-5 pb-3 lg:px-6 lg:pt-6 lg:pb-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className={title ? 'px-5 pb-5 lg:px-6 lg:pb-6' : 'p-5 lg:p-6'}>
        {children}
      </div>
    </div>
  );
}

// Action item for ActionCard
interface ActionItemProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  href?: string;
  iconColor?: string;
  disabled?: boolean;
}

export function ActionItem({
  icon: Icon,
  label,
  onClick,
  href,
  iconColor = 'text-gray-500',
  disabled = false,
}: ActionItemProps) {
  const baseClasses = `
    w-full
    flex items-center gap-3
    px-4 py-3
    min-h-[44px]
    rounded-xl
    text-left
    text-[15px] font-medium text-gray-700
    transition-all duration-150
    ${disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:bg-white hover:shadow-sm cursor-pointer'
    }
  `;

  const content = (
    <>
      <Icon className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
      <span className="flex-1">{label}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <a href={href} className={baseClasses}>
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
    >
      {content}
    </button>
  );
}

// ============================================================================
// PROMO CARD (For upgrade prompts)
// Gradient background, centered content
// ============================================================================

interface PromoCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action: ReactNode;
  className?: string;
}

export function PromoCard({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: PromoCardProps) {
  return (
    <div
      className={`
        bg-gradient-to-br from-white via-primary-50/30 to-primary-100/40
        rounded-2xl
        border border-primary-100
        overflow-hidden
        ${className}
      `}
    >
      <div className="flex flex-col items-center justify-center text-center px-8 py-12 lg:py-16">
        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary-500/30">
          <Icon className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">
          {description}
        </p>
        {action}
      </div>
    </div>
  );
}
