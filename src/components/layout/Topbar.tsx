import { useApplications, useLatestCheck, useNotifications } from '@/hooks/useMonitoring';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadges';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { Menu, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { triggerManualRefresh } from '@/lib/realtime';

function ActiveAppStatus() {
  const { apps } = useApplications();
  const firstApp = apps[0] ?? null;
  const { check } = useLatestCheck(firstApp?.id);
  if (!check) return null;
  return (
    <div className="hidden sm:block ml-3">
      <StatusBadge status={check.status} />
    </div>
  );
}

export function Topbar() {
  const { apps } = useApplications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    triggerManualRefresh();
    window.setTimeout(() => setRefreshing(false), 600);
  };

  const { notifications, unreadCount, markAllAsRead, isUnread } = useNotifications(apps);

  const firstApp = apps[0] ?? null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold leading-tight">
              MONITORING
            </h1>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              {firstApp?.environment ?? 'PRODUCTION'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            {apps.length > 1
              ? `${apps.length} applications surveillees`
              : firstApp?.url ?? '—'}
          </span>
        </div>

        <ActiveAppStatus />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Actualiser les données"
          title="Actualiser les données"
        >
          <RotateCw className={refreshing ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
        </Button>

        <ThemeToggle />

        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          markAllAsRead={markAllAsRead}
          isUnread={isUnread}
        />
      </div>
    </header>
  );
}
