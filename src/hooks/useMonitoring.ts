import { useEffect, useState, useCallback, useMemo } from 'react';
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

const REFRESH_INTERVAL = 30_000;
const NOTIFICATIONS_STORAGE_KEY = 'fleet-notifications-last-seen';
const NOTIFICATIONS_WINDOW_HOURS = 24 * 7; // 7 days
const MAX_NOTIFICATIONS = 20;

// ─── Applications ─────────────────────────────────────────────────────────────

export function useApplications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await getApplications();
      if (!active) return;
      setApps(data);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, []);

  return { apps, loading };
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

  useEffect(() => {
    if (!applicationId) return;
    let active = true;

    const load = async () => {
      const data = await getLatestCheck(applicationId);
      if (!active) return;
      setCheck(data);
      setLoading(false);
    };

    load();
    const interval = window.setInterval(load, REFRESH_INTERVAL);
    return () => { active = false; window.clearInterval(interval); };
  }, [applicationId]);

  return { check, loading };
}

// ─── Latest checks for all apps ──────────────────────────────────────────────

export function useLatestChecksAllApps(apps: Application[]) {
  const [checksMap, setChecksMap] = useState<Map<number, MonitoringCheck>>(new Map());
  const [loading, setLoading] = useState(true);
  const appIds = useMemo(() => apps.map((a) => a.id), [apps]);
  const appIdsKey = appIds.join(',');

  useEffect(() => {
    if (apps.length === 0) { setLoading(false); return; }
    let active = true;

    const load = async () => {
      const data = await getLatestChecksAllApps(apps);
      if (!active) return;
      setChecksMap(data);
      setLoading(false);
    };

    load();
    const interval = window.setInterval(load, REFRESH_INTERVAL);
    return () => { active = false; window.clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appIdsKey]);

  return { checksMap, loading };
}

// ─── Recent checks (single app) ──────────────────────────────────────────────

export function useRecentChecks(applicationId: number | undefined, hours: number = 24) {
  const [checks, setChecks] = useState<MonitoringCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!applicationId) return;
    let active = true;

    const load = async () => {
      const data = await getRecentChecks(applicationId, hours);
      if (!active) return;
      setChecks(data);
      setLoading(false);
    };

    load();
    const interval = window.setInterval(load, REFRESH_INTERVAL);
    return () => { active = false; window.clearInterval(interval); };
  }, [applicationId, hours]);

  return { checks, loading };
}

// ─── Recent checks for multiple apps (history) ───────────────────────────────

export function useRecentChecksAllApps(appIds: number[], hours: number = 24) {
  const [checks, setChecks] = useState<MonitoringCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const key = appIds.join(',');

  useEffect(() => {
    if (appIds.length === 0) { setLoading(false); return; }
    let active = true;

    const load = async () => {
      const data = await getRecentChecksAllApps(appIds, hours);
      if (!active) return;
      setChecks(data);
      setLoading(false);
    };

    load();
    const interval = window.setInterval(load, REFRESH_INTERVAL);
    return () => { active = false; window.clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hours]);

  return { checks, loading };
}

// ─── Incidents (single app) ───────────────────────────────────────────────────

export function useIncidents(applicationId: number | undefined) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!applicationId) return;
    let active = true;

    const load = async () => {
      const data = await getIncidents(applicationId);
      if (!active) return;
      setIncidents(data);
      setLoading(false);
    };

    load();
    const interval = window.setInterval(load, REFRESH_INTERVAL);
    return () => { active = false; window.clearInterval(interval); };
  }, [applicationId]);

  return { incidents, loading };
}

// ─── Incidents for multiple apps ──────────────────────────────────────────────

export function useIncidentsAllApps(appIds: number[]) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const key = appIds.join(',');

  useEffect(() => {
    if (appIds.length === 0) { setLoading(false); return; }
    let active = true;

    const load = async () => {
      const data = await getIncidentsAllApps(appIds);
      if (!active) return;
      setIncidents(data);
      setLoading(false);
    };

    load();
    const interval = window.setInterval(load, REFRESH_INTERVAL);
    return () => { active = false; window.clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { incidents, loading };
}

// ─── Availability ─────────────────────────────────────────────────────────────

export function useAvailability(applicationId: number | undefined, hours: number = 24) {
  const [availability, setAvailability] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!applicationId) return;
    let active = true;

    const load = async () => {
      const data = await getAvailability(applicationId, hours);
      if (!active) return;
      setAvailability(data);
      setLoading(false);
    };

    load();
    const interval = window.setInterval(load, REFRESH_INTERVAL);
    return () => { active = false; window.clearInterval(interval); };
  }, [applicationId, hours]);

  return { availability, loading };
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

  const appIds = useMemo(() => apps.map((a) => a.id), [apps]);
  const appsById = useMemo(() => new Map(apps.map((a) => [a.id, a])), [apps]);
  const appIdsKey = appIds.join(',');

  useEffect(() => {
    if (appIds.length === 0) { setLoading(false); return; }
    let active = true;

    const load = async () => {
      const incidents = await getIncidentsAllApps(appIds, NOTIFICATIONS_WINDOW_HOURS);
      if (!active) return;
      const notifications = incidentsToNotifications(incidents, appsById);
      setAllNotifications(notifications.slice(0, MAX_NOTIFICATIONS));
      setLoading(false);
    };

    load();
    const interval = window.setInterval(load, REFRESH_INTERVAL);
    return () => { active = false; window.clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appIdsKey]);

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

  return { notifications: allNotifications, unreadCount, markAllAsRead, isUnread, loading };
}
