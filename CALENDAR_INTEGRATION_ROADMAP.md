# Calendar Integration Roadmap (Google + Multi-provider)

This roadmap captures the implementation plan and current progress for calendar integrations.

## Current status

- [x] Foundation API and data model scaffolding
- [x] Google OAuth init endpoint (`/api/v1/calendar-integrations/oauth/init`)
- [x] Integration management endpoints (`list`, `disconnect`, `sync`)
- [x] Settings UI section for Calendar integrations
- [ ] Google OAuth callback token exchange
- [ ] Bidirectional sync engine with conflict resolution
- [ ] Webhook/channel subscription and refresh
- [ ] Outlook / Apple / CalDAV adapters

## Phase 1: Foundation (completed in this iteration)

### Backend

- Added `calendar_integrations` table model:
  - provider, account identity, token fields, sync flags/status
- Added endpoints:
  - `GET /api/v1/calendar-integrations`
  - `POST /api/v1/calendar-integrations/oauth/init`
  - `POST /api/v1/calendar-integrations/{id}/disconnect`
  - `POST /api/v1/calendar-integrations/{id}/sync`
- Added config entries:
  - `GOOGLE_CALENDAR_CLIENT_ID`
  - `GOOGLE_CALENDAR_CLIENT_SECRET`
  - `GOOGLE_CALENDAR_REDIRECT_URI`
  - `GOOGLE_CALENDAR_SCOPES`

### Frontend

- Added `calendarIntegrationsAPI` service.
- Added Integrations > Calendar UI for:
  - Connect Google Calendar
  - Sync now
  - Disconnect
  - Other calendar providers marked as next wave.

## Phase 2: Google OAuth callback + account creation

1. Add callback endpoint:
   - `GET /api/v1/calendar-integrations/oauth/callback/google?code=...&state=...`
2. Exchange code for tokens with Google token endpoint.
3. Upsert `calendar_integrations` row with refresh/access token and scopes.
4. Redirect back to settings with success/failure banner.

## Phase 3: Sync engine

1. Add provider abstraction:
   - `list_events`, `create_event`, `update_event`, `delete_event`, `watch`.
2. Add event mapping table (`calendar_event_links`).
3. Implement pull sync and push sync logic.
4. Add retries/backoff and sync audit logs.

## Phase 4: Realtime + resiliency

1. Google watch channels for near-realtime updates.
2. Channel renewal before expiration.
3. Fallback periodic sync if webhook delivery fails.

## Phase 5: Other providers

1. Outlook via Microsoft Graph.
2. Apple/CalDAV generic adapter.
3. Unified UX controls for all providers.

## Supabase migration steps

Run this SQL after deploying backend code:

```sql
\i backend/migrations/manual/002_calendar_integrations.sql
```

If your SQL runner does not support `\i`, copy-paste the file contents manually.
