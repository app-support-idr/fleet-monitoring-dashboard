import { useEffect, useState, useCallback } from 'react';
import type { MonitoringUser, MonitoringStatus, UserRole } from '@/types';
import {
  fetchAllUsers,
  updateUserStatus,
  updateUserRole,
} from '@/services/adminService';

const REFRESH_INTERVAL = 30_000;

export function useAdminUsers(isAdmin: boolean) {
  const [users, setUsers] = useState<MonitoringUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return; }
    const { data, error: err } = await fetchAllUsers();
    if (err) {
      setError(err);
    } else {
      setUsers(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    let active = true;
    const doLoad = async () => {
      if (!active) return;
      await load();
    };
    doLoad();
    const interval = window.setInterval(doLoad, REFRESH_INTERVAL);
    return () => { active = false; window.clearInterval(interval); };
  }, [isAdmin, load]);

  const changeStatus = useCallback(
    async (userId: string, status: MonitoringStatus): Promise<{ error: string | null }> => {
      const { error: err } = await updateUserStatus(userId, status);
      if (!err) { await load(); }
      return { error: err };
    },
    [load]
  );

  const changeRole = useCallback(
    async (userId: string, role: UserRole): Promise<{ error: string | null }> => {
      const { error: err } = await updateUserRole(userId, role);
      if (!err) { await load(); }
      return { error: err };
    },
    [load]
  );

  return { users, loading, error, changeStatus, changeRole, reload: load };
}
