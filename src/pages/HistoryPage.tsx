import { useState, useMemo } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge, LevelBadge } from '@/components/shared/StatusBadges';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useApplications, useRecentChecksAllApps } from '@/hooks/useMonitoring';
import { formatDateTime } from '@/services/mockData';
import type { CheckStatus, Level } from '@/types';

const PAGE_SIZE = 15;
const ALL_APPS = 'all';

export function HistoryPage() {
  const { apps } = useApplications();
  const appIds = useMemo(() => apps.map((a) => a.id), [apps]);
  const appsById = useMemo(() => new Map(apps.map((a) => [a.id, a])), [apps]);
  const { checks } = useRecentChecksAllApps(appIds, 24);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [appFilter, setAppFilter] = useState<string>(ALL_APPS);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return checks.filter((c) => {
      const matchSearch =
        search === '' ||
        (c.site?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        c.ip.includes(search) ||
        (c.url?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (appsById.get(c.application_id)?.name.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchLevel = levelFilter === 'ALL' || c.level === levelFilter;
      const matchApp = appFilter === ALL_APPS || c.application_id === Number(appFilter);

      return matchSearch && matchStatus && matchLevel && matchApp;
    });
  }, [checks, search, statusFilter, levelFilter, appFilter, appsById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const resetPage = () => setPage(0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Historique</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Consultation des contrôles de monitoring
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contrôles de monitoring</CardTitle>
          <CardDescription>
            {filtered.length} contrôle(s) — {checks.length} total sur 24h
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par site, IP ou application..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                className="pl-9"
              />
            </div>

            {/* App filter */}
            <Select value={appFilter} onValueChange={(v) => { setAppFilter(v); resetPage(); }}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
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

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="OK">OK</SelectItem>
                <SelectItem value="ALERTE">ALERTE</SelectItem>
                <SelectItem value="CRITIQUE">CRITIQUE</SelectItem>
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); resetPage(); }}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les niveaux</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="ALERTE">ALERTE</SelectItem>
                <SelectItem value="CRITIQUE">CRITIQUE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date / heure</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>HTTP</TableHead>
                  <TableHead>Temps (ms)</TableHead>
                  <TableHead>DNS</TableHead>
                  <TableHead>Port 443</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                      Aucun contrôle trouvé avec ces filtres
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((c) => {
                    const app = appsById.get(c.application_id);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="whitespace-nowrap text-sm font-mono">
                          {formatDateTime(c.timestamp)}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap font-medium">
                          {app?.name ?? `App #${c.application_id}`}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.status as CheckStatus} />
                        </TableCell>
                        <TableCell>
                          <LevelBadge level={c.level as Level} />
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {c.http_code || '—'}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {c.response_time_ms}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.dns === 'OK' ? 'OK' : 'ÉCHEC'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.port_443 === 'OK' ? 'OK' : 'ÉCHEC'}
                        </TableCell>
                        <TableCell className="text-sm font-mono whitespace-nowrap">
                          {c.ip || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage + 1} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
