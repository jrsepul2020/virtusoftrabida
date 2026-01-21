import React, { memo, useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import type { LucideIcon } from 'lucide-react';

export type StatsCardSparklinePoint = {
  value: number;
};

export type StatsCardTrend = {
  value: number;
  direction: 'up' | 'down';
  label?: string;
};

export interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColorClass?: string;
  trend?: StatsCardTrend;
  sparklineData?: number[] | StatsCardSparklinePoint[];
  onClick?: () => void;
  ariaLabel?: string;
}

function StatsCardBase({
  title,
  value,
  icon: Icon,
  iconColorClass = 'bg-gradient-to-br from-primary-600 to-primary-700',
  trend,
  sparklineData,
  onClick,
  ariaLabel,
}: StatsCardProps) {
  const normalizedSparkline = useMemo(() => {
    if (!sparklineData) return [] as StatsCardSparklinePoint[];
    if (typeof sparklineData[0] === 'number') {
      return (sparklineData as number[]).map((item) => ({ value: item }));
    }
    return sparklineData as StatsCardSparklinePoint[];
  }, [sparklineData]);

  const trendColor = trend?.direction === 'up' ? 'text-emerald-600' : 'text-rose-600';
  const trendLabel = trend
    ? `${trend.direction === 'up' ? '▲' : '▼'} ${trend.value}%${trend.label ? ` ${trend.label}` : ''}`
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || title}
      className={`w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {title}
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trendLabel && (
            <p className={`text-xs font-semibold ${trendColor}`}>{trendLabel}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center justify-center rounded-lg p-2 text-white shadow-sm ${iconColorClass}`}
        >
          <Icon className="w-5 h-5" />
        </span>
      </div>
      <div className="mt-3 h-12">
        {normalizedSparkline.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={normalizedSparkline}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#64748B"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-md bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50" />
        )}
      </div>
    </button>
  );
}

const StatsCard = memo(StatsCardBase);

export default StatsCard;
