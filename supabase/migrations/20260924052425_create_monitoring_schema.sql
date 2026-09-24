/*
# Create Fleet Monitoring Schema

## Summary
Creates the three core tables for the Fleet Monitoring Dashboard:
- `applications` — tracked web applications (Fleet Management, QHSE, IDROM)
- `monitoring_checks` — results of periodic monitoring checks per application
- `incidents` — incidents opened/closed per application

## Tables

### applications
- id (int, primary key)
- name (text) — display name
- url (text) — monitored URL
- environment (text) — PRODUCTION / STAGING / DEVELOPMENT
- active (boolean) — filter: only active apps are monitored
- created_at (timestamptz)

### monitoring_checks
- id (bigint, primary key generated always)
- application_id (int, FK → applications)
- timestamp (timestamptz)
- site, url (text, optional)
- internet, dns, ip, port_443 (text)
- http_code (int)
- response_time_ms (int)
- ssl_valid, ssl_expiration (text, kept for BDD compatibility but ignored by frontend)
- ssl_days_remaining (int, kept for BDD compatibility but ignored by frontend)
- status (text) — OK / ALERTE / CRITIQUE (may contain suffix text)
- level (text) — INFO / ALERTE / CRITIQUE
- created_at (timestamptz)

### incidents
- id (bigint, primary key generated always)
- application_id (int, FK → applications)
- started_at (timestamptz)
- resolved_at (timestamptz, nullable)
- duration_seconds (int, nullable)
- status (text) — OPEN / RESOLVED
- http_code (int, nullable)
- description (text, nullable)
- created_at (timestamptz)

## Security
- RLS enabled on all three tables
- Authenticated users can SELECT all rows (dashboard is read-only for front)
- Service role used by edge functions for INSERT/UPDATE (bypasses RLS)
- anon role gets SELECT so the anon-key Supabase client used by the dashboard works

## Notes
- SSL columns kept in monitoring_checks for backend compatibility; frontend ignores them
- Seed data inserted for the 3 applications
*/

-- ============================================================
-- applications
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id serial PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL,
  environment text NOT NULL DEFAULT 'PRODUCTION',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_applications" ON applications;
CREATE POLICY "anon_select_applications" ON applications FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- monitoring_checks
-- ============================================================
CREATE TABLE IF NOT EXISTS monitoring_checks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id int NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  site text,
  url text,
  internet text NOT NULL DEFAULT 'OK',
  dns text NOT NULL DEFAULT 'OK',
  ip text NOT NULL DEFAULT '',
  port_443 text NOT NULL DEFAULT 'OK',
  http_code int NOT NULL DEFAULT 200,
  response_time_ms int NOT NULL DEFAULT 0,
  ssl_valid text,
  ssl_expiration text,
  ssl_days_remaining int,
  status text NOT NULL DEFAULT 'OK',
  level text NOT NULL DEFAULT 'INFO',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS monitoring_checks_app_ts_idx
  ON monitoring_checks (application_id, timestamp DESC);

ALTER TABLE monitoring_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_monitoring_checks" ON monitoring_checks;
CREATE POLICY "anon_select_monitoring_checks" ON monitoring_checks FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- incidents
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id int NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  duration_seconds int,
  status text NOT NULL DEFAULT 'OPEN',
  http_code int,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS incidents_app_started_idx
  ON incidents (application_id, started_at DESC);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_incidents" ON incidents;
CREATE POLICY "anon_select_incidents" ON incidents FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- Seed: 3 applications
-- ============================================================
INSERT INTO applications (id, name, url, environment, active)
VALUES
  (1, 'Fleet Management',       'https://fleetmanagement.idrental.mg',        'PRODUCTION', true),
  (2, 'Portal QHSE',            'https://portal-qhse-idrental.base44.app',    'PRODUCTION', true),
  (3, 'IDR - Ordre de Mission', 'https://idrom.base44.app/',                  'PRODUCTION', true)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      url         = EXCLUDED.url,
      environment = EXCLUDED.environment,
      active      = EXCLUDED.active;
