import type { Application, MonitoringCheck, Incident } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * Data service layer — backed by Supabase SELECT queries.
 * All functions log errors and return safe defaults so the UI does not crash.
 */

function logError(context: string, error: unknown) {
  // eslint-disable-next-line no-console
  console.error(`[monitoringService] ${context}:`, error);
}

/**
 * Normalise le statut provenant de Supabase.
 *
 * Exemple :
 * "OK - Site fonctionnel [200]" → "OK"
 * "ALERTE - Réponse lente"     → "ALERTE"
 * "CRITIQUE - Site inaccessible" → "CRITIQUE"
 */
function normalizeCheckStatus(status: string): MonitoringCheck['status'] {
  if (status.startsWith('OK')) {
    return 'OK';
  }

  if (status.startsWith('ALERTE')) {
    return 'ALERTE';
  }

  if (status.startsWith('CRITIQUE')) {
    return 'CRITIQUE';
  }

  // Valeur inconnue : on considère le contrôle comme critique
  // plutôt que de l'afficher comme opérationnel.
  return 'CRITIQUE';
}

/**
 * Transforme une ligne Supabase en objet MonitoringCheck
 * avec un statut normalisé pour le frontend.
 */
function normalizeMonitoringCheck(data: unknown): MonitoringCheck {
  const check = data as MonitoringCheck;

  return {
    ...check,
    status: normalizeCheckStatus(String(check.status ?? '')),
  };
}

export async function getApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('id, name, url, environment, active, created_at')
    .eq('active', true)
    .order('name');

  if (error) {
    logError('getApplications', error);
    return [];
  }

  return (data ?? []) as Application[];
}

export async function getLatestCheck(
  applicationId: number
): Promise<MonitoringCheck | null> {
  const { data, error } = await supabase
    .from('monitoring_checks')
    .select(
      'id, application_id, timestamp, internet, dns, ip, port_443, http_code, response_time_ms, status, level, created_at'
    )
    .eq('application_id', applicationId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logError('getLatestCheck', error);
    return null;
  }

  return data ? normalizeMonitoringCheck(data) : null;
}

export async function getRecentChecks(
  applicationId: number,
  hours: number = 24
): Promise<MonitoringCheck[]> {
  const cutoff = new Date(
    Date.now() - hours * 3600 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from('monitoring_checks')
    .select(
      'id, application_id, timestamp, internet, dns, ip, port_443, http_code, response_time_ms, status, level, created_at'
    )
    .eq('application_id', applicationId)
    .gte('timestamp', cutoff)
    .order('timestamp', { ascending: false });

  if (error) {
    logError('getRecentChecks', error);
    return [];
  }

  return (data ?? []).map(normalizeMonitoringCheck);
}

export async function getAllChecks(
  applicationId: number,
  limit?: number
): Promise<MonitoringCheck[]> {
  let query = supabase
    .from('monitoring_checks')
    .select(
      'id, application_id, timestamp, internet, dns, ip, port_443, http_code, response_time_ms, status, level, created_at'
    )
    .eq('application_id', applicationId)
    .order('timestamp', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    logError('getAllChecks', error);
    return [];
  }

  return (data ?? []).map(normalizeMonitoringCheck);
}

export async function getIncidents(
  applicationId: number
): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select(
      'id, application_id, started_at, resolved_at, duration_seconds, status, http_code, description, created_at'
    )
    .eq('application_id', applicationId)
    .order('started_at', { ascending: false });

  if (error) {
    logError('getIncidents', error);
    return [];
  }

  return (data ?? []) as Incident[];
}

export async function getOpenIncidents(
  applicationId: number
): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select(
      'id, application_id, started_at, resolved_at, duration_seconds, status, http_code, description, created_at'
    )
    .eq('application_id', applicationId)
    .eq('status', 'OPEN')
    .order('started_at', { ascending: false });

  if (error) {
    logError('getOpenIncidents', error);
    return [];
  }

  return (data ?? []) as Incident[];
}

export async function getRecentIncidents(
  applicationId: number,
  hours: number
): Promise<Incident[]> {
  const cutoff = new Date(
    Date.now() - hours * 3600 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from('incidents')
    .select(
      'id, application_id, started_at, resolved_at, duration_seconds, status, http_code, description, created_at'
    )
    .eq('application_id', applicationId)
    .gte('started_at', cutoff)
    .order('started_at', { ascending: false });

  if (error) {
    logError('getRecentIncidents', error);
    return [];
  }

  return (data ?? []) as Incident[];
}

export async function getDowntimeMinutes(
  applicationId: number,
  hours: number
): Promise<number> {
  const incidents = await getRecentIncidents(applicationId, hours);

  let totalSeconds = 0;

  for (const inc of incidents) {
    if (inc.duration_seconds !== null) {
      totalSeconds += inc.duration_seconds;
    } else if (inc.status === 'OPEN') {
      const start = new Date(inc.started_at).getTime();
      const now = Date.now();

      totalSeconds += Math.max(
        0,
        Math.round((now - start) / 1000)
      );
    }
  }

  return Math.round(totalSeconds / 60);
}

export async function getAvailability(
  applicationId: number,
  hours: number = 24
): Promise<number> {
  const downtime = await getDowntimeMinutes(
    applicationId,
    hours
  );

  const total = hours * 60;

  return Math.max(
    0,
    ((total - downtime) / total) * 100
  );
}