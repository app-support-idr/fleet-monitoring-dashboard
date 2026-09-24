import { useState, useMemo } from 'react';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend,
} from 'recharts';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Gauge, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { useApplications, useRecentChecks, useRecentChecksAllApps } from '@/hooks/useMonitoring';
import { formatTimeLabel } from '@/services/mockData';

const periodConfig = {
  '24h': { hours: 24, label: '24 heures' },
  '7d':  { hours: 168, label: '7 jours' },
  '30d': { hours: 720, label: '30 jours' },
};

type PeriodKey = keyof typeof periodConfig;

const COLORS = [
  'hsl(var(--primary))',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
];

const ALL_APPS = 'all';

function SingleAppPerf({ applicationId, hours }: { applicationId: number; hours: number }) {
  const { checks } = useRecentChecks(applicationId, hours);

  const stats = useMemo(() => {
    if (checks.length === 0) return { current: 0, avg: 0, min: 0, max: 0, count: 0 };
    const times = checks.map((c) => c.response_time_ms);
    return {
      current: times[0] ?? 0,
      avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      min: Math.min(...times),
      max: Math.max(...times),
      count: checks.length,
    };
  }, [checks]);

  const chartData = useMemo(
    () => checks.map((c) => ({ time: formatTimeLabel(c.timestamp), ms: c.response_time_ms })).reverse(),
    [checks]
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Temps actuel"  value={`${stats.current} ms`} icon={Zap}         accent={stats.current < 300 ? 'success' : 'warning'} />
        <KpiCard label="Temps moyen"  value={`${stats.avg} ms`}     icon={Gauge}        accent={stats.avg < 300 ? 'success' : 'warning'} />
        <KpiCard label="Minimum"      value={`${stats.min} ms`}     icon={TrendingDown} accent="success" />
        <KpiCard label="Maximum"      value={`${stats.max} ms`}     icon={TrendingUp}   accent={stats.max < 800 ? 'success' : 'danger'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Évolution du temps de réponse</CardTitle>
          <CardDescription>{stats.count} contrôles réalisés</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(chartData.length / 8))} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" unit=" ms" />
              <RechartsTooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', fontSize: 12 }} />
              <Line type="monotone" dataKey="ms" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

function AllAppsPerf({ appIds, hours, appNames }: { appIds: number[]; hours: number; appNames: Map<number, string> }) {
  const { checks } = useRecentChecksAllApps(appIds, hours);

  const chartData = useMemo(() => {
    if (checks.length === 0) return [];

    const byTime = new Map<string, Record<string, unknown>>();
    for (const c of [...checks].reverse()) {
      const timeKey = formatTimeLabel(c.timestamp);
      if (!byTime.has(timeKey)) byTime.set(timeKey, { time: timeKey } as Record<string, unknown>);
      const entry = byTime.get(timeKey)!;
      const name = appNames.get(c.application_id) ?? `App ${c.application_id}`;
      (entry as Record<string, unknown>)[name] = c.response_time_ms;
    }
    return Array.from(byTime.values());
  }, [checks, appNames]);

  const appNamesList = useMemo(() => Array.from(appNames.values()), [appNames]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison des temps de réponse</CardTitle>
        <CardDescription>Toutes les applications surveillées</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(chartData.length / 8))} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" unit=" ms" />
            <RechartsTooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {appNamesList.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PerformancePage() {
  const { apps } = useApplications();
  const [period, setPeriod] = useState<PeriodKey>('24h');
  const [selectedApp, setSelectedApp] = useState<string>(ALL_APPS);
  const config = periodConfig[period];

  const appIds = useMemo(() => apps.map((a) => a.id), [apps]);
  const appNames = useMemo(() => new Map(apps.map((a) => [a.id, a.name])), [apps]);

  const selectedAppId = selectedApp === ALL_APPS
    ? null
    : Number(selectedApp);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Analyse des temps de réponse et des performances applicatives
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* App filter */}
          <Select value={selectedApp} onValueChange={setSelectedApp}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Application" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_APPS}>Toutes les applications</SelectItem>
              {apps.map((app) => (
                <SelectItem key={app.id} value={String(app.id)}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Period filter */}
          <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7 jours</TabsTrigger>
              <TabsTrigger value="30d">30 jours</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Aucune application active.
        </div>
      ) : selectedAppId !== null ? (
        <SingleAppPerf applicationId={selectedAppId} hours={config.hours} />
      ) : (
        <AllAppsPerf appIds={appIds} hours={config.hours} appNames={appNames} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard label="Contrôles réalisés" value="—" icon={Activity} accent="default" />
        <KpiCard label="Fréquence de contrôle" value="2 min" icon={Clock} accent="default" />
      </div>
    </div>
  );
}
