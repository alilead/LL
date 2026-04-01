# LeadLab — Full platform analysis

This document maps the **authenticated CRM shell** (post-login): routes, primary UI entry points, backend API prefixes, data wiring quality (real vs partial vs mock), and **cross-cutting concerns** (auth, HTTP clients).

**Scope:** `frontend/src` + `backend/app/api/v1`. Generated from static code review (April 2026).

---

## 1. Architecture snapshot

| Layer | Notes |
|--------|--------|
| **Frontend entry** | `main.tsx` → `App.tsx` → `RouterProvider` + `router` from `frontend/src/router.tsx`. |
| **API base (main client)** | `frontend/src/services/axios.ts` → dev: `baseURL = '/api/v1'` (Vite proxy → `http://127.0.0.1:8000`). Prod: `VITE_API_URL + '/api/v1'`. |
| **Alternate Axios** | `frontend/src/api/api.ts` — uses `VITE_API_URL \|\| 'http://localhost:8000'` + `/api/v1`. Used by **team Messages** (`frontend/src/api/messages.ts`). In dev, if `VITE_API_URL` points at production, this client may **bypass the Vite proxy** and behave differently from `@/services/axios`. |
| **Backend** | `backend/app/api/v1/router.py` mounts feature routers under `/api/v1/...`. |

---

## 2. Navigation vs routes (`ModernSidebar` + `router.tsx`)

Sidebar order (simplified) and matching routes:

| Nav label | Route(s) | Page component | Wraps / implements |
|-----------|----------|----------------|---------------------|
| Dashboard | `/dashboard` | `ModernDashboard` | `ModernDashboard.tsx` |
| Leads | `/leads`, `/leads/:id`, `/leads/form` | `ModernLeads`, detail, form | Kanban + API |
| Deals | `/deals`, `/deals/new` | `ModernDeals`, `ModernNewDeal` | Deals list + create |
| Tasks | `/tasks`, `/tasks/new` | `ModernTasks`, `ModernNewTask` | Task list |
| Email | `/emails`, `/email-sequences` | `ModernEmails` → `EmailsPage` | IMAP-style inbox + sequences |
| Messages | `/messages` | `ModernMessages` → `MessagesPage` | Team chat (`api/messages` + `frontend/src/api/api.ts`) |
| Calendar | `/calendar` | `ModernCalendar` → `CalendarPage` | Events + Calendly/ICS pieces |
| Sales (CPQ) | `/cpq/quotes`, `/cpq/products` | `ModernQuoteList` / `ModernProductList` | CPQ module |
| Workflows | `/workflows`, `/workflows/new`, `/workflows/:id` | `ModernWorkflows` → `WorkflowList` / builder | `/workflows` API |
| Forecasting | `/forecasting` | `ModernForecasting` → `ForecastDashboard` | `/forecasts/*` API via `@/lib/axios` |
| Conversations | `/conversations`, `/conversations/upload` | `ModernConversations` → `CallRecordings` | `/conversations` API |
| Reports | `/reports` | `ModernReports` → `ReportsPage` | `advancedReportsApi` → `/advanced-reports` |
| AI Insights | `/ai-insights` | `ModernAIInsights` | **See §7 — likely wrong path** |
| Organization | `/organization`, `/territories` | `ModernOrganization`, `ModernTerritories` | Org + territories |
| Data | `/data-import/wizard`, `/data-import/history` | `ModernImportWizard` / `ModernImportHistory` | `/data-import` |
| Settings (bottom) | `/settings`, `/settings/:tab` | `ModernSettings` | Profile + tabs (partially static UI) |

**Also routed (not all in main nav):** `/profile`, `/team`, `/credits`, `/customization`, `/admin`, `/linkedin/callback`, marketing pages `/`, `/signin`, etc.

---

## 3. Page-by-page analysis

### 3.1 Dashboard (`/dashboard`)

- **Component:** `frontend/src/pages/ModernDashboard.tsx`.
- **APIs:** `GET /leads/stats` (`leadsAPI.getLeadStats`), `GET /dashboard/stats` (`api.get('/dashboard/stats')`).
- **Status:**
  - **Partial / bug risk:** UI uses `leadStatsData?.data` but `getLeadStats` returns the JSON body directly → nested `.data` may be wrong; defaults may always apply.
  - **Backend `/leads/stats`:** returns `total`, `qualified`, `hot_prospects`, `qualification_rate` — **not** `new`, `contacted`, `converted` expected by `LeadStats` + pipeline pie.
  - **Backend `/dashboard/stats`:** real lead counts; `lead_trend` / pipeline trends are **empty arrays**; `user.tokens` **hardcoded 1000**; unused `import random`.
  - **UI fakes:** hardcoded trend badges `15%`, `3.2%`; chart maps `revenue: item.new_leads * 1000` (**simulated**); “Recent Activities” block is **static empty** in JSX (backend actually builds `activities`).

### 3.2 Leads (`/leads`)

- **Component:** `ModernLeads.tsx` — `GET /leads/`, lead stages API.
- **Status:** Generally **wired** to backend; search placeholders only.
- **Alternate:** `pages/Leads/ModernLeadList.tsx` — older list; may duplicate logic if still linked anywhere.

### 3.3 Deals (`/deals`)

- **Component:** `ModernDeals.tsx` — `GET /deals/`.
- **Status:** **Wired**; pipeline KPIs on dashboard depend on `deals` table existing in DB.

### 3.4 Tasks (`/tasks`)

- **Component:** `ModernTasks.tsx` — `GET /tasks/`.
- **Status:** **Wired**; dashboard task counts depend on `tasks` table existing.

### 3.5 Email (`/emails`, `/email-sequences`)

- **Emails:** `pages/Emails/index.tsx` — `emailAPI` from `services/emailAPI.ts` → `/email/*` (accounts, folders, sync).
- **Sequences:** `ModernEmailSequences` + backend `/email-sequences`.
- **Status:** **Intended real** integration; depends on email backend + DB tables + credentials.

### 3.6 Messages (`/messages`)

- **Component:** `pages/Messages/index.tsx` — `messagesApi` from `frontend/src/api/messages.ts` using **`frontend/src/api/api.ts`** Axios.
- **Status:** **Functional path** to `/messages` API; **verify dev/prod base URL** consistency with main app client (§1).

### 3.7 Calendar (`/calendar`)

- **Component:** `pages/Calendar/index.tsx` (large) — events, Calendly callback, ICS import, etc.
- **Backend:** `/events` + email calendar sync hooks.
- **Status:** Mixed **real API** and **UI defaults** (e.g. +1h end time helpers — not “fake CRM data” but worth QA).

### 3.8 Sales / CPQ (`/cpq/quotes`, `/cpq/products`)

- **Components:** `pages/CPQ/QuoteList.tsx`, `ProductList.tsx`.
- **Backend:** `/cpq`.
- **Status:** **Wired** in principle; validate org scoping and empty states.

### 3.9 Workflows (`/workflows`)

- **Component:** `WorkflowList` / `WorkflowBuilder` under `pages/Workflows/`.
- **Backend:** `/workflows`.
- **Status:** API exists; UI depth not fully audited line-by-line.

### 3.10 Forecasting (`/forecasting`)

- **Component:** `ForecastDashboard.tsx`.
- **API:** `services/api/forecasts.ts` via **`@/lib/axios`** (same proxy pattern as `services/axios`).
- **Status:** **Wired** to `/forecasts/periods`, `/forecasts/...` — treat as real subject to backend data.

### 3.11 Conversations (call intelligence) (`/conversations`)

- **Component:** `CallRecordings.tsx` — `conversationsAPI.getRecordings()`, `getAnalytics()`.
- **Backend:** `/conversations`.
- **Status:** **Wired**; empty states depend on recordings existing.

### 3.12 Reports (`/reports`)

- **Component:** `pages/Reports/index.tsx` — **`advancedReportsApi`** (`frontend/src/api/advancedReports.ts`) → **`/advanced-reports`** KPI dashboard, funnels, etc.
- **Status:** **Heavy real integration** on paper; performance and empty states need QA.

### 3.13 AI Insights (`/ai-insights`)

- **Component:** `ModernAIInsights.tsx` calls `api.get('/ai/insights')`.
- **Backend:** `ai_insights` router exposes e.g. `GET /ai-insights/analytics`, `GET /ai-insights/high-priority`, lead-scoped `/{lead_id}/insights` — **no `/ai/insights`** found in router.
- **Status:** **Likely broken or mismatched** until paths align.

### 3.14 Organization & territories

- **`/organization`:** `OrganizationPage` — org settings.
- **`/territories`:** territories UI + `/territories` API.
- **Status:** Enterprise features — confirm RBAC and org filters.

### 3.15 Data import (`/data-import/wizard`, `/data-import/history`)

- **Components:** `DataImport/ImportWizard`, `ImportHistory`.
- **Backend:** `/data-import`.
- **Status:** **Wired** for CSV/CRM imports; critical path for “user uploaded leads.”

### 3.16 Settings (`/settings`)

- **Component:** `ModernSettings.tsx` — tabs: profile, organization, notifications, security, billing, team, integrations.
- **Status:** Mix of **real** (`updateProfile`, auth store) and **placeholder / static** sections (e.g. billing/integrations may be UI shells — confirm per tab).

### 3.17 Profile (`/profile`)

- **Component:** `ProfilePage` — profile CRUD patterns.
- **Status:** Typically **wired** via users/settings APIs.

### 3.18 Team (`/team`)

- **Component:** `TeamManagement` — invitations / users.
- **Backend:** `/team-invitations`, `/users`.
- **Status:** **Wired** in principle.

### 3.19 Credits (`/credits`)

- **Backend:** `/credits`.
- **Status:** Token/credit features — confirm against `user.tokens` hardcoding on dashboard.

### 3.20 Customization (`/customization`)

- **Status:** Theming/branding — verify persistence API if any.

### 3.21 Admin (`/admin`)

- **Component:** `AdminPanel.tsx` — tabs: Lead Management, Users, Tags, Organizations, Invoice Maker, Information Requests, Marketing forms.
- **Backend:** `/admin` + domain endpoints used by each sub-component.
- **Status:** **Operational** admin tools; separate from normal org user.

---

## 4. Auth & connections

| Concern | Implementation |
|---------|------------------|
| **Login** | `SignIn.tsx` → `useAuthStore().login` → JWT in `localStorage` (`token`). |
| **Protected routes** | `PrivateRoute` wraps authenticated app layout. |
| **API auth** | `Authorization: Bearer <token>` on `services/axios` and `lib/axios`; `api/api.ts` same pattern. |
| **LinkedIn** | `/linkedin/callback`, OAuth routes under `/api/v1/auth/linkedin`. |
| **Integrations** | Email (`/email`), LinkedIn, Calendly (calendar), WebRTC notes under `Messages` — each has its own setup docs in places like `Messages/README.md`. |

---

## 5. Duplicate / legacy surfaces

- **`frontend/src/pages/Dashboard.tsx`**, **`pages/Dashboard/index.tsx`**, **`App.modern.tsx`** — alternate dashboard stacks; **production router uses `ModernDashboard`** only.
- **`ModernEmailCampaigns.tsx`** — contains **`mockCampaigns`** (mock data); confirm if route still exposed.
- **`components/Dashboards/AdvancedDashboard.tsx`** — may duplicate KPI logic vs `ModernDashboard`.

---

## 6. Backend modules (reference)

Routers registered in `backend/app/api/v1/router.py` include: `auth`, `leads`, `leads_import`, `lead_stages`, `tags`, `deals`, `activities`, `notes`, `files`, `credits`, `admin`, `users`, `dashboard`, `tasks`, `events`, `reports`, `advanced_reports`, `linkedin`, `tokens`, `notifications`, `contact`, `health`, `settings`, `psychometrics`, `ai_insights`, `messages`, `invoices`, `team_invitations`, `email`, `ml`, `territories`, `cpq`, `email_sequences`, `workflows`, `conversations`, `forecasting`, `dashboards`, `data_import`, `marketing_forms`.

---

## 7. Known high-impact issues (summary)

1. **Dashboard KPIs:** fake trend %, simulated chart revenue, activities UI not using API feed; lead stats shape mismatch; empty trends from API.
2. **`/leads/stats` vs frontend `LeadStats`:** field mismatch for pipeline distribution.
3. **AI Insights URL:** frontend `/ai/insights` vs backend `/ai-insights/...`.
4. **Dual Axios configs:** Messages (and any consumer of `api/api.ts`) vs main app — inconsistent dev routing.
5. **Dashboard `user.tokens: 1000`:** placeholder in API response.

---

*End of platform analysis. Use `TODO_CRM_PHASE2.md` for the actionable checklist.*
