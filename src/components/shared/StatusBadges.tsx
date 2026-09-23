import { cn } from '@/lib/utils';
import type { CheckStatus, Level, IncidentStatus } from '@/types';
import { AlertTriangle, CheckCircle2, XCircle, Info, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  status?: CheckStatus;
  className?: string;
}

const statusConfig: Record<CheckStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  OK: {
    label: 'OK',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  ALERTE: {
    label: 'ALERTE',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
    icon: AlertTriangle,
  },
  CRITIQUE: {
    label: 'CRITIQUE',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
    icon: XCircle,
  },
};

const unknownStatusConfig = {
  label: '—',
  className: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-700',
  icon: Info,
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = status ? statusConfig[status] ?? unknownStatusConfig : unknownStatusConfig;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

interface LevelBadgeProps {
  level: Level;
  className?: string;
}

const levelConfig: Record<Level, { label: string; className: string; icon: typeof Info }> = {
  INFO: {
    label: 'INFO',
    className: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-800',
    icon: Info,
  },
  ALERTE: {
    label: 'ALERTE',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
    icon: AlertTriangle,
  },
  CRITIQUE: {
    label: 'CRITIQUE',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
    icon: ShieldAlert,
  },
};

export function LevelBadge({ level, className }: LevelBadgeProps) {
  const config = levelConfig[level];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

interface IncidentStatusBadgeProps {
  status: IncidentStatus;
  className?: string;
}

export function IncidentStatusBadge({ status, className }: IncidentStatusBadgeProps) {
  const isOpen = status === 'OPEN';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        isOpen
          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
        className
      )}
    >
      {isOpen ? 'OPEN' : 'RESOLVED'}
    </span>
  );
}
