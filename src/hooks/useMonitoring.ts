import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { Application, MonitoringCheck, Incident, AppNotification } from '@/types';
import {
  getApplications,
  getLatestCheck,
  getLatestChecksAllApps,
  getRecentChecks,
  getRecentChecksAllApps,
  getIncidents,
  getIncidentsAllApps,
  getAvailability,
  incidentsToNotifications,
} from '@/services/monitoringService';

const REFRESH_INTERVAL = 30_000; // 30 secondes
const NOTIFICATIONS_STORAGE_KEY = 'fleet-notifications-last-seen';
const NOTIFICATIONS_WINDOW_HOURS = 24 * 7; // 7 days
const MAX_NOTIFICATIONS = 20;

function useVisibilityAwareInterval(callback: () => void, delay: number) {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const id = window.setInterval(() => savedCallback.current(), delay);
    return () => window.clearInterval(id);
  }, [isVisible, delay]);
}

// ─── Applications ─────────────────────────────────────────────────────────────

export function useApplications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await getApplications();
        if (!active) return;
        setApps(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  return { apps, loading, error };
}

// Legacy single-app hook kept for pages that still use it
export function useApplication() {
  const { apps, loading } = useApplications();
  return { app: apps[0] ?? null, loading };
}

// ─── Latest check (single app) ───────────────────────────────────────────────

export function useLatestCheck(applicationId: number | undefined) {
  const [check, setCheck] = useState<MonitoringCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!applicationId) return;
    try {
      const data = await getLatestCheck(applicationId);
      setCheck(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (!applicationId) return;
    let active = true;
    const run = async () => {
      try {
        const data = await getLatestCheck(applicationId);
        if (!active) return;
        setCheck(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [applicationId]);

  useVisibilityAwareInterval(load, REFRESH_INTERVAL);

  return { check, loading, error };
}

// ─── Latest checks for all apps ──────────────────────────────────────────────

export function useLatestChecksAllApps(apps: Application[]) {
  const [checksMap, setChecksMap] = useState<Map<number, MonitoringCheck>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (apps.length === 0) { setLoading(false); return; }
    try {
      const data = await getLatestChecksAllApps(apps);
      setChecksMap(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [apps]);

  useEffect(() => {
    if (apps.length === 0) { setLoading(false); return; }
    let active = true;
    const run = async () => {
      try {
        const data = await getLatestChecksAllApps(apps);
        if (!active) return;
        setChecksMap(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [apps]);

  useVisibilityAwareInterval(load, REFRESH_INTERVAL);

  return { checksMap, loading, error };
}

// ─── Recent checks (single app) ──────────────────────────────────────────────

export function useRecentChecks(applicationId: number | undefined, hours: number = 24) {
  const [checks, setChecks] = useState<MonitoringCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!applicationId) return;
    try {
      const data = await getRecentChecks(applicationId, hours);
      setChecks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [applicationId, hours]);

  useEffect(() => {
    if (!applicationId) return;
    let active = true;
    const run = async () => {
      try {
        const data = await getRecentChecks(applicationId, hours);
        if (!active) return;
        setChecks(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [applicationId, hours]);

  useVisibilityAwareInterval(load, REFRESH_INTERVAL);

  return { checks, loading, error };
}

// ─── Recent checks for multiple apps (history) ───────────────────────────────

export function useRecentChecksAllApps(appIds: number[], hours: number = 24) {
  const [checks, setChecks] = useState<MonitoringCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (appIds.length === 0) { setLoading(false); return; }
    try {
      const data = await getRecentChecksAllApps(appIds, hours);
      setChecks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [appIds, hours]);

  useEffect(() => {
    if (appIds.length === 0) { setLoading(false); return; }
    let active = true;
    const run = async () => {
      try {
        const data = await getRecentChecksAllApps(appIds, hours);
        if (!active) return;
        setChecks(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [appIds, hours]);

  useVisibilityAwareInterval(load, REFRESH_INTERVAL);

  return { checks, loading, error };
}

// ─── Incidents (single app) ───────────────────────────────────────────────────

export function useIncidents(applicationId: number | undefined) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!applicationId) return;
    try {
      const data = await getIncidents(applicationId);
      setIncidents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (!applicationId) return;
    let active = true;
    const run = async () => {
      try {
        const data = await getIncidents(applicationId);
        if (!active) return;
        setIncidents(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [applicationId]);

  useVisibilityAwareInterval(load, REFRESH_INTERVAL);

  return { incidents, loading, error };
}

// ─── Incidents for multiple apps ──────────────────────────────────────────────

export function useIncidentsAllApps(appIds: number[]) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (appIds.length === 0) { setLoading(false); return; }
    try {
      const data = await getIncidentsAllApps(appIds);
      setIncidents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [appIds]);

  useEffect(() => {
    if (appIds.length === 0) { setLoading(false); return; }
    let active = true;
    const run = async () => {
      try {
        const data = await getIncidentsAllApps(appIds);
        if (!active) return;
        setIncidents(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [appIds]);

  useVisibilityAwareInterval(load, REFRESH_INTERVAL);

  return { incidents, loading, error };
}

// ─── Availability ─────────────────────────────────────────────────────────────

export function useAvailability(applicationId: number | undefined, hours: number = 24) {
  const [availability, setAvailability] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!applicationId) return;
    try {
      const data = await getAvailability(applicationId, hours);
      setAvailability(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [applicationId, hours]);

  useEffect(() => {
    if (!applicationId) return;
    let active = true;
    const run = async () => {
      try {
        const data = await getAvailability(applicationId, hours);
        if (!active) return;
        setAvailability(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [applicationId, hours]);

  useVisibilityAwareInterval(load, REFRESH_INTERVAL);

  return { availability, loading, error };
}

// ─── Notifications ────────────────────────────────────────────────────────────

function readLastSeen(): string | null {
  try { return localStorage.getItem(NOTIFICATIONS_STORAGE_KEY); } catch { return null; }
}

function writeLastSeen(ts: string) {
  try { localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, ts); } catch { /* noop */ }
}

export function useNotifications(apps: Application[]) {
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>([]);
  const [lastSeen, setLastSeen] = useState<string | null>(readLastSeen);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const appIds = useMemo(() => apps.map((a) => a.id), [apps]);
  const appsById = useMemo(() => new Map(apps.map((a) => [a.id, a])), [apps]);

  const load = useCallback(async () => {
    if (appIds.length === 0) { setLoading(false); return; }
    try {
      const incidents = await getIncidentsAllApps(appIds, NOTIFICATIONS_WINDOW_HOURS);
      const notifications = incidentsToNotifications(incidents, appsById);
      setAllNotifications(notifications.slice(0, MAX_NOTIFICATIONS));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [appIds, appsById]);

  useEffect(() => {
    if (appIds.length === 0) { setLoading(false); return; }
    let active = true;
    const run = async () => {
      try {
        const incidents = await getIncidentsAllApps(appIds, NOTIFICATIONS_WINDOW_HOURS);
        if (!active) return;
        const notifications = incidentsToNotifications(incidents, appsById);
        setAllNotifications(notifications.slice(0, MAX_NOTIFICATIONS));
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [appIds, appsById]);

  useVisibilityAwareInterval(load, REFRESH_INTERVAL);

  const unreadCount = useMemo(() => {
    if (!lastSeen) return allNotifications.length;
    return allNotifications.filter(
      (n) => new Date(n.timestamp).getTime() > new Date(lastSeen).getTime()
    ).length;
  }, [allNotifications, lastSeen]);

  const markAllAsRead = useCallback(() => {
    const now = new Date().toISOString();
    writeLastSeen(now);
    setLastSeen(now);
  }, []);

  const isUnread = useCallback(
    (n: AppNotification) => {
      if (!lastSeen) return true;
      return new Date(n.timestamp).getTime() > new Date(lastSeen).getTime();
    },
    [lastSeen]
  );

  return { notifications: allNotifications, unreadCount, markAllAsRead, isUnread, loading, error };
}
