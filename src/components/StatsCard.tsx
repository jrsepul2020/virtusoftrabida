import React, { memo, useMemo } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { LucideIcon } from "lucide-react";

export type StatsCardSparklinePoint = {
  value: number;
};

export type StatsCardTrend = {
  value: number;
  direction: "up" | "down";
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
  iconColorClass = "bg-midnight-500",
  trend,
  sparklineData,
  onClick,
  ariaLabel,
}: StatsCardProps) {
  const normalizedSparkline = useMemo(() => {
    if (!sparklineData) return [] as StatsCardSparklinePoint[];
    if (typeof sparklineData[0] === "number") {
      return (sparklineData as number[]).map((item) => ({ value: item }));
    }
    return sparklineData as StatsCardSparklinePoint[];
  }, [sparklineData]);

  const trendColor =
    trend?.direction === "up" ? "text-emerald-600" : "text-rose-600";
  const trendLabel = trend
    ? `${trend.direction === "up" ? "▲" : "▼"} ${trend.value}%${trend.label ? ` ${trend.label}` : ""}`
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || title}
      className={`w-full text-left bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne-400 ${
        onClick ? "cursor-pointer hover:-translate-y-1" : "cursor-default"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-midnight-400 font-body">
            {title}
          </p>
          <p className="text-3xl font-bold text-midnight-900 font-body tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trendLabel && trend && (
            <p
              className={`text-xs font-bold tracking-tight ${trendColor} font-body flex items-center gap-1`}
            >
              <span className="opacity-70">
                {trend.direction === "up" ? "↗" : "↘"}
              </span>
              {trendLabel}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center justify-center rounded-xl p-3 text-white shadow-lg shadow-midnight-900/10 ${iconColorClass}`}
        >
          <Icon className="w-5 h-5 text-champagne-100" />
        </span>
      </div>
      <div className="mt-6 h-12 w-full overflow-hidden opacity-40">
        {normalizedSparkline.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={normalizedSparkline}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="currentColor"
                className="text-midnight-300"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-lg bg-gradient-to-r from-midnight-50 via-midnight-100/30 to-midnight-50" />
        )}
      </div>
    </button>
  );
}

const StatsCard = memo(StatsCardBase);

export default StatsCard;
