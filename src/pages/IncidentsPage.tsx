import { useMemo, useState } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/KpiCard';
import { IncidentStatusBadge } from '@/components/shared/StatusBadges';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AlertTriangle, Clock, AlertCircle, Timer } from 'lucide-react';
import { useApplications, useIncidentsAllApps } from '@/hooks/useMonitoring';
import { formatDateTime, formatDuration } from '@/services/mockData';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FilterKey = 'ALL' | 'OPEN' | 'RESOLVED';
const ALL_APPS = 'all';

export function IncidentsPage() {
  const { apps } = useApplications();
  const appIds = useMemo(() => apps.map((a) => a.id), [apps]);
  const appsById = useMemo(() => new Map(apps.map((a) => [a.id, a])), [apps]);
  const { incidents } = useIncidentsAllApps(appIds);

  const [statusFilter, setStatusFilter] = useState<FilterKey>('ALL');
  const [appFilter, setAppFilter] = useState<string>(ALL_APPS);

  const stats = useMemo(() => {
    const open = incidents.filter((i) => i.status === 'OPEN').length;
    const last24h = incidents.filter(
      (i) => Date.now() - new Date(i.started_at).getTime() < 24 * 3600 * 1000
    ).length;
    const last7d = incidents.filter(
      (i) => Date.now() - new Date(i.started_at).getTime() < 7 * 24 * 3600 * 1000
    ).length;

    let downtimeMin = 0;
    for (const inc of incidents) {
      const start = new Date(inc.started_at).getTime();
      const end = inc.resolved_at ? new Date(inc.resolved_at).getTime() : Date.now();
      const diff = Math.round((end - start) / 60000);
      if (diff > 0) downtimeMin += diff;
    }

    const downtimeH = Math.floor(downtimeMin / 60);
    const downtimeM = downtimeMin % 60;

    return {
      open,
      last24h,
      last7d,
      downtime: downtimeH > 0 ? `${downtimeH}h ${downtimeM}min` : `${downtimeM}min`,
    };
  }, [incidents]);

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
      const matchApp = appFilter === ALL_APPS || i.application_id === Number(appFilter);
      return matchStatus && matchApp;
    });
  }, [incidents, statusFilter, appFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Incidents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Historique et suivi des incidents applicatifs
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Incidents ouverts"    value={stats.open}   icon={AlertCircle} accent={stats.open > 0 ? 'danger' : 'success'} />
        <KpiCard label="Incidents sur 24h"    value={stats.last24h} icon={Clock}       accent={stats.last24h > 0 ? 'warning' : 'success'} />
        <KpiCard label="Incidents sur 7 jours" value={stats.last7d} icon={AlertTriangle} accent={stats.last7d > 0 ? 'warning' : 'success'} />
        <KpiCard label="Temps d'indisponibilité" value={stats.downtime} icon={Timer} accent="default" />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Historique des incidents</CardTitle>
            <CardDescription>{filtered.length} incident(s)</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* App filter */}
            <Select value={appFilter} onValueChange={setAppFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Application" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_APPS}>Toutes les apps</SelectItem>
                {apps.map((app) => (
                  <SelectItem key={app.id} value={String(app.id)}>
                    {app.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterKey)}>
              <TabsList>
                <TabsTrigger value="ALL">Tous</TabsTrigger>
                <TabsTrigger value="OPEN">Ouverts</TabsTrigger>
                <TabsTrigger value="RESOLVED">Résolus</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun incident dans cette catégorie
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inc) => {
                    const app = appsById.get(inc.application_id);
                    return (
                      <TableRow key={inc.id}>
                        <TableCell className="text-sm font-medium whitespace-nowrap">
                          {app?.name ?? `App #${inc.application_id}`}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDateTime(inc.started_at)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {inc.resolved_at ? formatDateTime(inc.resolved_at) : '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDuration(inc.started_at, inc.resolved_at)}
                        </TableCell>
                        <TableCell>
                          <IncidentStatusBadge status={inc.status} />
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {inc.http_code ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs">
                          {inc.description ?? '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
