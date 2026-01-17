import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card } from './Card';

// ============================================================================
// VARIANT A - KPI CARD (Primary Metrics)
// Height: 120-140px, Large numbers (48-64px), clean background
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
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
    trendUp: 'text-primary-600',
  },
  success: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    trendUp: 'text-emerald-600',
  },
  warning: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    trendUp: 'text-amber-600',
  },
  danger: {
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    trendUp: 'text-red-600',
  },
  violet: {
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    trendUp: 'text-violet-600',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    trendUp: 'text-amber-600',
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

  // Logic for trend color: Up is good (green) usually, but context matters.
  // Here we default to green for up, red for down.
  const trendColorClass = trend?.direction === 'up'
    ? 'text-emerald-600 bg-emerald-50'
    : trend?.direction === 'down'
      ? 'text-red-600 bg-red-50'
      : 'text-gray-600 bg-gray-100';

  return (
    <Card className="relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {value}
            </h3>
          </div>

          {(trend || subtitle) && (
            <div className="mt-3 flex items-center gap-2">
              {trend && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${trendColorClass}`}>
                  <TrendIcon className="w-3 h-3" />
                  {trend.value}%
                </span>
              )}
              <span className="text-sm text-gray-400">
                {trend?.label || subtitle}
              </span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-xl ${colors.iconBg} ${colors.iconColor} transition-colors group-hover:scale-110 duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// VARIANT B - DATA CARD (Tables/Lists)
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
    <Card className={`overflow-hidden ${className}`} padding="none">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-0">
        {children}
      </div>
    </Card>
  );
}

interface DataRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DataRow({
  children,
  onClick,
  className = '',
}: DataRowProps) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`
        w-full flex items-center px-6 py-4 border-b border-gray-50 last:border-0
        hover:bg-gray-50/80 transition-colors text-left
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// VARIANT C - CHART CARD (Visualizations)
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
  minHeight: _minHeight = 320,
  className = '',
}: ChartCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="min-h-[250px] sm:min-h-[300px] lg:min-h-[320px]">
        {children}
      </div>
    </Card>
  );
}

// ============================================================================
// VARIANT D - ACTION CARD (Sidebar/Quick Links)
// ============================================================================

interface ActionCardProps {
  title?: string;
  children: ReactNode;
  accentColor?: 'primary' | 'emerald' | 'amber' | 'violet';
  className?: string;
}

export function ActionCard({
  title,
  children,
  className = '',
}: ActionCardProps) {
  return (
    <Card className={className} padding="sm">
      {title && (
        <h3 className="text-base font-bold text-gray-900 mb-4 px-2">{title}</h3>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </Card>
  );
}

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
    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
    text-sm font-medium text-gray-700
    transition-all duration-200
    ${disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:bg-gray-50 hover:text-gray-900 cursor-pointer'
    }
  `;

  const content = (
    <>
      <div className={`p-1.5 rounded-lg bg-gray-50 ${disabled ? '' : 'group-hover:bg-white'} transition-colors`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <span>{label}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <a href={href} className={`${baseClasses} group`}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} group text-left`}>
      {content}
    </button>
  );
}

// ============================================================================
// PROMO CARD
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
        bg-gradient-to-br from-primary-600 to-primary-700
        rounded-2xl p-6 sm:p-8 lg:p-10 text-white text-center
        shadow-lg shadow-primary-500/20
        ${className}
      `}
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{title}</h3>
      <p className="text-primary-100 mb-6 sm:mb-8 leading-relaxed max-w-full sm:max-w-sm mx-auto text-sm sm:text-base">
        {description}
      </p>
      {action}
    </div>
  );
}
