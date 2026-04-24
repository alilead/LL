# Cursor Super Prompt (LeadLab Repo)

Use this prompt in Cursor to execute and verify all requested fixes across backend + frontend.

```
You are working in the LeadLab monorepo (FastAPI backend + React/TypeScript frontend).

Mission:
1) Email/Admin access:
   - Ensure the Email tab is visible in app navigation.
   - Ensure ali@the-leadlab.com has full admin access (role=admin, is_superuser=true, is_active=true).
   - Disable or clean all other user accounts.
2) Landing page:
   - Make hero section structured and clean (no duplicated CTA blocks).
   - Keep typography/style consistent across hero and key CTA areas.
   - Add two clear CTA paths:
     a) Book a meeting.
     b) Go to forms/signup (pitch idea, data request, business diagnostic, signup).
3) Form-to-admin delivery:
   - Ensure intake submissions are persisted and sent to ali@the-leadlab.com with full details.

Repo constraints:
- Frontend:
  - `frontend/src/config/featureFlags.ts`
  - `frontend/src/pages/HomePage.tsx`
  - `frontend/src/pages/IntakeSelectPage.tsx`
  - `frontend/src/services/marketingFormsApi.ts`
- Backend:
  - `backend/app/api/v1/endpoints/marketing_forms.py`
  - `backend/migrations/manual/006_keep_only_ali_admin_access.sql`

Implementation expectations:
- Keep existing architecture; do not introduce large refactors.
- Make minimal, production-safe changes.
- Use graceful failure for notification email (submission save must still succeed if email provider fails).
- Keep copy professional and concise.

Verification checklist:
1) `npm run lint` in `frontend/` (or equivalent project lint command).
2) Confirm Email nav item appears (`showEmail=true`).
3) Confirm hero shows exactly two primary CTA actions.
4) Confirm intake submit posts to backend and defaults `to_email` to `ali@the-leadlab.com`.
5) Confirm backend endpoint saves record and attempts admin email notification.
6) Confirm manual migration SQL exists and is documented as manual-run.

Git output:
- Create a single commit with a clear message.
- Push to `origin/main`.
- Return a concise changelog with file paths touched and verification outcomes.
```

