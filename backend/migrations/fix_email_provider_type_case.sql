-- Fix the case of provider_type enum values
ALTER TABLE email_accounts MODIFY COLUMN provider_type ENUM('gmail', 'outlook', 'yahoo', 'custom') NOT NULL;

-- Fix the case of sync_status enum values
ALTER TABLE email_accounts MODIFY COLUMN sync_status ENUM('active', 'error', 'disabled', 'syncing') DEFAULT 'active'; 