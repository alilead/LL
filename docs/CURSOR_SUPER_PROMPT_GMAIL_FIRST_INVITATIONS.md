# Cursor Super Prompt: Gmail-First Team Invitation Delivery

Use this prompt in Cursor for LeadLab (FastAPI + React) to enforce Gmail/SMTP-first delivery for team invitation emails and avoid false success responses caused by unverified Resend domains.

```
You are working in the LeadLab repository.

Objective:
1) Team invitation emails must use Gmail/SMTP as the primary transport.
2) API should report success only when invitation email is actually delivered.
3) Resend must be optional fallback (or disabled by config), not the default path when SMTP is healthy.

Required behavior:
- EMAIL_PROVIDER default should be `smtp`.
- `auto` mode must attempt SMTP first, then Resend fallback only when SMTP fails.
- If invitation email fails, return a clear non-2xx API error and do not show "sent successfully".
- Keep development-only mock behavior for missing SMTP credentials.

Backend files to inspect:
- backend/app/core/email.py
- backend/app/core/config.py
- backend/app/api/v1/endpoints/team_invitations.py
- backend/.env.example
- backend/tests/test_email_delivery.py

Implementation expectations:
- SMTP sender should prefer authenticated SMTP account as From address.
- Keep existing invitation token and DB creation flow intact.
- Preserve invite admin-only permission checks.
- Add/update tests for:
  - async invitation sender execution
  - delivery failure signaling
  - SMTP-first transport behavior

Verification:
1) Trigger team invite creation.
2) Confirm logs show SMTP path first (Gmail).
3) Confirm API response is non-2xx if delivery fails.
4) Confirm invite API returns success only when delivery succeeds.

Git:
- One focused commit.
- Push to main.
- Return changed file list and concise test evidence.
```

