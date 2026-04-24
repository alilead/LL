# Cursor Super Prompt: Gmail-like Reply UX (LeadLab Repo)

Use this prompt in Cursor to audit the current email detail/reply experience and implement Gmail-like behavior.

```
You are working in the LeadLab monorepo (React/TypeScript frontend, FastAPI backend).

Goal:
Make email interaction (Reply / Reply All / Forward) feel smooth and close to Gmail.

Primary UX requirements:
1) Clicking Reply / Reply All / Forward must open compose in a clear foreground context (not hidden behind dialogs, not opening "below").
2) Action bar should be at top of email detail, easy to reach.
3) Prefill must be correct:
   - Reply: to sender only, subject "Re: ..."
   - Reply All: sender + visible recipients (deduped), excluding current user when possible
   - Forward: empty To, subject "Fwd: ...", include quoted original body metadata
4) Compose should reset/prefill reliably each open (no stale fields from previous draft).
5) After sending, refresh email list and close compose smoothly.

Analyze current implementation:
- `frontend/src/pages/Emails/index.tsx`
- `frontend/src/pages/Emails/EmailDetailModal.tsx`
- `frontend/src/pages/Emails/EmailComposeModal.tsx`
- `frontend/src/services/emailAPI.ts`

Expected implementation direction:
- Lift compose state to page-level so detail modal triggers compose through parent state.
- Remove nested compose modal rendering inside detail modal.
- Pass explicit reply action context from detail -> page -> compose modal.
- Add prop-driven prefill sync in compose modal using `useEffect`.
- Keep existing backend endpoints unchanged unless broken.

Quality checks:
1) No linter errors in touched files.
2) Reply/Reply All/Forward buttons all functional.
3) No duplicate "Re: Re:" or stale recipient leakage.
4) Mark unread / Archive / Delete still work from detail modal.

Git output:
- One focused commit with a clear message and brief why.
```

