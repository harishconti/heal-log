import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: { label: string; value: () => DateRange }[];
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const defaultPresets = [
  {
    label: 'Last 7 days',
    value: () => ({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },
  {
    label: 'Last 30 days',
    value: () => ({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },
  {
    label: 'Last 90 days',
    value: () => ({
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },
  {
    label: 'This year',
    value: () => ({
      start: new Date(new Date().getFullYear(), 0, 1),
      end: new Date(),
    }),
  },
];

function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  return date >= start && date <= end;
}

export function DateRangePicker({
  value,
  onChange,
  presets = defaultPresets,
  minDate,
  maxDate,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const handleDateClick = (date: Date) => {
    if (selecting === 'start') {
      onChange({ start: date, end: null });
      setSelecting('end');
    } else {
      if (value.start && date < value.start) {
        onChange({ start: date, end: value.start });
      } else {
        onChange({ start: value.start, end: date });
      }
      setSelecting('start');
    }
  };

  const handlePresetClick = (preset: typeof presets[0]) => {
    onChange(preset.value());
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const navigateMonth = (direction: -1 | 1) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white
          text-sm text-gray-700 transition-all duration-200
          hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
          ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gray-200'}
        `}
      >
        <Calendar className="h-4 w-4 text-gray-400" />
        <span>
          {value.start && value.end
            ? `${formatDate(value.start)} - ${formatDate(value.end)}`
            : 'Select date range'}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 w-[calc(100vw-2rem)] sm:w-auto sm:min-w-[320px] max-w-md"
          role="dialog"
          aria-label="Date range picker"
        >
          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-gray-900">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="p-2" />;
              }

              const isDisabled = isDateDisabled(date);
              const isStart = value.start && isSameDay(date, value.start);
              const isEnd = value.end && isSameDay(date, value.end);
              const isRangeMiddle = isInRange(date, value.start, value.end) && !isStart && !isEnd;
              const isToday = isSameDay(date, new Date());

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => !isDisabled && handleDateClick(date)}
                  disabled={isDisabled}
                  className={`
                    p-2 text-sm rounded-lg transition-colors
                    ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                    ${isStart || isEnd ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}
                    ${isRangeMiddle ? 'bg-primary-50 text-primary-700' : ''}
                    ${isToday && !isStart && !isEnd ? 'font-semibold text-primary-600' : ''}
                    ${!isStart && !isEnd && !isRangeMiddle && !isDisabled ? 'text-gray-700' : ''}
                  `}
                  aria-label={`${date.toLocaleDateString()}`}
                  aria-selected={isStart || isEnd ? true : undefined}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {selecting === 'start' ? 'Select start date' : 'Select end date'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange({ start: null, end: null });
                  setSelecting('start');
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={!value.start || !value.end}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
