import { ReactNode, HTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'subtle' | 'primary' | 'alert';
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  hoverEffect = false,
  ...props
}: GlassCardProps) {
  const baseStyles = 'rounded-2xl border backdrop-blur-md overflow-hidden transition-all duration-300 shadow-sm';
  
  const variants = {
    default: 'bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-800/50 shadow-slate-200/20 dark:shadow-none',
    subtle: 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent dark:border-transparent',
    primary: 'bg-indigo-50/80 dark:bg-indigo-900/20 border-indigo-100/50 dark:border-indigo-800/30 shadow-indigo-100/20',
    alert: 'bg-red-50/90 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/30 shadow-red-100/20'
  };
  
  const hoverStyles = hoverEffect 
    ? 'hover:shadow-md hover:border-slate-300/50 dark:hover:border-slate-700/50 hover:-translate-y-0.5' 
    : '';

  return (
    <div
      className={cn(baseStyles, variants[variant], hoverStyles, className)}
      {...props}
    >
      {children}
    </div>
  );
}
