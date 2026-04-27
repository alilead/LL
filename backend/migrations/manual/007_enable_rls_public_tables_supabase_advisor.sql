-- 007_enable_rls_public_tables_supabase_advisor.sql
--
-- Supabase Advisor: rls_disabled_in_public, sensitive_columns_exposed
-- Strategy A (LeadLab): FastAPI uses DATABASE_URL (typically role `postgres`, bypasses RLS).
-- PostgREST (anon / authenticated) must not read/write app data without policies.
-- Enabling RLS with no policies = deny for those roles by default.
--
-- Run in Supabase: SQL Editor → paste → Run. Safe to re-run (idempotent).
-- Backup recommended before first production run.
--
-- Do NOT use the service_role key in the browser. Anon key only in VITE_*, per docs.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      -- Skip Supabase / system-like names in public (adjust if you add custom tables with these prefixes)
      AND c.relname NOT IN ('spatial_ref_sys')
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.table_name);
      RAISE NOTICE 'RLS enabled: public.%', r.table_name;
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skip (insufficient privilege): public.%', r.table_name;
      WHEN OTHERS THEN
        RAISE NOTICE 'Skip public.%: %', r.table_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Optional: if Advisors still flag specific grants, tighten anon for app tables.
-- Prefer fixing via RLS above; only use if your project still exposes data:
-- REVOKE ALL ON public.users FROM anon;
-- (Uncomment and repeat per table only after confirming FastAPI does not use PostgREST for that table.)
