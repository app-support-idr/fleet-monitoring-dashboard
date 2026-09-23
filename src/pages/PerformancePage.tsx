import { useState, useMemo } from 'react';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Gauge, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { useApplication, useRecentChecks } from '@/hooks/useMonitoring';
import { formatTimeLabel } from '@/services/mockData';

const periodConfig = {
  '24h': { hours: 24, label: '24 heures', interval: 12 },
  '7d': { hours: 168, label: '7 jours', interval: 24 },
  '30d': { hours: 720, label: '30 jours', interval: 48 },
};

type PeriodKey = keyof typeof periodConfig;

export function PerformancePage() {
  const { app } = useApplication();
  const [period, setPeriod] = useState<PeriodKey>('24h');
  const config = periodConfig[period];
  const { checks } = useRecentChecks(app?.id, config.hours);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Analyse des temps de réponse et des performances applicatives
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7 jours</TabsTrigger>
            <TabsTrigger value="30d">30 jours</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Temps de réponse actuel"
          value={`${stats.current} ms`}
          icon={Zap}
          accent={stats.current < 200 ? 'success' : 'warning'}
        />
        <KpiCard
          label="Temps moyen"
          value={`${stats.avg} ms`}
          icon={Gauge}
          accent={stats.avg < 200 ? 'success' : 'warning'}
        />
        <KpiCard
          label="Temps minimum"
          value={`${stats.min} ms`}
          icon={TrendingDown}
          accent="success"
        />
        <KpiCard
          label="Temps maximum"
          value={`${stats.max} ms`}
          icon={TrendingUp}
          accent={stats.max < 500 ? 'success' : 'danger'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Évolution du temps de réponse</CardTitle>
          <CardDescription>{config.label} — {stats.count} contrôles réalisés</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                interval={Math.max(0, Math.floor(chartData.length / 8))}
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
              />
              <Line
                type="monotone"
                dataKey="ms"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          label="Contrôles réalisés"
          value={stats.count}
          icon={Activity}
          accent="default"
        />
        <KpiCard
          label="Fréquence de contrôle"
          value="2 min"
          icon={Clock}
          accent="default"
        />
      </div>
    </div>
  );
}
