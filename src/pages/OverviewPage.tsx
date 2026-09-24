import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Area, AreaChart,
} from 'recharts';
import { useMemo } from 'react';
import { KpiCard } from '@/components/shared/KpiCard';
import { StatusBadge } from '@/components/shared/StatusBadges';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Globe, Server, Clock, Wifi, Activity, CheckCircle2, Calendar, AlertCircle,
  LayoutGrid, TrendingUp,
} from 'lucide-react';
import {
  useApplications,
  useLatestChecksAllApps,
  useRecentChecks,
  useIncidentsAllApps,
} from '@/hooks/useMonitoring';
import { formatTimeLabel, formatDateTime } from '@/services/mockData';
import type { MonitoringCheck } from '@/types';

function ResponseTimeChart({ checks }: { checks: MonitoringCheck[] }) {
  const data = useMemo(
    () => checks.map((c) => ({ time: formatTimeLabel(c.timestamp), ms: c.response_time_ms })).reverse(),
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
              interval={Math.max(0, Math.floor(data.length / 6))}
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

export function OverviewPage() {
  const { apps, loading: appsLoading } = useApplications();
  const { checksMap, loading: checksLoading } = useLatestChecksAllApps(apps);
  const firstApp = apps[0] ?? null;
  const { checks: recentChecks } = useRecentChecks(firstApp?.id, 24);
  const appIds = useMemo(() => apps.map((a) => a.id), [apps]);
  const { incidents } = useIncidentsAllApps(appIds);

  const globalStats = useMemo(() => {
    const total = apps.length;
    const ok = apps.filter((a) => {
      const c = checksMap.get(a.id);
      return c?.status === 'OK';
    }).length;
    const anomaly = total - ok;
    const openIncidents = incidents.filter((i) => i.status === 'OPEN').length;
    return { total, ok, anomaly, openIncidents };
  }, [apps, checksMap, incidents]);

  if (appsLoading || (checksLoading && checksMap.size === 0)) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
        <LayoutGrid className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">Aucune application active.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vue d'ensemble</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Supervision en temps réel — {apps.length} application{apps.length > 1 ? 's' : ''} surveillée{apps.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Global KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Applications surveillées"
          value={globalStats.total}
          icon={LayoutGrid}
          accent="default"
        />
        <KpiCard
          label="Applications OK"
          value={globalStats.ok}
          icon={CheckCircle2}
          accent={globalStats.ok === globalStats.total ? 'success' : 'warning'}
        />
        <KpiCard
          label="En anomalie"
          value={globalStats.anomaly}
          icon={AlertCircle}
          accent={globalStats.anomaly === 0 ? 'success' : 'danger'}
        />
        <KpiCard
          label="Incidents ouverts"
          value={globalStats.openIncidents}
          icon={Activity}
          accent={globalStats.openIncidents === 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Applications table */}
      <Card>
        <CardHeader>
          <CardTitle>État des applications</CardTitle>
          <CardDescription>Dernier contrôle par application</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {apps.map((app) => {
              const check = checksMap.get(app.id);
              return (
                <div
                  key={app.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* App info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        !check
                          ? 'bg-slate-300'
                          : check.status === 'OK'
                          ? 'bg-emerald-500'
                          : check.status === 'ALERTE'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{app.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.url}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-5 sm:pl-0">
                    <div className="flex items-center gap-1.5">
                      {check ? (
                        <StatusBadge status={check.status} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-sm">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={`font-mono font-medium ${
                        !check ? 'text-muted-foreground' :
                        check.http_code === 200 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {check?.http_code ?? '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={`font-mono font-medium ${
                        !check ? 'text-muted-foreground' :
                        check.response_time_ms < 300 ? 'text-emerald-600 dark:text-emerald-400' :
                        check.response_time_ms < 800 ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {check ? `${check.response_time_ms} ms` : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Wifi className="h-3.5 w-3.5" />
                      <span>{check?.dns === 'OK' ? 'DNS OK' : check ? 'DNS KO' : '—'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Server className="h-3.5 w-3.5" />
                      <span>{check?.ip || '—'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{check ? formatDateTime(check.timestamp) : 'Aucun contrôle'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent incidents summary */}
      {incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Derniers incidents</CardTitle>
            <CardDescription>Incidents récents sur l'ensemble des applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incidents.slice(0, 5).map((inc) => {
                const app = apps.find((a) => a.id === inc.application_id);
                return (
                  <div key={inc.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        inc.status === 'OPEN' ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{app?.name ?? `App #${inc.application_id}`}</p>
                        <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
                          inc.status === 'OPEN'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}>
                          {inc.status === 'OPEN' ? 'En cours' : 'Résolu'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {inc.description ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <TrendingUp className="inline h-3 w-3 mr-1" />
                        {formatDateTime(inc.started_at)}
                        {inc.resolved_at ? ` → ${formatDateTime(inc.resolved_at)}` : ' (en cours)'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response time chart for first app */}
      {recentChecks.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 px-1">
            Graphique : {firstApp?.name}
          </p>
          <ResponseTimeChart checks={recentChecks} />
        </div>
      )}
    </div>
  );
}
