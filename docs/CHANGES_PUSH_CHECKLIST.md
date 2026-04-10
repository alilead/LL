# LeadLab release — verification and QA

## Git status

After your latest pull, confirm `main` includes the commits for this work (Supabase docs, UX fixes, `dayjs` / `@mui/system` build fixes, territories under Settings, `Prompt.txt` in repo).

**Untracked:** nothing expected except local env files.

---

## Build verification (local)

| Step | Command | Expected |
|------|---------|----------|
| Install | `cd frontend && npm ci` or `npm install` | Completes without errors |
| Build | `npm run build` | Vite build succeeds (fixes: `@mui/system`, `dayjs` for `react-big-calendar`) |

---

## Acceptance checklist (from product spec)

Use **Pass** / **Fail** / **N/A** when you test in staging or production. Screenshot references are placeholders—attach your own file names where noted.

| # | Requirement | Status | Notes / screenshot ref |
|---|-------------|--------|-------------------------|
| A1 | No 404 on **Email → Sequences → Create sequence** | | Routes: `/email-sequences/create`, `/email-sequences/:id` |
| A2 | **SMTP**: account connect, inbox fetch, send | | *Requires backend + credentials; UI links to Integrations.* |
| A3 | **Messages** file upload succeeds and message appears | | API: `POST /messages/send-attachment`; refresh list after send |
| A4 | **Calendar** create/edit modal not cropped | | Scrollable dialog |
| A5 | **Sales → Quotes → Create New** is a usable editor | | `ModernQuoteNewPage` + CPQ products |
| A6 | **Workflow** canvas: drag, link, delete nodes | | Delete on node; edges drawn |
| A7 | **Forecast** delete where required | | Draft delete API + dashboard button |
| A8 | **Conversations** upload appears after completion | | `createRecording` + invalidate `call-recordings` |
| A9 | **Leads export** CSV correct (no JSON error blob) | | `GET /leads/export/csv`; client rejects JSON error bodies |
| A10 | **Organization / Settings / Territories** coherent IA | | Territories: `/settings/territories`; legacy `/territories` redirects |
| A11 | **Notifications** page + settings section functional | | `/notifications`; settings tab |
| A12 | Fake competitors replaced with **Newton meter, DLP, UN, David Schneider** | | `conversations` analysis text |
| A13 | **Supabase migration** doc matches Vercel + Render + rollback | | `docs/SUPABASE_RENDER_LOCAL_SETUP.md` |

---

## Files by feature (reference)

| Area | Files |
|------|--------|
| Supabase | `docs/SUPABASE_RENDER_LOCAL_SETUP.md`, `frontend/src/lib/supabaseClient.ts` |
| Routes | `frontend/src/router.tsx` (sequences, notifications, org redirect, territories) |
| Territories IA | `ModernSidebar.tsx`, `CommandPalette.tsx`, `ModernSettings.tsx` (Organization card) |
| Email | `EmailSequences/SequenceBuilder.tsx`, `Emails/index.tsx`, `services/emailAPI.ts` |
| Notifications | `ModernNotifications.tsx`, `ModernSettings.tsx` |
| Quotes / calendar / workflows | `ModernQuotePages.tsx`, `Calendar/index.tsx`, `Workflows/WorkflowBuilder.tsx` |
| Forecasts | `backend/.../forecasting.py`, `ForecastDashboard.tsx`, `services/api/forecasts.ts` |
| Conversations | `conversations.py`, `ModernConversationUpload.tsx`, `ConversationIntelligence/CallRecordings.tsx` |
| Leads export | `backend/.../leads.py` (`export/csv`), `services/api/leads.ts` (`exportCSV`) |
| Build | `frontend/package.json` (`@mui/system`, `dayjs`, `@supabase/supabase-js`) |

---

## Remaining risks

1. **SMTP end-to-end** depends on Render env, DNS, and app passwords; exercise with a real mailbox in staging.
2. **Avatar / asset 404s** may still occur if `VITE_API_URL` or CDN paths differ—watch network tab.
3. **Large CSV exports** use streaming on the server; very large orgs may need longer timeouts.

---

## Spec source

See repository root **`Prompt.txt`** for the full fix list and mandatory output format.
