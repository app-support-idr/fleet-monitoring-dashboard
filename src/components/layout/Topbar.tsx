import { useAuth } from '@/hooks/useAuth';
import { useApplication } from '@/hooks/useMonitoring';
import { useLatestCheck } from '@/hooks/useMonitoring';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadges';
import { LogOut, Menu, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

export function Topbar() {
  const { user, signOut } = useAuth();
  const { app } = useApplication();
  const { check } = useLatestCheck(app?.id);

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold leading-tight">{app?.name ?? '—'}</h1>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              {app?.environment ?? '—'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            {app?.url ?? '—'}
          </span>
        </div>

        {check && (
          <div className="hidden sm:block ml-3">
            <StatusBadge status={check.status} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-lg border px-3 py-1.5">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {user?.email ?? 'demo@idrental.mg'}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => signOut()}>
          <LogOut className="mr-1.5 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </header>
  );
}
