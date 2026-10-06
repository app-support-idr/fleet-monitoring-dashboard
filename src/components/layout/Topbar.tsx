import { useAuth } from '@/hooks/useAuth';
import { useApplications, useLatestCheck, useNotifications } from '@/hooks/useMonitoring';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadges';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { LogOut, Menu, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import ThemeToggle from '@/components/ThemeToggle';

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

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return null;
  if (role === 'ADMIN') {
    return (
      <span className="rounded-full border bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 uppercase tracking-wide dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-800">
        Admin
      </span>
    );
  }
  return (
    <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
      User
    </span>
  );
}

export function Topbar() {
  const { user, signOut, monitoringStatus, monitoringRole } = useAuth();
  const { apps } = useApplications();
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <ThemeToggle />

        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          markAllAsRead={markAllAsRead}
          isUnread={isUnread}
        />

        <div className="hidden md:flex items-center gap-2 rounded-lg border px-3 py-1.5">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium">
              {user?.email ?? 'demo@idrental.mg'}
            </span>
            <div className="flex items-center gap-1.5">
              <RoleBadge role={monitoringRole} />
              {monitoringStatus === 'ACTIVE' && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Actif</span>
              )}
              {monitoringStatus === 'PENDING' && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">En attente</span>
              )}
              {monitoringStatus === 'DISABLED' && (
                <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">Desactive</span>
              )}
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => signOut()} aria-label="Deconnexion">
          <LogOut className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Deconnexion</span>
        </Button>
      </div>
    </header>
  );
}
