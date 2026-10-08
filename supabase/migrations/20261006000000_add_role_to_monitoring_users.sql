/*
# Add role column to monitoring_users

Adds ADMIN / USER roles while preserving the existing
monitoring_users schema.

Existing columns preserved:
- id
- user_id
- status
- created_at
- approved_at
- approved_by
*/

-- =========================================================
-- 1. Add role column if it does not already exist
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'monitoring_users'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.monitoring_users
      ADD COLUMN role text NOT NULL DEFAULT 'USER';
  END IF;
END $$;


-- =========================================================
-- 2. Add role constraint
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'monitoring_users_role_check'
      AND conrelid = 'public.monitoring_users'::regclass
  ) THEN
    ALTER TABLE public.monitoring_users
      ADD CONSTRAINT monitoring_users_role_check
      CHECK (role IN ('ADMIN', 'USER'));
  END IF;
END $$;


-- =========================================================
-- 3. Enable RLS
-- =========================================================

ALTER TABLE public.monitoring_users
ENABLE ROW LEVEL SECURITY;


-- =========================================================
-- 4. SELECT policy
-- Users can see their own record.
-- Active admins can see all monitoring users.
-- =========================================================

DROP POLICY IF EXISTS "monitoring_users_select_own_or_admin"
ON public.monitoring_users;

CREATE POLICY "monitoring_users_select_own_or_admin"
ON public.monitoring_users
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.monitoring_users mu
    WHERE mu.user_id = auth.uid()
      AND mu.status = 'ACTIVE'
      AND mu.role = 'ADMIN'
  )
);


-- =========================================================
-- 5. UPDATE policy
-- Only ACTIVE admins can update users.
-- =========================================================

DROP POLICY IF EXISTS "monitoring_users_update_admin"
ON public.monitoring_users;

CREATE POLICY "monitoring_users_update_admin"
ON public.monitoring_users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.monitoring_users mu
    WHERE mu.user_id = auth.uid()
      AND mu.status = 'ACTIVE'
      AND mu.role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.monitoring_users mu
    WHERE mu.user_id = auth.uid()
      AND mu.status = 'ACTIVE'
      AND mu.role = 'ADMIN'
  )
);


-- =========================================================
-- 6. INSERT policy
-- Keep signup compatibility.
-- Users may only insert their own PENDING USER record.
-- They cannot create themselves as ADMIN.
-- =========================================================

DROP POLICY IF EXISTS "monitoring_users_insert_own"
ON public.monitoring_users;

CREATE POLICY "monitoring_users_insert_own"
ON public.monitoring_users
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'USER'
  AND status = 'PENDING'
);