-- Align PostgreSQL emailstatus enum values with backend canonical values.
-- Uses enum-type swap (instead of ADD VALUE + UPDATE) to avoid:
-- "unsafe use of new value ... New enum values must be committed before use."

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'emailstatus_new') THEN
        CREATE TYPE emailstatus_new AS ENUM ('unread', 'read', 'replied', 'forwarded', 'archived');
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'emails' AND column_name = 'status'
    ) THEN
        ALTER TABLE emails ALTER COLUMN status DROP DEFAULT;

        ALTER TABLE emails
        ALTER COLUMN status TYPE emailstatus_new
        USING (
            CASE lower(status::text)
                WHEN 'unread' THEN 'unread'
                WHEN 'read' THEN 'read'
                WHEN 'replied' THEN 'replied'
                WHEN 'forwarded' THEN 'forwarded'
                WHEN 'archived' THEN 'archived'
                WHEN 'new' THEN 'unread'
                WHEN 'opened' THEN 'read'
                WHEN 'sent' THEN 'read'
                ELSE 'unread'
            END
        )::emailstatus_new;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'email_logs' AND column_name = 'status'
    ) THEN
        ALTER TABLE email_logs ALTER COLUMN status DROP DEFAULT;

        ALTER TABLE email_logs
        ALTER COLUMN status TYPE emailstatus_new
        USING (
            CASE lower(status::text)
                WHEN 'unread' THEN 'unread'
                WHEN 'read' THEN 'read'
                WHEN 'replied' THEN 'replied'
                WHEN 'forwarded' THEN 'forwarded'
                WHEN 'archived' THEN 'archived'
                WHEN 'new' THEN 'unread'
                WHEN 'opened' THEN 'read'
                WHEN 'sent' THEN 'read'
                ELSE 'read'
            END
        )::emailstatus_new;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'emailstatus') THEN
        ALTER TYPE emailstatus RENAME TO emailstatus_old;
    END IF;
    ALTER TYPE emailstatus_new RENAME TO emailstatus;
END $$;

DROP TYPE IF EXISTS emailstatus_old;

ALTER TABLE IF EXISTS emails ALTER COLUMN status SET DEFAULT 'unread'::emailstatus;
ALTER TABLE IF EXISTS email_logs ALTER COLUMN status SET DEFAULT 'read'::emailstatus;
