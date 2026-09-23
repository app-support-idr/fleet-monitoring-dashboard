export type Environment = 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';

export type CheckStatus = 'OK' | 'ALERTE' | 'CRITIQUE';
export type Level = 'INFO' | 'ALERTE' | 'CRITIQUE';
export type IncidentStatus = 'OPEN' | 'RESOLVED';

export interface Application {
  id: number;
  name: string;
  url: string;
  environment: Environment;
  active: boolean;
  created_at: string;
}

export interface MonitoringCheck {
  id: number;
  application_id: number;
  timestamp: string;
  site?: string;
  url?: string;
  internet: string;
  dns: string;
  ip: string;
  port_443: string;
  http_code: number;
  response_time_ms: number;
  ssl_valid: string;
  ssl_expiration: string;
  ssl_days_remaining: number;
  status: CheckStatus;
  level: Level;
  created_at: string;
}

export interface Incident {
  id: number;
  application_id: number;
  started_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
  status: IncidentStatus;
  http_code: number | null;
  description: string | null;
  created_at: string;
}
