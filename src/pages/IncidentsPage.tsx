import { useMemo } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/KpiCard';
import { IncidentStatusBadge } from '@/components/shared/StatusBadges';
import { AlertTriangle, Clock, AlertCircle, Timer } from 'lucide-react';
import { useApplication, useIncidents } from '@/hooks/useMonitoring';
import { formatDateTime, formatDuration } from '@/services/mockData';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FilterKey = 'ALL' | 'OPEN' | 'RESOLVED';

export function IncidentsPage() {
  const { app } = useApplication();
  const { incidents } = useIncidents(app?.id);
  const [filter, setFilter] = useState<FilterKey>('ALL');

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

  const filteredIncidents = useMemo(() => {
    if (filter === 'ALL') return incidents;
    return incidents.filter((i) => i.status === filter);
  }, [incidents, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Incidents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Historique et suivi des incidents applicatifs
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Incidents ouverts"
          value={stats.open}
          icon={AlertCircle}
          accent={stats.open > 0 ? 'danger' : 'success'}
        />
        <KpiCard
          label="Incidents sur 24h"
          value={stats.last24h}
          icon={Clock}
          accent={stats.last24h > 0 ? 'warning' : 'success'}
        />
        <KpiCard
          label="Incidents sur 7 jours"
          value={stats.last7d}
          icon={AlertTriangle}
          accent={stats.last7d > 0 ? 'warning' : 'success'}
        />
        <KpiCard
          label="Temps d'indisponibilité"
          value={stats.downtime}
          icon={Timer}
          accent="default"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Historique des incidents</CardTitle>
            <CardDescription>{filteredIncidents.length} incident(s)</CardDescription>
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
            <TabsList>
              <TabsTrigger value="ALL">Tous</TabsTrigger>
              <TabsTrigger value="OPEN">Ouverts</TabsTrigger>
              <TabsTrigger value="RESOLVED">Résolus</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredIncidents.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun incident dans cette catégorie
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((inc) => (
                    <TableRow key={inc.id}>
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
                      <TableCell className="text-sm max-w-md">
                        {inc.description ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
