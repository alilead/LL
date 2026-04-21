-- Gmail OAuth support for inbox sync without app-password IMAP issues
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS auth_type VARCHAR(20) NOT NULL DEFAULT 'password';
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS oauth_access_token TEXT;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS oauth_refresh_token TEXT;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS oauth_token_expires_at TIMESTAMP NULL;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS oauth_scopes TEXT;
