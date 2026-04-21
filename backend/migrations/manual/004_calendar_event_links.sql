-- Bidirectional calendar sync mapping table
CREATE TABLE IF NOT EXISTS calendar_event_links (
    id SERIAL PRIMARY KEY,
    integration_id INTEGER NOT NULL REFERENCES calendar_integrations(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    external_event_id VARCHAR(255) NOT NULL,
    external_calendar_id VARCHAR(255) NULL DEFAULT 'primary',
    external_etag VARCHAR(255) NULL,
    last_external_updated_at TIMESTAMP NULL,
    last_internal_updated_at TIMESTAMP NULL,
    last_synced_at TIMESTAMP NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_calendar_event_links_integration_external
    ON calendar_event_links (integration_id, external_event_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_calendar_event_links_integration_event
    ON calendar_event_links (integration_id, event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_links_org
    ON calendar_event_links (organization_id);
