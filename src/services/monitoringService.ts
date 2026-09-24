import type { Application, MonitoringCheck, Incident, AppNotification } from '@/types';
import { supabase } from '@/lib/supabase';

function logError(context: string, error: unknown) {
  // eslint-disable-next-line no-console
  console.error(`[monitoringService] ${context}:`, error);
}

const CHECK_COLUMNS =
  'id, application_id, timestamp, internet, dns, ip, port_443, http_code, response_time_ms, status, level, created_at';

function normalizeCheckStatus(status: string): MonitoringCheck['status'] {
  if (status.startsWith('OK')) return 'OK';
  if (status.startsWith('ALERTE')) return 'ALERTE';
  if (status.startsWith('CRITIQUE')) return 'CRITIQUE';
  return 'CRITIQUE';
}

function normalizeMonitoringCheck(data: unknown): MonitoringCheck {
  const check = data as MonitoringCheck;
  return { ...check, status: normalizeCheckStatus(String(check.status ?? '')) };
}

// ─── Applications ────────────────────────────────────────────────────────────

export async function getApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('id, name, url, environment, active, created_at')
    .eq('active', true)
    .order('name');

  if (error) { logError('getApplications', error); return []; }
  return (data ?? []) as Application[];
}

// ─── Latest check (single app) ───────────────────────────────────────────────

export async function getLatestCheck(applicationId: number): Promise<MonitoringCheck | null> {
  const { data, error } = await supabase
    .from('monitoring_checks')
    .select(CHECK_COLUMNS)
    .eq('application_id', applicationId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) { logError('getLatestCheck', error); return null; }
  return data ? normalizeMonitoringCheck(data) : null;
}

// ─── Latest check for all active apps ────────────────────────────────────────

export async function getLatestChecksAllApps(
  apps: Application[]
): Promise<Map<number, MonitoringCheck>> {
  if (apps.length === 0) return new Map();

  const appIds = apps.map((a) => a.id);
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min window

  const { data, error } = await supabase
    .from('monitoring_checks')
    .select(CHECK_COLUMNS)
    .in('application_id', appIds)
    .gte('timestamp', cutoff)
    .order('timestamp', { ascending: false });

  if (error) { logError('getLatestChecksAllApps', error); return new Map(); }

  const result = new Map<number, MonitoringCheck>();
  for (const row of (data ?? [])) {
    const check = normalizeMonitoringCheck(row);
    if (!result.has(check.application_id)) {
      result.set(check.application_id, check);
    }
  }

  // For apps with no recent check, try fetching their absolute latest
  const missing = appIds.filter((id) => !result.has(id));
  if (missing.length > 0) {
    await Promise.all(
      missing.map(async (id) => {
        const check = await getLatestCheck(id);
        if (check) result.set(id, check);
      })
    );
  }

  return result;
}

// ─── Recent checks (single app) ──────────────────────────────────────────────

export async function getRecentChecks(
  applicationId: number,
  hours: number = 24
): Promise<MonitoringCheck[]> {
  const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from('monitoring_checks')
    .select(CHECK_COLUMNS)
    .eq('application_id', applicationId)
    .gte('timestamp', cutoff)
    .order('timestamp', { ascending: false });

  if (error) { logError('getRecentChecks', error); return []; }
  return (data ?? []).map(normalizeMonitoringCheck);
}

// ─── Recent checks (all apps, for history page) ───────────────────────────────

export async function getRecentChecksAllApps(
  appIds: number[],
  hours: number = 24
): Promise<MonitoringCheck[]> {
  if (appIds.length === 0) return [];
  const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from('monitoring_checks')
    .select(CHECK_COLUMNS)
    .in('application_id', appIds)
    .gte('timestamp', cutoff)
    .order('timestamp', { ascending: false });

  if (error) { logError('getRecentChecksAllApps', error); return []; }
  return (data ?? []).map(normalizeMonitoringCheck);
}

// ─── Incidents (single app) ───────────────────────────────────────────────────

export async function getIncidents(applicationId: number): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('id, application_id, started_at, resolved_at, duration_seconds, status, http_code, description, created_at')
    .eq('application_id', applicationId)
    .order('started_at', { ascending: false });

  if (error) { logError('getIncidents', error); return []; }
  return (data ?? []) as Incident[];
}

// ─── Incidents (all apps) ─────────────────────────────────────────────────────

export async function getIncidentsAllApps(
  appIds: number[],
  hours: number = 24 * 7
): Promise<Incident[]> {
  if (appIds.length === 0) return [];
  const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from('incidents')
    .select('id, application_id, started_at, resolved_at, duration_seconds, status, http_code, description, created_at')
    .in('application_id', appIds)
    .gte('started_at', cutoff)
    .order('started_at', { ascending: false });

  if (error) { logError('getIncidentsAllApps', error); return []; }
  return (data ?? []) as Incident[];
}

// ─── Open incidents ───────────────────────────────────────────────────────────

export async function getOpenIncidents(applicationId: number): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('id, application_id, started_at, resolved_at, duration_seconds, status, http_code, description, created_at')
    .eq('application_id', applicationId)
    .eq('status', 'OPEN')
    .order('started_at', { ascending: false });

  if (error) { logError('getOpenIncidents', error); return []; }
  return (data ?? []) as Incident[];
}

// ─── Recent incidents (single app) ────────────────────────────────────────────

export async function getRecentIncidents(applicationId: number, hours: number): Promise<Incident[]> {
  const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from('incidents')
    .select('id, application_id, started_at, resolved_at, duration_seconds, status, http_code, description, created_at')
    .eq('application_id', applicationId)
    .gte('started_at', cutoff)
    .order('started_at', { ascending: false });

  if (error) { logError('getRecentIncidents', error); return []; }
  return (data ?? []) as Incident[];
}

// ─── Notifications derived from incidents ─────────────────────────────────────

export function incidentsToNotifications(
  incidents: Incident[],
  appsById: Map<number, Application>
): AppNotification[] {
  const notifications: AppNotification[] = [];

  for (const inc of incidents) {
    const app = appsById.get(inc.application_id);
    const appName = app?.name ?? `App #${inc.application_id}`;

    notifications.push({
      id: `incident-${inc.id}-created`,
      incidentId: inc.id,
      type: 'created',
      timestamp: inc.started_at,
      applicationId: inc.application_id,
      applicationName: appName,
      description: inc.description,
      httpCode: inc.http_code,
      durationSeconds: null,
    });

    if (inc.resolved_at) {
      notifications.push({
        id: `incident-${inc.id}-resolved`,
        incidentId: inc.id,
        type: 'resolved',
        timestamp: inc.resolved_at,
        applicationId: inc.application_id,
        applicationName: appName,
        description: inc.description,
        httpCode: inc.http_code,
        durationSeconds: inc.duration_seconds,
      });
    }
  }

  return notifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// ─── Availability helpers ─────────────────────────────────────────────────────

export async function getDowntimeMinutes(applicationId: number, hours: number): Promise<number> {
  const incidents = await getRecentIncidents(applicationId, hours);
  let totalSeconds = 0;

  for (const inc of incidents) {
    if (inc.duration_seconds !== null) {
      totalSeconds += inc.duration_seconds;
    } else if (inc.status === 'OPEN') {
      const start = new Date(inc.started_at).getTime();
      totalSeconds += Math.max(0, Math.round((Date.now() - start) / 1000));
    }
  }

  return Math.round(totalSeconds / 60);
}

export async function getAvailability(applicationId: number, hours: number = 24): Promise<number> {
  const downtime = await getDowntimeMinutes(applicationId, hours);
  const total = hours * 60;
  return Math.max(0, ((total - downtime) / total) * 100);
}
