# LeadLab changes — push status and verification checklist

**Remote sync:** `main` matches `origin/main` at commit `0f74895` (*feat: Supabase docs, routes, quotes/calendar/email UX, forecast delete*). Everything in that commit is **pushed**.

**Not in git:** `Prompt.txt` (untracked on purpose). Add and commit separately if you want it in the repo.

---

Use this list to verify behavior in staging or production. Check each row when you have confirmed it.

## 1. Database and Supabase

| Done | Item | What changed |
|------|------|----------------|
| [ ] | **1.1** Migration guide | `docs/SUPABASE_RENDER_LOCAL_SETUP.md` — Render/Vercel topology, Supabase migration, rollback, troubleshooting. |
| [ ] | **1.2** Frontend Supabase client | `frontend/src/lib/supabaseClient.ts` — optional client from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. |
| [ ] | **1.3** Env hints | `frontend/.env.development` — comments for Vite-prefixed Supabase vars. |
| [ ] | **1.4** Dependency | `frontend/package.json` (+ lockfile) — `@supabase/supabase-js`. |

## 2. Routing and navigation (IA)

| Done | Item | What changed |
|------|------|----------------|
| [ ] | **2.1** Router | `frontend/src/router.tsx` — `/email-sequences/create`, `/email-sequences/:id`, `/notifications`; organization path aligned with settings. |
| [ ] | **2.2** Sidebar | `frontend/src/components/ModernSidebar.tsx` — organization → settings area; notifications entry. |
| [ ] | **2.3** Legacy sidebar label | `frontend/src/components/app-sidebar.tsx` — org display name set to **Newton meter**. |

## 3. Email

| Done | Item | What changed |
|------|------|----------------|
| [ ] | **3.1** Sequences UI | `frontend/src/pages/EmailSequences/SequenceBuilder.tsx` + `index.tsx` — create/edit sequence steps (no more missing route for “Create sequence”). |
| [ ] | **3.2** Inbox and settings link | `frontend/src/pages/Emails/index.tsx` — “Go to settings” style flow points to `/settings/integrations`; mutation args aligned with API. |
| [ ] | **3.3** Email API mapping | `frontend/src/services/emailAPI.ts` — folder → backend `direction` / `unread_only`; star/delete stubbed to avoid crashes if endpoints missing. |

## 4. Notifications

| Done | Item | What changed |
|------|------|----------------|
| [ ] | **4.1** Notifications page | `frontend/src/pages/ModernNotifications.tsx` — list, test create, mark all read. |
| [ ] | **4.2** Settings tab | `frontend/src/pages/ModernSettings.tsx` — notification section wired to real API instead of placeholder-only. |

## 5. Quotes, calendar, workflows

| Done | Item | What changed |
|------|------|----------------|
| [ ] | **5.1** New quote flow | `frontend/src/pages/ModernQuotePages.tsx` — create quote form (products via CPQ, submit via `cpqAPI.createQuote`). |
| [ ] | **5.2** Calendar modals | `frontend/src/pages/Calendar/index.tsx` — dialog sizing/scroll so create/edit events are not cropped. |
| [ ] | **5.3** Workflow canvas | `frontend/src/pages/Workflows/WorkflowBuilder.tsx` — node drag and simple edge/connection drawing. |

## 6. Forecasts and conversations

| Done | Item | What changed |
|------|------|----------------|
| [ ] | **6.1** Delete forecast (API) | `backend/app/api/v1/endpoints/forecasting.py` — `DELETE /forecasts/{forecast_id}` for drafts (owner). |
| [ ] | **6.2** Delete forecast (UI) | `frontend/src/services/api/forecasts.ts` + `frontend/src/pages/Forecasting/ForecastDashboard.tsx` — “Delete draft” action. |
| [ ] | **6.3** Conversation analysis labels | `backend/app/api/v1/endpoints/conversations.py` — competitor/client placeholders replaced with **Newton meter**, **DLP**, **UN**, **David Schneider**. |
| [ ] | **6.4** Conversation upload | `frontend/src/pages/ModernConversationUpload.tsx` — lead selector + recording create mutation (metadata persistence). |

---

## Quick reference

| Area | Primary files |
|------|----------------|
| Supabase | `docs/SUPABASE_RENDER_LOCAL_SETUP.md`, `frontend/src/lib/supabaseClient.ts` |
| Routes | `frontend/src/router.tsx` |
| Email sequences | `frontend/src/pages/EmailSequences/SequenceBuilder.tsx` |
| Emails | `frontend/src/pages/Emails/index.tsx`, `frontend/src/services/emailAPI.ts` |
| Notifications | `ModernNotifications.tsx`, `ModernSettings.tsx` |
| Quotes / calendar / workflows | `ModernQuotePages.tsx`, `Calendar/index.tsx`, `Workflows/WorkflowBuilder.tsx` |
| Forecasts | `forecasting.py`, `ForecastDashboard.tsx`, `services/api/forecasts.ts` |
| Conversations | `conversations.py`, `ModernConversationUpload.tsx` |

---

## Known follow-ups (not in this commit)

- Frontend production build may still fail on a pre-existing **MUI / `@mui/system`** resolution issue — run `npm run build` after fixing deps.
- Full **SMTP** sync/send and **message file uploads** may need more backend work beyond what this release wired in the UI.
