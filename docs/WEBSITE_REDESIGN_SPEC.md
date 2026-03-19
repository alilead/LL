# The Lead Lab — website redesign (implementation tracker)

This doc maps the **Website Redesign and Restructure** brief to what is implemented in the repo.

## Implemented in app

| Area | Route / location | Notes |
|------|------------------|--------|
| **Home** | `/` | Hero updated (“Connecting Businesses with Qualified Leads”). Sections: **Problems we solve**, **Our unique approach**, existing about/features/testimonials/pricing/packages. Nav uses `MarketingNav`. |
| **Business diagnostic** | `/forms/business-diagnostic` | Full form → `POST /api/v1/lead-forms/submit` (`form_type: business_diagnostic`). |
| **Data request** | `/forms/data-request` | Replaces external Typeform link for on-site capture. |
| **Pitch your idea** | `/forms/pitch-your-idea` | Agency-style intake (title, pitch, budget, timeline, links). |
| **About** | `/about` | Story, values cards, “Why choose us” — **add real team bios/photos** when ready. |
| **Services** | `/services` | Accordion of services from the brief (copy can be refined). |
| **Pricing** | `/pricing` | Tier cards + comparison table + enterprise CTA (**replace `$X` placeholders** with real pricing). |
| **FAQ** | `/faq` | Accordion FAQs. |
| **Roadmap** | `/roadmap` | Timeline-style placeholder. |
| **Resources / blog** | `/resources` | Placeholder cards — hook to CMS or markdown later. |
| **Contact** | `/contact` | Existing form; header switched to `MarketingNav`. |
| **Sign up / Sign in** | `/signup`, `/signin` | Unchanged. |

## Backend

- **`POST /api/v1/lead-forms/submit`** — Saves to table **`marketing_form_submissions`** (`app/models/marketing_form_submission.py`). Schema: `MarketingFormSubmissionCreate` in `app/schemas/marketing_forms.py`.
- **`GET /api/v1/admin/marketing-form-submissions`** — Superuser or `role=admin`; lists submissions with optional `form_type` filter.
- **Email:** Not sent on submit yet (add later, e.g. `BackgroundTasks` + `email_sender` when SMTP is ready).
- **Existing DBs:** Run `backend/migrations/create_marketing_form_submissions.sql` on PostgreSQL, or rely on `init_render_db.py` / `create_all` for new environments.

## Frontend

- `frontend/src/components/marketing/MarketingNav.tsx` — global marketing navigation.
- `frontend/src/lib/marketingFormsApi.ts` — calls lead-forms API (`VITE_API_URL`).

## Still manual / content

- [ ] Real **team** section (photos, titles, bios) on `/about`.
- [ ] **Pricing** dollar amounts and feature matrix vs. actual product.
- [ ] **Blog** posts, case studies, gated PDFs on `/resources`.
- [ ] Optional: dedicated **sub-routes** per service if marketing wants long-form pages.
- [ ] **agency-hub** repo was unavailable during implementation; pitch flow is modeled as a standard product-studio intake.

## Reference

Original brief: hero, problems, approach, services, testimonials, CTAs, about, services detail, pricing table, blog, auth pages, roadmap, FAQ, contact.
