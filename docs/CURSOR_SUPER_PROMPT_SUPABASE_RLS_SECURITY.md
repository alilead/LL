# Cursor Super Prompt: Supabase RLS + Sensitive Data (Advisor: `rls_disabled_in_public`, `sensitive_columns_exposed`)

## Applied in this repo (Strategy A)

- **SQL (run on Supabase):** `backend/migrations/manual/007_enable_rls_public_tables_supabase_advisor.sql` — enables RLS on all `public` base tables in a loop (idempotent).
- **Docs:** `docs/SUPABASE_RENDER_LOCAL_SETUP.md` — section *Supabase security: Advisors* + checklist + reference files.
- **Frontend:** `frontend/src/lib/supabaseClient.ts` — already uses **anon** + URL only (no `service_role`).

Re-run **Advisors** after applying the SQL. If you add browser-facing Supabase reads, add explicit `CREATE POLICY` rules for those tables.

---

Use this prompt in Cursor when Supabase emails or **Database → Advisors** report critical issues like:

- **Table publicly accessible** — `rls_disabled_in_public`
- **Sensitive data publicly accessible** — `sensitive_columns_exposed`

**Project example:** The Leadlab (`mwqhusuerknntemdbavl` or your current ref).

```
You are working in the LeadLab repository and the Supabase project used as PostgreSQL host.

## Context (do not confuse with role toggles)

- The **postgres** database user may show "User bypasses every row level security policy: ON" in Supabase Dashboard. That is normal for direct SQL / migrations; it does **not** fix the Advisor issue.
- **PostgREST** (Supabase Data API) uses **anon** and **authenticated** roles by default. Those roles **do not** bypass RLS unless you grant a bypass (avoid that).
- The **service_role** key bypasses RLS in the **JS client** — it must **never** ship in the browser or public repos.
- The Advisor flags **tables in `public`** that are exposed via the API without **Row Level Security** enabled, and tables that look like they hold **passwords / PII / tokens** with no protection.

## Objective

1) Clear **rls_disabled_in_public**: every `public` table that PostgREST exposes must have **RLS enabled** and **explicit policies** (or be locked down so anon cannot read/write).
2) Clear **sensitive_columns_exposed**: tables/columns with sensitive data must not be world-readable through the Data API; use RLS, column-safe views, or move data out of public API surface.

## Discovery (Supabase Dashboard)

1) Open the project → **Advisors** (or **Database → Security** / **Lint** depending on UI).
2) For each reported table, note: name, recommended action, and whether the app needs **browser** access via Supabase JS or only **server** (FastAPI) access.

## Strategy A — App uses only FastAPI + `DATABASE_URL` (no Supabase client for those tables)

- Enable RLS on every affected table: `ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY;`
- Add **no** policies for `anon` (or a single deny-all) so the **REST API** cannot read/write from the browser.
- Keep using the backend with the **postgres** connection string (or a dedicated non-bypass role you control). Your server queries still work if the DB role used by the server **bypasses RLS** (e.g. postgres) — verify in your connection string / pooler settings.
- Alternatively: use a **non-bypass** DB user for the app and grant only needed table privileges + RLS policies that match your API logic (stronger long-term).

## Strategy B — Supabase Auth + client reads user-owned rows

- Enable RLS on the table.
- Add policies, e.g. `USING (auth.uid() = user_id)` for `SELECT`/`INSERT`/`UPDATE`/`DELETE` as appropriate.
- Never expose `password`, `hashed_password`, or raw tokens to `anon` / broad `SELECT`.

## Sensitive columns

- Prefer: **no** direct PostgREST exposure of password hashes, API keys, or full PII; serve via FastAPI with auth.
- If a column must exist: **RLS** that excludes anonymous access; or expose a **view** with only non-sensitive fields.
- Re-run **Advisors** until both issues are resolved.

## Repository files to align (LeadLab)

- `docs/SUPABASE_RENDER_LOCAL_SETUP.md` — connection and migration notes.
- `frontend/src/lib/supabaseClient.ts` — ensure only **anon** + **url** in frontend; **never** `service_role`.
- If you add SQL migrations: `backend/migrations/manual/` or your chosen migration path; document the exact `ALTER TABLE` / `CREATE POLICY` / `REVOKE` steps.

## SQL patterns (adjust names)

-- Enable RLS
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- Example: block anonymous access entirely (add per-role policies as needed)
-- REVOKE ALL ON public.your_table FROM anon;
-- (Supabase: prefer RLS policies over blind REVOKE if the UI manages grants)

-- Example policy: authenticated users see only their rows
-- CREATE POLICY "users_own_rows" ON public.your_table
--   FOR ALL TO authenticated
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

## Verification

1) In Supabase **Advisors**: both critical issues show as resolved.
2) With **anon key** only, run a REST `GET` against a previously exposed sensitive table: expect **empty** or **401/403**, not full rows.
3) Confirm **FastAPI** (Render) still works: smoke-test login, dashboard, and one CRUD path.
4) Confirm `service_role` and DB passwords are not in Vite env or client bundles.

## Git

- One focused commit (SQL migration + short doc update).
- Push to main.
- List changed files and how you verified Advisors + API behavior.
```

## One-line copy-paste for Chat

"Fix Supabase Advisor `rls_disabled_in_public` and `sensitive_columns_exposed` for The Leadlab: enable RLS on all affected `public` tables, add least-privilege policies (or no anon access if only FastAPI uses the DB), never expose `service_role` in the frontend, and document SQL in `backend/migrations/manual/`. Re-run Advisors and verify anon cannot read sensitive tables."
