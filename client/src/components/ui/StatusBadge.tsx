import { cn } from './GlassCard';

type BadgeType = 'status' | 'severity' | 'priority' | 'duplicate';

interface StatusBadgeProps {
  type: BadgeType;
  value: string | number | null | undefined;
  className?: string;
  animate?: boolean;
}

export function StatusBadge({ type, value, className, animate = false }: StatusBadgeProps) {
  if (value == null) return null;
  const stringValue = String(value);
  const normalizedValue = stringValue.toUpperCase().trim();
  
  const getBadgeStyles = () => {
    switch (type) {
      case 'status':
        if (normalizedValue === 'RESOLVED') return 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-900';
        if (normalizedValue === 'IN_PROGRESS') return 'bg-blue-100/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 ring-blue-200 dark:ring-blue-900';
        if (normalizedValue === 'REJECTED') return 'bg-slate-100/80 text-slate-700 dark:bg-slate-800/80 dark:text-slate-400 ring-slate-200 dark:ring-slate-700';
        return 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ring-amber-200 dark:ring-amber-900'; // PENDING

      case 'severity':
      case 'duplicate':
        if (normalizedValue === 'HIGH') return 'bg-red-100/80 text-red-700 dark:bg-red-950/40 dark:text-red-400 ring-red-200 dark:ring-red-900';
        if (normalizedValue === 'MEDIUM') return 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ring-amber-200 dark:ring-amber-900';
        if (normalizedValue === 'LOW') return 'bg-blue-100/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 ring-blue-200 dark:ring-blue-900';
        return 'bg-slate-100/80 text-slate-700 dark:bg-slate-800/80 dark:text-slate-400 ring-slate-200 dark:ring-slate-700'; // NONE

      case 'priority':
        const priorityScore = typeof value === 'number' ? value : parseInt(stringValue, 10);
        if (isNaN(priorityScore)) return 'bg-slate-100 text-slate-700';
        if (priorityScore >= 75) return 'bg-red-100/80 text-red-700 dark:bg-red-950/40 dark:text-red-400 ring-red-200 dark:ring-red-900';
        if (priorityScore >= 50) return 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ring-amber-200 dark:ring-amber-900';
        return 'bg-blue-100/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 ring-blue-200 dark:ring-blue-900';
      
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const formattedValue = type === 'status' 
    ? stringValue.replace('_', ' ') 
    : stringValue;

  const animationClass = (animate && (normalizedValue === 'HIGH' || normalizedValue === 'PENDING')) 
    ? 'animate-pulse' 
    : '';

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset backdrop-blur-sm",
      getBadgeStyles(),
      animationClass,
      className
    )}>
      {formattedValue}
    </span>
  );
}
