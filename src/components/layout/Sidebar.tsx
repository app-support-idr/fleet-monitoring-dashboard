import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, AlertTriangle, Shield, History, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { to: '/performance', label: 'Performance', icon: Activity },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/ssl', label: 'SSL', icon: Shield },
  { to: '/historique', label: 'Historique', icon: History },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-card border-r">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Gauge className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-tight">Fleet Monitoring</span>
          <span className="text-xs text-muted-foreground">Supervision applicative</span>
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
      </nav>

      <div className="border-t px-5 py-4">
        <p className="text-xs text-muted-foreground">
          v1.0.0 — Données mockées
        </p>
      </div>
    </div>
  );
}
