/*
# Create monitoring_users table with role support

## Summary
Creates the `public.monitoring_users` table that was referenced by the frontend
but never existed in the database. This table tracks each user's monitoring
access status and role. Includes a trigger that automatically creates a
PENDING row when a new user signs up via Supabase Auth.

## New Table
- `monitoring_users`
  - id (int, primary key, serial)
  - user_id (uuid, unique, references auth.users ON DELETE CASCADE)
  - status (text, NOT NULL, DEFAULT 'PENDING') — PENDING / ACTIVE / DISABLED
  - role (text, NOT NULL, DEFAULT 'USER') — ADMIN / USER
  - created_at (timestamptz, DEFAULT now())
  - activated_at (timestamptz, nullable)

## Security
- RLS enabled on monitoring_users
- SELECT: users read their own row; ADMIN+ACTIVE reads all
- UPDATE: ADMIN+ACTIVE can update any row
- INSERT: users can insert their own row; the auto-trigger also inserts via SECURITY DEFINER

## Trigger
- `on_auth_user_created_monitoring` — AFTER INSERT on auth.users, creates a
  PENDING monitoring_users row automatically. Uses SECURITY DEFINER so it
  works even before the user has a session.

## Bootstrap
After applying, set the first admin manually:
  UPDATE public.monitoring_users
  SET role = 'ADMIN', status = 'ACTIVE', activated_at = now()
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'benja.rakotondrafara@idrental.mg');
*/

CREATE TABLE IF NOT EXISTS public.monitoring_users (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'DISABLED')),
  role text NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz
);

ALTER TABLE public.monitoring_users ENABLE ROW LEVEL SECURITY;

-- SELECT: own row OR admin
DROP POLICY IF EXISTS "monitoring_users_select_own_or_admin" ON public.monitoring_users;
CREATE POLICY "monitoring_users_select_own_or_admin"
ON public.monitoring_users FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.monitoring_users mu
    WHERE mu.user_id = auth.uid()
      AND mu.status = 'ACTIVE'
      AND mu.role = 'ADMIN'
  )
);

-- UPDATE: admin only
DROP POLICY IF EXISTS "monitoring_users_update_admin" ON public.monitoring_users;
CREATE POLICY "monitoring_users_update_admin"
ON public.monitoring_users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.monitoring_users mu
    WHERE mu.user_id = auth.uid()
      AND mu.status = 'ACTIVE'
      AND mu.role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.monitoring_users mu
    WHERE mu.user_id = auth.uid()
      AND mu.status = 'ACTIVE'
      AND mu.role = 'ADMIN'
  )
);

-- INSERT: own row (for manual insert if needed)
DROP POLICY IF EXISTS "monitoring_users_insert_own" ON public.monitoring_users;
CREATE POLICY "monitoring_users_insert_own"
ON public.monitoring_users FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Auto-create monitoring_users row on signup
CREATE OR REPLACE FUNCTION public.handle_new_monitoring_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.monitoring_users (user_id, status, role)
  VALUES (NEW.id, 'PENDING', 'USER')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_monitoring ON auth.users;
CREATE TRIGGER on_auth_user_created_monitoring
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_monitoring_user();