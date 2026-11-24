/*
# Enable Supabase Realtime for monitoring tables

1. Purpose
- Allow the dashboard to receive postgres_changes events (INSERT, UPDATE, DELETE)
  in real time for the monitoring data, without polling or page reload.
2. Changes
- Add the `applications`, `monitoring_checks` and `incidents` tables to the
  `supabase_realtime` publication (idempotent: each table is skipped if it is
  already a member of the publication).
3. Security
- No RLS changes. Realtime payloads are automatically filtered by the existing
  RLS policies for the role of the connected client.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'monitoring_checks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.monitoring_checks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'incidents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
  END IF;
END $$;
