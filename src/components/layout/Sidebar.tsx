import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, AlertTriangle, History, Gauge, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { to: '/', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { to: '/performance', label: 'Performance', icon: Activity },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/historique', label: 'Historique', icon: History },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { monitoringStatus, monitoringRole } = useAuth();
  const isAdmin = monitoringStatus === 'ACTIVE' && monitoringRole === 'ADMIN';

  return (
    <div className="flex h-full flex-col bg-card border-r">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Gauge className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-tight">MONITORING APPS</span>
          <span className="text-xs text-muted-foreground">Direction Transformation Digitale</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="my-2 border-t" />
            <NavLink
              to="/admin/users"
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <Shield className="h-4.5 w-4.5" />
              Administration
            </NavLink>
          </>
        )}
      </nav>

      <div className="border-t px-5 py-4">
        <p className="text-xs text-muted-foreground">
          v1.0.0 — Connecte
        </p>
      </div>
    </div>
  );
}
