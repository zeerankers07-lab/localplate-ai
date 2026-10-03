-- LocalPlate AI security hardening
-- Run this migration in Supabase SQL Editor before production deployment.

-- =========================================================
-- 1. RLS: private user data must remain private
-- =========================================================

ALTER TABLE IF EXISTS public.saved_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- Remove every existing policy on these two private tables, then recreate
-- explicit owner-only policies. This avoids accidentally leaving a permissive
-- legacy policy that could weaken isolation.
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'saved_plans'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.saved_plans', policy_record.policyname);
  END LOOP;

  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'shopping_lists'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.shopping_lists', policy_record.policyname);
  END LOOP;
END $$;

CREATE POLICY "saved_plans_select_own"
ON public.saved_plans
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "saved_plans_insert_own"
ON public.saved_plans
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_plans_update_own"
ON public.saved_plans
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_plans_delete_own"
ON public.saved_plans
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "shopping_lists_select_own"
ON public.shopping_lists
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "shopping_lists_insert_own"
ON public.shopping_lists
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shopping_lists_update_own"
ON public.shopping_lists
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shopping_lists_delete_own"
ON public.shopping_lists
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- =========================================================
-- 2. Shared, database-backed AI rate limiter
-- =========================================================

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (user_id, bucket)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.api_rate_limits FROM anon, authenticated;

-- No client-side SELECT/INSERT/UPDATE/DELETE policies are intentionally added.
-- The SECURITY DEFINER function below is the only application path.

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS TABLE(allowed boolean, remaining integer, retry_after integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_row public.api_rate_limits%ROWTYPE;
  v_retry integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0, GREATEST(p_window_seconds, 1);
    RETURN;
  END IF;

  IF p_bucket IS NULL OR length(trim(p_bucket)) = 0 OR length(p_bucket) > 64
     OR p_limit < 1 OR p_window_seconds < 1 THEN
    RETURN QUERY SELECT false, 0, 60;
    RETURN;
  END IF;

  -- Serialize updates for the same user/bucket to avoid concurrent insert races.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_bucket, 0));

  SELECT * INTO v_row
  FROM public.api_rate_limits
  WHERE user_id = v_user_id AND bucket = p_bucket
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.api_rate_limits(user_id, bucket, window_started_at, request_count)
    VALUES (v_user_id, p_bucket, v_now, 1);

    RETURN QUERY SELECT true, p_limit - 1, p_window_seconds;
    RETURN;
  END IF;

  IF v_now >= v_row.window_started_at + make_interval(secs => p_window_seconds) THEN
    UPDATE public.api_rate_limits
    SET window_started_at = v_now, request_count = 1
    WHERE user_id = v_user_id AND bucket = p_bucket;

    RETURN QUERY SELECT true, p_limit - 1, p_window_seconds;
    RETURN;
  END IF;

  IF v_row.request_count >= p_limit THEN
    v_retry := GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM ((v_row.window_started_at + make_interval(secs => p_window_seconds)) - v_now)))::integer
    );
    RETURN QUERY SELECT false, 0, v_retry;
    RETURN;
  END IF;

  UPDATE public.api_rate_limits
  SET request_count = request_count + 1
  WHERE user_id = v_user_id AND bucket = p_bucket;

  RETURN QUERY SELECT true, p_limit - v_row.request_count - 1, p_window_seconds;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO authenticated;

-- Remove stale counters periodically. Safe to run manually or from a scheduled job.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH deleted AS (
    DELETE FROM public.api_rate_limits
    WHERE window_started_at < now() - interval '24 hours'
    RETURNING 1
  )
  SELECT count(*)::integer FROM deleted;
$$;

REVOKE ALL ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC;

-- =========================================================
-- 3. Useful indexes for owner-scoped queries
-- =========================================================

CREATE INDEX IF NOT EXISTS saved_plans_user_id_created_at_idx
ON public.saved_plans (user_id, created_at DESC);

