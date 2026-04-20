-- Run once on PostgreSQL (e.g. Render) after deploying code that uses Message.attachment_blob.
-- Stores chat attachment bytes in the database so files survive ephemeral server disks.

ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_blob BYTEA;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_content_type VARCHAR(255);
