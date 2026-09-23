import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Area, AreaChart,
} from 'recharts';
import { useMemo } from 'react';
import { KpiCard } from '@/components/shared/KpiCard';
import { StatusBadge } from '@/components/shared/StatusBadges';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Globe, Server, Clock, Wifi, Activity, CheckCircle2, Calendar,
} from 'lucide-react';
import { useApplication, useLatestCheck, useRecentChecks, useIncidents, useAvailability } from '@/hooks/useMonitoring';
import { formatTimeLabel, formatDateTime } from '@/services/mockData';
import type { MonitoringCheck } from '@/types';

function ResponseTimeChart({ checks }: { checks: MonitoringCheck[] }) {
  const data = useMemo(
    () => checks.map((c) => ({ time: formatTimeLabel(c.timestamp), ms: c.response_time_ms })),
    [checks]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temps de réponse — 24 heures</CardTitle>
        <CardDescription>Évolution du temps de réponse (ms)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rtGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              interval={Math.floor(data.length / 6)}
              className="text-muted-foreground"
            />
            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" unit=" ms" />
            <RechartsTooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--background))',
                fontSize: 12,
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="ms"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#rtGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RecentIncidents({ incidents }: { incidents: ReturnType<typeof useIncidents>['incidents'] }) {
  const recent = incidents.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Derniers incidents</CardTitle>
        <CardDescription>Incidents récents sur Fleet Management</CardDescription>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Aucun incident récent
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((inc) => (
              <div key={inc.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inc.description ?? '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateTime(inc.started_at)}
                    {inc.resolved_at ? ` → ${formatDateTime(inc.resolved_at)}` : ' (en cours)'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OverviewPage() {
  const { app } = useApplication();
  const { check, loading: checkLoading } = useLatestCheck(app?.id);
  const { checks } = useRecentChecks(app?.id, 24);
  const { incidents } = useIncidents(app?.id);
  const { availability } = useAvailability(app?.id, 24);

  if (checkLoading || !check) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>;
  }

  const statusLabel =
    check.status === 'OK' ? 'OPÉRATIONNEL' :
    check.status === 'ALERTE' ? 'DÉGRADÉ' : 'INDISPONIBLE';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vue d'ensemble</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Supervision en temps réel de l'application Fleet Management
        </p>
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <div
          className={`flex h-3 w-3 rounded-full ${
            check.status === 'OK' ? 'bg-emerald-500' :
            check.status === 'ALERTE' ? 'bg-amber-500' : 'bg-red-500'
          } animate-pulse`}
        />
        <span className="text-lg font-semibold">{statusLabel}</span>
        <StatusBadge status={check.status} className="ml-auto" />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="HTTP" value={check.http_code} icon={Globe} accent={check.http_code === 200 ? 'success' : 'danger'} />
        <KpiCard label="Temps de réponse" value={`${check.response_time_ms} ms`} icon={Clock} accent={check.response_time_ms < 200 ? 'success' : 'warning'} />
        <KpiCard label="DNS" value={check.dns === 'OK' ? 'OK' : 'ÉCHEC'} icon={Server} accent={check.dns === 'OK' ? 'success' : 'danger'} />
        <KpiCard label="Port 443" value={check.port_443 === 'OK' ? 'OK' : 'ÉCHEC'} icon={Wifi} accent={check.port_443 === 'OK' ? 'success' : 'danger'} />
        <KpiCard label="Disponibilité (24h)" value={`${availability.toFixed(2)} %`} icon={Activity} accent={availability > 99 ? 'success' : 'warning'} />
        <KpiCard label="Dernier contrôle" value={formatTimeLabel(check.timestamp)} icon={Calendar} />
      </div>

      {/* IP card */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Adresse IP</p>
              <p className="text-lg font-bold font-mono">{check.ip}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dernier contrôle</p>
              <p className="text-lg font-bold">{formatDateTime(check.timestamp)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <ResponseTimeChart checks={checks} />

      {/* Recent incidents */}
      <RecentIncidents incidents={incidents} />
    </div>
  );
}
