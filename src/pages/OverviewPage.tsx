import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Area,
  AreaChart,
} from 'recharts';
import { useMemo, useState } from 'react';
import { KpiCard } from '@/components/shared/KpiCard';
import { StatusBadge } from '@/components/shared/StatusBadges';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Globe,
  Server,
  Clock,
  Wifi,
  Activity,
  CheckCircle2,
  Calendar,
  AlertCircle,
  LayoutGrid,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import {
  useApplications,
  useLatestChecksAllApps,
  useRecentChecks,
  useIncidentsAllApps,
} from '@/hooks/useMonitoring';
import { formatTimeLabel, formatDateTime } from '@/services/mockData';
import type { MonitoringCheck } from '@/types';

type ChartPeriod = {
  label: string;
  hours: number;
};

const CHART_PERIODS: ChartPeriod[] = [
  { label: '1 h', hours: 1 },
  { label: '6 h', hours: 6 },
  { label: '24 h', hours: 24 },
  { label: '7 j', hours: 168 },
];

function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `Il y a ${diffDays} j`;
  }

  return formatDateTime(timestamp);
}

function getStatusConfig(check?: MonitoringCheck) {
  if (!check) {
    return {
      label: 'Aucun contrôle',
      color: 'bg-slate-400',
      bg: 'bg-slate-50 dark:bg-slate-900/40',
      border: 'border-slate-200 dark:border-slate-800',
      icon: Activity,
    };
  }

  if (check.status === 'OK') {
    return {
      label: 'Opérationnel',
      color: 'bg-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-900',
      icon: ShieldCheck,
    };
  }

  if (check.status === 'ALERTE') {
    return {
      label: 'Alerte',
      color: 'bg-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-900',
      icon: AlertTriangle,
    };
  }

  return {
    label: 'Critique',
    color: 'bg-red-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-900',
    icon: XCircle,
  };
}

function getResponseTimeClass(responseTime?: number) {
  if (responseTime === undefined || responseTime === null) {
    return 'text-muted-foreground';
  }

  if (responseTime < 300) {
    return 'text-emerald-600 dark:text-emerald-400';
  }

  if (responseTime < 800) {
    return 'text-amber-600 dark:text-amber-400';
  }

  return 'text-red-600 dark:text-red-400';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-muted" />
        <div className="h-4 w-80 rounded bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>

      <div className="h-72 rounded-xl bg-muted" />
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}

function GlobalStatusBanner({
  total,
  ok,
  anomaly,
  openIncidents,
}: {
  total: number;
  ok: number;
  anomaly: number;
  openIncidents: number;
}) {
  const isCritical = anomaly > 0 || openIncidents > 0;
  const isHealthy = total > 0 && anomaly === 0 && openIncidents === 0;

  if (isHealthy) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/20">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
            Toutes les applications sont opérationnelles
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            {ok} application{ok > 1 ? 's' : ''} surveillée{ok > 1 ? 's' : ''} — aucun incident ouvert
          </p>
        </div>

        <div className="ml-auto hidden items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 sm:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Surveillance active
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        isCritical
          ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
          : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isCritical
            ? 'bg-red-100 dark:bg-red-900/40'
            : 'bg-amber-100 dark:bg-amber-900/40'
        }`}
      >
        {isCritical ? (
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        )}
      </div>

      <div className="min-w-0">
        <p
          className={`text-sm font-semibold ${
            isCritical
              ? 'text-red-900 dark:text-red-300'
              : 'text-amber-900 dark:text-amber-300'
          }`}
        >
          {openIncidents > 0
            ? `${openIncidents} incident${openIncidents > 1 ? 's' : ''} en cours`
            : 'Une anomalie nécessite votre attention'}
        </p>

        <p
          className={`text-xs ${
            isCritical
              ? 'text-red-700 dark:text-red-400'
              : 'text-amber-700 dark:text-amber-400'
          }`}
        >
          {ok}/{total} application{total > 1 ? 's' : ''} actuellement opérationnelle{ok > 1 ? 's' : ''}
        </p>
      </div>

      <div className="ml-auto hidden items-center gap-1.5 text-xs font-medium sm:flex">
        <span
          className={`h-2 w-2 rounded-full ${
            isCritical ? 'bg-red-500' : 'bg-amber-500'
          }`}
        />
        Surveillance active
      </div>
    </div>
  );
}

function ResponseTimeChart({
  checks,
  appName,
  period,
  onPeriodChange,
}: {
  checks: MonitoringCheck[];
  appName: string;
  period: ChartPeriod;
  onPeriodChange: (period: ChartPeriod) => void;
}) {
  const data = useMemo(
    () =>
      checks
        .map((c) => ({
          time: formatTimeLabel(c.timestamp),
          ms: c.response_time_ms,
        }))
        .reverse(),
    [checks]
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <CardTitle>Temps de réponse</CardTitle>
            </div>

            <CardDescription className="mt-1.5">
              {appName} · évolution des temps de réponse
            </CardDescription>
          </div>

          <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
            {CHART_PERIODS.map((item) => {
              const active = item.hours === period.hours;

              return (
                <Button
                  key={item.hours}
                  type="button"
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onPeriodChange(item)}
                  className="h-7 px-2.5 text-xs"
                >
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {data.length === 0 ? (
          <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Aucune donnée disponible</p>
            <p className="text-xs text-muted-foreground">
              Aucun contrôle enregistré sur cette période.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="rtGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/50"
              />

              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                interval={Math.max(0, Math.floor(data.length / 6))}
                className="text-muted-foreground"
              />

              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                unit=" ms"
              />

              <RechartsTooltip
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  fontSize: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                }}
                labelStyle={{
                  color: 'hsl(var(--muted-foreground))',
                  marginBottom: 4,
                }}
                formatter={(value) => [`${value} ms`, 'Temps de réponse']}
              />

              <Area
                type="monotone"
                dataKey="ms"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#rtGradient)"
                dot={false}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {data.length} contrôle{data.length > 1 ? 's' : ''} affiché
            {data.length > 1 ? 's' : ''}
          </span>
          <span>Actualisation automatique du dashboard</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const { apps, loading: appsLoading } = useApplications();
  const { checksMap, loading: checksLoading } =
    useLatestChecksAllApps(apps);

  const appIds = useMemo(() => apps.map((a) => a.id), [apps]);

  const { incidents } = useIncidentsAllApps(appIds);

  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(
    CHART_PERIODS[2]
  );

  const selectedApp = useMemo(() => {
    if (apps.length === 0) return null;

    if (selectedAppId !== null) {
      return apps.find((app) => app.id === selectedAppId) ?? apps[0];
    }

    return apps[0];
  }, [apps, selectedAppId]);

  const { checks: recentChecks } = useRecentChecks(
    selectedApp?.id,
    chartPeriod.hours
  );

  const globalStats = useMemo(() => {
    const total = apps.length;

    const ok = apps.filter((app) => {
      const check = checksMap.get(app.id);
      return check?.status === 'OK';
    }).length;

    const anomaly = apps.filter((app) => {
      const check = checksMap.get(app.id);
      return check && check.status !== 'OK';
    }).length;

    const openIncidents = incidents.filter(
      (incident) => incident.status === 'OPEN'
    ).length;

    return {
      total,
      ok,
      anomaly,
      openIncidents,
    };
  }, [apps, checksMap, incidents]);

  const latestIncidents = useMemo(
    () => incidents.slice(0, 5),
    [incidents]
  );

  if (appsLoading || (checksLoading && checksMap.size === 0)) {
    return <DashboardSkeleton />;
  }

  if (apps.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <LayoutGrid className="h-7 w-7 text-muted-foreground/60" />
        </div>

        <div>
          <p className="font-semibold">Aucune application active</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aucune application n'est actuellement configurée pour la
            surveillance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Vue d'ensemble
            </h2>

            <span className="hidden rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:inline-flex">
              Live
            </span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Surveillance en temps réel de vos applications
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Toutes les 2 min
          </span>

          <span className="hidden h-4 w-px bg-border sm:block" />

          <span className="hidden sm:inline">
            {apps.length} application{apps.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Global status */}
      <GlobalStatusBanner
        total={globalStats.total}
        ok={globalStats.ok}
        anomaly={globalStats.anomaly}
        openIncidents={globalStats.openIncidents}
      />

      {/* KPI */}
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
          accent={
            globalStats.ok === globalStats.total ? 'success' : 'warning'
          }
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
          accent={
            globalStats.openIncidents === 0 ? 'success' : 'danger'
          }
        />
      </div>

      {/* Applications + incidents */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        {/* Applications */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Applications surveillées</CardTitle>
                <CardDescription className="mt-1">
                  État du dernier contrôle
                </CardDescription>
              </div>

              <div className="hidden rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground sm:block">
                {globalStats.ok}/{globalStats.total} OK
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y">
              {apps.map((app) => {
                const check = checksMap.get(app.id);
                const status = getStatusConfig(check);
                const StatusIcon = status.icon;
                const isSelected = selectedApp?.id === app.id;

                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedAppId(app.id)}
                    className={`group w-full text-left transition-all duration-200 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                      isSelected ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className="px-4 py-4 sm:px-5">
                      <div className="flex items-start gap-3">
                        {/* Status indicator */}
                        <div
                          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${status.bg}`}
                        >
                          <StatusIcon
                            className={`h-4 w-4 ${
                              check?.status === 'OK'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : check?.status === 'ALERTE'
                                ? 'text-amber-600 dark:text-amber-400'
                                : check?.status === 'CRITIQUE'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold">
                                  {app.name}
                                </span>

                                <span
                                  className={`h-2 w-2 shrink-0 rounded-full ${status.color}`}
                                />
                              </div>

                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {app.url}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {check ? (
                                <StatusBadge status={check.status} />
                              ) : (
                                <span className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground">
                                  Aucun contrôle
                                </span>
                              )}

                              <ChevronRight
                                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                                  isSelected
                                    ? 'translate-x-0.5'
                                    : 'group-hover:translate-x-0.5'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Metrics */}
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <div className="rounded-lg border bg-background/70 px-2.5 py-2">
                              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                <Globe className="h-3 w-3" />
                                HTTP
                              </div>

                              <p
                                className={`mt-1 font-mono text-sm font-semibold ${
                                  !check
                                    ? 'text-muted-foreground'
                                    : check.http_code === 200
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {check?.http_code ?? '—'}
                              </p>
                            </div>

                            <div className="rounded-lg border bg-background/70 px-2.5 py-2">
                              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Temps
                              </div>

                              <p
                                className={`mt-1 font-mono text-sm font-semibold ${getResponseTimeClass(
                                  check?.response_time_ms
                                )}`}
                              >
                                {check
                                  ? `${check.response_time_ms} ms`
                                  : '—'}
                              </p>
                            </div>

                            <div className="rounded-lg border bg-background/70 px-2.5 py-2">
                              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                <Wifi className="h-3 w-3" />
                                DNS
                              </div>

                              <p className="mt-1 text-sm font-semibold">
                                {check?.dns === 'OK' ? (
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    OK
                                  </span>
                                ) : check ? (
                                  <span className="text-red-600 dark:text-red-400">
                                    KO
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </p>
                            </div>

                            <div className="rounded-lg border bg-background/70 px-2.5 py-2">
                              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Dernier contrôle
                              </div>

                              <p className="mt-1 truncate text-xs font-medium">
                                {check
                                  ? formatRelativeTime(check.timestamp)
                                  : 'Aucun contrôle'}
                              </p>
                            </div>
                          </div>

                          {check?.ip && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Server className="h-3 w-3" />
                              <span>IP :</span>
                              <span className="font-mono">
                                {check.ip}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Incidents */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Incidents récents</CardTitle>
                <CardDescription className="mt-1">
                  Derniers événements détectés
                </CardDescription>
              </div>

              {globalStats.openIncidents > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {globalStats.openIncidents} ouvert
                  {globalStats.openIncidents > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {latestIncidents.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>

                <p className="mt-3 text-sm font-semibold">
                  Aucun incident récent
                </p>

                <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                  La surveillance n'a détecté aucun incident sur les
                  applications actives.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {latestIncidents.map((incident) => {
                  const app = apps.find(
                    (item) => item.id === incident.application_id
                  );

                  const isOpen = incident.status === 'OPEN';

                  return (
                    <div
                      key={incident.id}
                      className={`rounded-xl border p-3 transition-colors hover:bg-muted/30 ${
                        isOpen
                          ? 'border-red-200 dark:border-red-900'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            isOpen
                              ? 'bg-red-100 dark:bg-red-950/40'
                              : 'bg-emerald-100 dark:bg-emerald-950/40'
                          }`}
                        >
                          {isOpen ? (
                            <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold">
                              {app?.name ??
                                `Application #${incident.application_id}`}
                            </p>

                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                isOpen
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              }`}
                            >
                              {isOpen ? 'En cours' : 'Résolu'}
                            </span>
                          </div>

                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {incident.description ?? 'Aucune description'}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {formatRelativeTime(incident.started_at)}
                            </span>

                            {incident.resolved_at && (
                              <span>
                                Résolu{' '}
                                {formatRelativeTime(incident.resolved_at)}
                              </span>
                            )}

                            {isOpen && (
                              <span className="text-red-600 dark:text-red-400">
                                Incident actif
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance */}
      {selectedApp && (
        <div className="space-y-2">
          <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">
                Performance
              </h3>

              <p className="text-xs text-muted-foreground">
                Analyse interactive du temps de réponse
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Actualisation automatique</span>
            </div>
          </div>

          <ResponseTimeChart
            checks={recentChecks}
            appName={selectedApp.name}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
          />
        </div>
      )}
    </div>
  );
}