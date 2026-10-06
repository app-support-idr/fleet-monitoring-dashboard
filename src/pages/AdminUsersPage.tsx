import { useState, useMemo } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Search, Shield, Users, UserCheck, UserX, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers } from '@/hooks/useAdmin';
import { formatDateTime } from '@/services/mockData';
import type { MonitoringUser, MonitoringStatus, UserRole } from '@/types';

type StatusFilter = 'ALL' | MonitoringStatus;
type RoleFilter = 'ALL' | UserRole;

function StatusBadge({ status }: { status: MonitoringStatus }) {
  const config: Record<MonitoringStatus, { label: string; className: string }> = {
    PENDING: { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' },
    ACTIVE: { label: 'Actif', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' },
    DISABLED: { label: 'Desactive', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-800">
        <ShieldCheck className="h-3 w-3" />
        ADMIN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
      USER
    </span>
  );
}

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  action: (() => Promise<void>) | null;
}

export default function AdminUsersPage() {
  const { user, monitoringRole } = useAuth();
  const isAdmin = monitoringRole === 'ADMIN';
  const { users, loading, error, changeStatus, changeRole } = useAdminUsers(isAdmin);
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false, title: '', description: '', action: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = search === '' || u.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === 'ACTIVE').length,
      pending: users.filter((u) => u.status === 'PENDING').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
    };
  }, [users]);

  const doConfirm = async () => {
    if (!confirm.action) return;
    setActionLoading(true);
    await confirm.action();
    setActionLoading(false);
    setConfirm({ open: false, title: '', description: '', action: null });
  };

  const handleStatusChange = (u: MonitoringUser, newStatus: MonitoringStatus) => {
    const actionLabel = newStatus === 'ACTIVE'
      ? (u.status === 'PENDING' ? 'activer' : 'reactiver')
      : 'desactiver';

    setConfirm({
      open: true,
      title: `Confirmer l'action`,
      description: `Voulez-vous vraiment ${actionLabel} l'utilisateur ${u.email} ?`,
      action: async () => {
        const { error: err } = await changeStatus(u.user_id, newStatus);
        if (err) {
          toast({ title: 'Erreur', description: err, variant: 'destructive' });
        } else {
          toast({ title: 'Succès', description: `Utilisateur ${actionLabel} avec succès.` });
        }
      },
    });
  };

  const handleRoleChange = (u: MonitoringUser, newRole: UserRole) => {
    const actionLabel = newRole === 'ADMIN' ? 'promouvoir administrateur' : 'retrograder utilisateur';

    setConfirm({
      open: true,
      title: `Confirmer le changement de rôle`,
      description: `Voulez-vous vraiment ${actionLabel} pour ${u.email} ?`,
      action: async () => {
        const { error: err } = await changeRole(u.user_id, newRole);
        if (err) {
          toast({ title: 'Erreur', description: err, variant: 'destructive' });
        } else {
          toast({ title: 'Succès', description: `Rôle modifié avec succès.` });
        }
      },
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
        <Shield className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">Accès reserve aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestion des utilisateurs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerez les acces a la plateforme Fleet Monitoring.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Utilisateurs</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
            <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/50">
            <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.admins}</p>
            <p className="text-xs text-muted-foreground">Administrateurs</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>
            {filtered.length} utilisateur(s) {error ? `— Erreur: ${error}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="ACTIVE">Actifs</SelectItem>
                <SelectItem value="DISABLED">Desactives</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les roles</SelectItem>
                <SelectItem value="ADMIN">Administrateurs</SelectItem>
                <SelectItem value="USER">Utilisateurs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table (desktop) / Cards (mobile) */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun utilisateur trouve.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Cree le</TableHead>
                      <TableHead>Active le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => (
                      <TableRow key={u.id} className="hover:bg-accent/50 transition-colors">
                        <TableCell className="text-sm font-medium">{u.email}</TableCell>
                        <TableCell><StatusBadge status={u.status} /></TableCell>
                        <TableCell><RoleBadge role={u.role} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(u.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {u.activated_at ? formatDateTime(u.activated_at) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Status action */}
                            {u.status === 'PENDING' && (
                              <Button size="sm" variant="default" className="h-7 text-xs"
                                onClick={() => handleStatusChange(u, 'ACTIVE')}>
                                Activer
                              </Button>
                            )}
                            {u.status === 'ACTIVE' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => handleStatusChange(u, 'DISABLED')}>
                                Desactiver
                              </Button>
                            )}
                            {u.status === 'DISABLED' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => handleStatusChange(u, 'ACTIVE')}>
                                Reactiver
                              </Button>
                            )}
                            {/* Role action — prevent self-demotion via UI */}
                            {u.user_id !== user?.id && (
                              <Select
                                value={u.role}
                                onValueChange={(v) => handleRoleChange(u, v as UserRole)}
                              >
                                <SelectTrigger className="h-7 w-28 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="USER">USER</SelectItem>
                                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {u.user_id === user?.id && (
                              <span className="text-xs text-muted-foreground italic">Vous</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((u) => (
                  <div key={u.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{u.email}</p>
                      {u.user_id === user?.id && (
                        <span className="text-xs text-muted-foreground italic">Vous</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={u.status} />
                      <RoleBadge role={u.role} />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Cree: {formatDateTime(u.created_at)}</p>
                      <p>Active: {u.activated_at ? formatDateTime(u.activated_at) : '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {u.status === 'PENDING' && (
                        <Button size="sm" variant="default" className="h-8 text-xs"
                          onClick={() => handleStatusChange(u, 'ACTIVE')}>
                          <UserCheck className="mr-1 h-3.5 w-3.5" /> Activer
                        </Button>
                      )}
                      {u.status === 'ACTIVE' && (
                        <Button size="sm" variant="outline" className="h-8 text-xs"
                          onClick={() => handleStatusChange(u, 'DISABLED')}>
                          <UserX className="mr-1 h-3.5 w-3.5" /> Desactiver
                        </Button>
                      )}
                      {u.status === 'DISABLED' && (
                        <Button size="sm" variant="outline" className="h-8 text-xs"
                          onClick={() => handleStatusChange(u, 'ACTIVE')}>
                          <UserCheck className="mr-1 h-3.5 w-3.5" /> Reactiver
                        </Button>
                      )}
                      {u.user_id !== user?.id && (
                        <Select
                          value={u.role}
                          onValueChange={(v) => handleRoleChange(u, v as UserRole)}
                        >
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">USER</SelectItem>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <AlertDialog open={confirm.open} onOpenChange={(open) => !open && setConfirm({ open: false, title: '', description: '', action: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              onClick={(e) => { e.preventDefault(); void doConfirm(); }}
            >
              {actionLoading ? '...' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
