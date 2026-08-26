import { ReactNode } from 'react';
import { GlassCard } from './GlassCard';
import { cn } from './GlassCard'; // Reusing cn utility

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <GlassCard className={cn("p-6", className)} hoverEffect={true}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </h2>
            {trend && (
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  trend.isPositive 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-500 dark:text-slate-400 ring-1 ring-slate-100 dark:ring-slate-800">
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}
