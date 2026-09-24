import { Bell, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDateTime, formatDuration } from '@/services/mockData';
import type { AppNotification } from '@/types';

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  markAllAsRead: () => void;
  isUnread: (n: AppNotification) => boolean;
}

function NotificationItem({
  notification,
  unread,
}: {
  notification: AppNotification;
  unread: boolean;
}) {
  const isCreated = notification.type === 'created';

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border p-3 transition-colors',
        unread
          ? isCreated
            ? 'border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-950/30'
            : 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30'
          : 'border-border bg-muted/30'
      )}
    >
      <div className="mt-0.5 shrink-0">
        {isCreated ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              'text-xs font-bold uppercase tracking-wide',
              isCreated
                ? 'text-red-600 dark:text-red-400'
                : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            {isCreated ? 'Panne' : 'Retour à la normale'}
          </span>
          {unread && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          )}
        </div>

        <p className="text-sm font-medium leading-tight">{notification.applicationName}</p>

        {notification.description && (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
            {notification.description}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap pt-0.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDateTime(notification.timestamp)}
          </span>

          {notification.httpCode != null && (
            <span className="text-xs font-mono text-muted-foreground">
              HTTP {notification.httpCode}
            </span>
          )}

          {!isCreated && notification.durationSeconds != null && (
            <span className="text-xs text-muted-foreground">
              Durée&nbsp;:&nbsp;
              {formatDuration(
                new Date(Date.now() - notification.durationSeconds * 1000).toISOString(),
                new Date().toISOString()
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationBell({
  notifications,
  unreadCount,
  markAllAsRead,
  isUnread,
}: NotificationBellProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(420px,calc(100vw-1rem))] p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-950 dark:text-red-400">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {/* Body */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="text-sm text-muted-foreground">Aucune notification récente</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[min(480px,70vh)]">
            <div className="space-y-2 p-3">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} unread={isUnread(n)} />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
