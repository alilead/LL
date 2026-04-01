# LeadLab CRM — TODO list (Phase 2 & follow-ons)

Work through this list **with your team** in order. Check items off as you finish. Phase 2 focuses on **backend truth + API contracts** so the UI can show real CRM data after login.

---

## How to use

- [x] **Phase 2A — Backend** — real aggregates, remove placeholders, document `curl` tests.
- [x] **Phase 2B — API contract alignment** — `/leads/stats` + `/dashboard/stats` match what `ModernDashboard` (and reports) need.
- [ ] **Phase 2C — HTTP client consistency** — one dev/prod story for all features (Messages vs main app).
- [ ] **Later phases** — frontend KPI/chart cleanup, other tabs, QA.

---

## Phase 2A — Backend (`dashboard.py` + related)

| # | Task | Done |
|---|------|------|
| 1 | Populate **7-day (or 30-day) lead activity** for `leads.trend` (daily counts per org) instead of empty `lead_trend`. | [x] |
| 2 | Remove or replace **`user.tokens: 1000`** — use real credits/tokens from `/credits` or `users` model if available; otherwise omit field. | [x] |
| 3 | Remove unused **`import random`** from `dashboard.py`. | [x] |
| 4 | Confirm **conversion rate** definition (product): e.g. leads→won deals vs deals won/total deals — document in code comment. | [x] |
| 5 | Ensure **deal pipeline value** and **active deal counts** use the same `Deal` filters and org rules as the Deals page. | [x] |
| 6 | (Optional) Add **week-over-week** or **month-over-month deltas** for pipeline/conversion if product wants trend badges without frontend fakes. | [x] |
| 7 | **Manual test:** `curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/dashboard/stats` — verify JSON matches expectations. | [ ] |

**Files:** `backend/app/api/v1/endpoints/dashboard.py` (primary), possibly `deals.py` / models for consistency.

---

## Phase 2B — `/leads/stats` contract

| # | Task | Done |
|---|------|------|
| 1 | Align **`LeadStatsResponse`** with frontend `LeadStats` or change frontend to match backend. | [x] |
| 2 | Either **return** `new`, `contacted`, `converted` from DB/stage logic **or** change `ModernDashboard` pie to use **stage-based** counts from existing `lead_stages`. | [x] |
| 3 | Fix **`ModernDashboard`** to use **`leadStatsData`** (not `leadStatsData?.data`) if `getLeadStats` returns a flat body. | [x] |
| 4 | Confirm **admin** org filter for leads on stats matches product (see `dashboard.py` `org_filter`). | [x] |

**Files:** `backend/app/api/v1/endpoints/leads.py`, `frontend/src/pages/ModernDashboard.tsx`, `frontend/src/services/api/leads.ts`.

---

## Phase 2C — Axios / environment consistency

| # | Task | Done |
|---|------|------|
| 1 | Unify **`frontend/src/api/api.ts`** with `services/axios` / `lib/axios` (dev proxy + prod `VITE_API_URL`) so **Messages** and main app hit the same backend in dev. | [ ] |
| 2 | Smoke-test **Messages** send/receive after change. | [ ] |

---

## Phase 3 (preview) — Frontend dashboard honesty

_Defer until Phase 2 is done._

| # | Task | Done |
|---|------|------|
| 1 | Remove hardcoded **`15%`**, **`3.2%`**; show API delta or **“—”**. | [ ] |
| 2 | Remove **`new_leads * 1000`** simulation; chart = real leads/day or rename label. | [ ] |
| 3 | Wire **Recent Activities** to `dashboardStats.activities` (or dedicated endpoint). | [ ] |

---

## Phase 4 (preview) — Other tabs

| # | Task | Done |
|---|------|------|
| 1 | **AI Insights:** fix path to `GET /api/v1/ai-insights/analytics` (or correct routes from `ai_insights.py`). | [ ] |
| 2 | Audit **Reports** (`advancedReports`) empty states vs backend errors. | [ ] |
| 3 | Remove or route **`ModernEmailCampaigns`** mock data if still linked. | [ ] |
| 4 | **Settings** tabs: replace placeholder copy with real API or hide until ready. | [ ] |

---

## Phase 5 (preview) — QA checklist

| # | Task | Done |
|---|------|------|
| 1 | User with **no leads** — dashboard shows zeros, no fake trends. | [ ] |
| 2 | After **import** — leads and charts update. | [ ] |
| 3 | Non-admin **org isolation** on stats and lists. | [ ] |

---

## Parking lot (ideas)

- [ ] Deprecate unused `Dashboard.tsx` / `Dashboard/index.tsx` or document why they remain.
- [ ] Single definition of “pipeline value” in shared types (`packages/types` or `types/`).
- [ ] Add automated API tests for `/dashboard/stats` when CI allows.

---

## Proceed together

**Next step:** Complete **Phase 2A** items 1–3 in code, then re-run the manual `curl` check. Say when you want to **start Phase 2B** (leads stats shape + frontend fix) in Agent mode.
