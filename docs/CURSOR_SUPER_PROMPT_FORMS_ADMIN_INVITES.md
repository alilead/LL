# Cursor Super Prompt: Forms -> Admin Email + Team Invite Signup

Use this prompt in Cursor for LeadLab (FastAPI + React) to ensure form submissions notify admins and team invitations are email-driven signup flows.

```
You are working in the LeadLab repository.

Objective:
1) Form submissions (business diagnostic, data request, pitch idea) must email:
   - ali@the-leadlab.com
   - every active admin in the platform
2) Team member invitation flow must require an email input and send an invitation email that guides users to sign up/join the platform.

Constraints:
- Keep existing architecture and endpoints.
- Preserve DB persistence as primary action for forms.
- Email notification failure must not block form submission success response.
- Keep role/permission checks intact (admin-only invite creation).

Backend files to inspect:
- backend/app/api/v1/endpoints/marketing_forms.py
- backend/app/core/email.py
- backend/app/api/v1/endpoints/team_invitations.py
- backend/app/models/user.py

Frontend files to inspect:
- frontend/src/pages/TeamManagement.tsx
- frontend/src/services/teamInvitations.ts
- frontend/src/pages/IntakeFormPage.tsx
- frontend/src/services/marketingFormsApi.ts

Implementation expectations:
- Query active admins/superusers and notify each recipient on form submission.
- Keep optional explicit `to_email` input backward-compatible.
- Invitation email copy/button should clearly indicate signup + team join action.
- Team invite modal should continue exposing required email field.

Verification:
1) Submit each intake form and verify DB row created.
2) Confirm emails are sent to ali + active admins.
3) Create team invitation from Team Management using email field.
4) Confirm invitation email CTA points user to signup/join flow via invitation token.

Git:
- One focused commit.
- Push to main.
- Return changed file list and concise test evidence.
```

