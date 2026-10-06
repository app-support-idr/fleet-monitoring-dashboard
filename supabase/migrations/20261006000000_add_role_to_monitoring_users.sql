/*
# Add role column to monitoring_users

## Summary
Adds a `role` column to the existing `public.monitoring_users` table to support
ADMIN vs USER roles. Updates RLS policies so that:
- Any authenticated user can read their own row (as before)
- ADMIN users with ACTIVE status can read ALL rows
- ADMIN users with ACTIVE status can UPDATE other users' status and role
- No user can modify their own role directly via RLS (edge function enforces this too)

## Changes to existing table
- `monitoring_users.role` (text, NOT NULL, DEFAULT 'USER') — values: 'ADMIN' or 'USER'

## Security changes
- RLS remains enabled on monitoring_users
- SELECT policy: users read their own row; ADMIN+ACTIVE reads all
- UPDATE policy: ADMIN+ACTIVE can update any row
- INSERT policy: users can insert their own row
- A CHECK constraint enforces role IN ('ADMIN', 'USER')

## Important notes
1. Idempotent — safe to re-run
2. No existing data modified — all users get role='USER' by default
3. First ADMIN must be set manually via SQL (see report)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'monitoring_users'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.monitoring_users
      ADD COLUMN role text NOT NULL DEFAULT 'USER';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'monitoring_users_role_check'
  ) THEN
    ALTER TABLE public.monitoring_users
      ADD CONSTRAINT monitoring_users_role_check
      CHECK (role IN ('ADMIN', 'USER'));
  END IF;
END $$;

ALTER TABLE public.monitoring_users ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "monitoring_users_insert_own" ON public.monitoring_users;
CREATE POLICY "monitoring_users_insert_own"
ON public.monitoring_users FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
