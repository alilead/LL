-- Calendar integrations foundation (Google first, extensible to Outlook/Apple/CalDAV)
CREATE TABLE IF NOT EXISTS calendar_integrations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_account_email VARCHAR(255),
    external_account_id VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP NULL,
    scopes TEXT,
    sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sync_direction VARCHAR(20) NOT NULL DEFAULT 'two_way',
    last_synced_at TIMESTAMP NULL,
    last_error TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_org_user
    ON calendar_integrations (organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_provider
    ON calendar_integrations (provider);
