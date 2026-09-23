import type { Application, MonitoringCheck, Incident, CheckStatus, Level } from '@/types';

export const fleetApp: Application = {
  id: 1,
  name: 'Fleet Management',
  url: 'https://fleetmanagement.idrental.mg',
  environment: 'PRODUCTION',
  active: true,
  created_at: '2024-01-15T00:00:00Z',
};

const SECONDS_PER_DAY = 86400;

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatISO(d: Date): string {
  return d.toISOString();
}

function deterministicSecondsAgo(secondsAgo: number): string {
  const d = new Date(Date.now() - secondsAgo * 1000);
  return formatISO(d);
}

function generateChecks(appId: number, count: number): MonitoringCheck[] {
  const checks: MonitoringCheck[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const ts = new Date(now - i * 5 * 60 * 1000);

    const isDegraded = i > 0 && i % 47 === 0;
    const isCritical = i > 0 && i % 83 === 0;

    let responseTime = Math.round(45 + Math.sin(i / 10) * 20 + (i % 7) * 3);
    if (isDegraded) responseTime = Math.round(180 + Math.random() * 80);
    if (isCritical) responseTime = Math.round(500 + Math.random() * 500);

    let httpCode = 200;
    let status: CheckStatus = 'OK';
    let level: Level = 'INFO';
    let internet = 'OK';
    let dns = 'OK';
    let port443 = 'OK';
    let sslValid = 'OK';

    if (isDegraded) {
      httpCode = 503;
      status = 'ALERTE';
      level = 'ALERTE';
    }
    if (isCritical) {
      httpCode = 0;
      status = 'CRITIQUE';
      level = 'CRITIQUE';
      internet = 'KO';
      dns = 'KO';
      port443 = 'KO';
    }

    const sslDaysRemaining = Math.max(0, Math.round(35 - i / 100));

    checks.push({
      id: i + 1,
      application_id: appId,
      timestamp: formatISO(ts),
      site: 'fleetmanagement.idrental.mg',
      url: 'https://fleetmanagement.idrental.mg',
      internet,
      dns,
      ip: '172.16.112.14',
      port_443: port443,
      http_code: httpCode,
      response_time_ms: responseTime,
      ssl_valid: sslValid,
      ssl_expiration: new Date(now + sslDaysRemaining * SECONDS_PER_DAY * 1000).toISOString(),
      ssl_days_remaining: sslDaysRemaining,
      status,
      level,
      created_at: formatISO(ts),
    });
  }

  return checks;
}

function generateIncidents(appId: number): Incident[] {
  return [
    {
      id: 1,
      application_id: appId,
      started_at: deterministicSecondsAgo(95 * 60),
      resolved_at: deterministicSecondsAgo(88 * 60),
      duration_seconds: 7 * 60,
      status: 'RESOLVED',
      http_code: 503,
      description: 'Temps de réponse élevé détecté — latence > 200ms sur plusieurs contrôles consécutifs.',
      created_at: deterministicSecondsAgo(95 * 60),
    },
    {
      id: 2,
      application_id: appId,
      started_at: deterministicSecondsAgo(50 * 60 * 60),
      resolved_at: deterministicSecondsAgo(49 * 60 * 60),
      duration_seconds: 60 * 60,
      status: 'RESOLVED',
      http_code: 0,
      description: 'Site inaccessible — échec de résolution DNS. Intervention réseau requise.',
      created_at: deterministicSecondsAgo(50 * 60 * 60),
    },
    {
      id: 3,
      application_id: appId,
      started_at: deterministicSecondsAgo(3 * 60 * 60),
      resolved_at: null,
      duration_seconds: null,
      status: 'OPEN',
      http_code: 200,
      description: 'Certificat SSL approche de l\'expiration (< 45 jours). Surveillance renforcée.',
      created_at: deterministicSecondsAgo(3 * 60 * 60),
    },
    {
      id: 4,
      application_id: appId,
      started_at: deterministicSecondsAgo(6 * 24 * 60 * 60),
      resolved_at: deterministicSecondsAgo(6 * 24 * 60 * 60 - 12 * 60),
      duration_seconds: 12 * 60,
      status: 'RESOLVED',
      http_code: 502,
      description: 'Erreur 502 Bad Gateway — redémarrage du service applicatif.',
      created_at: deterministicSecondsAgo(6 * 24 * 60 * 60),
    },
    {
      id: 5,
      application_id: appId,
      started_at: deterministicSecondsAgo(2 * 24 * 60 * 60),
      resolved_at: deterministicSecondsAgo(2 * 24 * 60 * 60 - 45 * 60),
      duration_seconds: 45 * 60,
      status: 'RESOLVED',
      http_code: 0,
      description: 'Port 443 injoignable. Panne firewall identifiée et corrigée.',
      created_at: deterministicSecondsAgo(2 * 24 * 60 * 60),
    },
  ];
}

export const mockChecks: MonitoringCheck[] = generateChecks(fleetApp.id, 288);
export const mockIncidents: Incident[] = generateIncidents(fleetApp.id);

export const mockApplications: Application[] = [fleetApp];

export function formatTimeLabel(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDuration(startISO: string, resolvedISO: string | null): string {
  if (!resolvedISO) return 'En cours';
  const start = new Date(startISO).getTime();
  const end = new Date(resolvedISO).getTime();
  const diffMin = Math.round((end - start) / 60000);
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${h}h ${m}min`;
}
