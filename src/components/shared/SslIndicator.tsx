import { cn } from '@/lib/utils';

interface SslIndicatorProps {
  daysRemaining: number;
  className?: string;
}

export function getSslStatus(daysRemaining: number) {
  if (daysRemaining <= 0) return 'expired' as const;
  if (daysRemaining < 7) return 'critical' as const;
  if (daysRemaining < 30) return 'warning' as const;
  return 'healthy' as const;
}

const sslConfig = {
  healthy: {
    label: 'OK',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
  },
  warning: {
    label: 'À surveiller',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    ring: 'ring-amber-200 dark:ring-amber-800',
  },
  critical: {
    label: 'Critique',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/50',
    ring: 'ring-red-200 dark:ring-red-800',
  },
  expired: {
    label: 'Expiré',
    color: 'text-red-700 dark:text-red-500',
    bg: 'bg-red-100 dark:bg-red-950/70',
    ring: 'ring-red-300 dark:ring-red-700',
  },
};

export function SslIndicator({ daysRemaining, className }: SslIndicatorProps) {
  const status = getSslStatus(daysRemaining);
  const config = sslConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1',
        config.bg,
        config.color,
        config.ring,
        className
      )}
    >
      {config.label}
    </span>
  );
}
