import { type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  accent?: 'default' | 'success' | 'warning' | 'danger';
}

const accentConfig = {
  default: 'text-muted-foreground bg-muted',
  success: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50',
  warning: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50',
  danger: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50',
};

const trendConfig = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-red-600 dark:text-red-400',
  neutral: 'text-muted-foreground',
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  accent = 'default',
}: KpiCardProps) {
  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className={cn('text-xs font-medium', trendConfig[trendDirection])}>
              {trend}
            </p>
          )}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', accentConfig[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
