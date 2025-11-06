-- ================================================
-- LeadLab Database Migrations - REQUIRED CHANGES
-- ================================================
-- Run these migrations to fix database schema mismatches

USE leadlab; -- Change to your actual database name

-- ================================================
-- MIGRATION 1: Forecast Periods - Add 'name' column
-- ================================================
-- PRIORITY: HIGH
-- REASON: Backend model expects this column, causing 500 errors
-- ERROR: "Unknown column 'forecast_periods.name'"

-- Check if column exists first
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'forecast_periods'
        AND column_name = 'name'
        AND table_schema = DATABASE()
    )
    THEN 'Column forecast_periods.name already exists - SKIP'
    ELSE 'Column forecast_periods.name does NOT exist - NEEDS MIGRATION'
    END as migration_1_status;

-- Add the column if it doesn't exist
-- Uncomment the following line to execute:
-- ALTER TABLE forecast_periods ADD COLUMN name VARCHAR(255) NULL AFTER organization_id;

-- Optional: Update existing records with a default name
-- Uncomment the following lines to execute:
-- UPDATE forecast_periods
-- SET name = CONCAT(
--     CASE period_type
--         WHEN 'weekly' THEN 'Week of '
--         WHEN 'monthly' THEN 'Month of '
--         WHEN 'quarterly' THEN 'Quarter of '
--         WHEN 'annually' THEN 'Year of '
--         ELSE 'Period of '
--     END,
--     DATE_FORMAT(start_date, '%Y-%m-%d')
-- )
-- WHERE name IS NULL;


-- ================================================
-- MIGRATION 2: Events - Add Email Integration Columns (Optional)
-- ================================================
-- PRIORITY: MEDIUM (Optional feature)
-- REASON: Enable email-to-event linking for calendar sync

-- Check if columns exist
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'source_email_id'
        AND table_schema = DATABASE()
    )
    THEN 'Column events.source_email_id already exists'
    ELSE 'Column events.source_email_id does NOT exist'
    END as source_email_id_status,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'email_account_id'
        AND table_schema = DATABASE()
    )
    THEN 'Column events.email_account_id already exists'
    ELSE 'Column events.email_account_id does NOT exist'
    END as email_account_id_status;

-- Add the columns if they don't exist
-- Uncomment the following lines to execute:
-- ALTER TABLE events
--   ADD COLUMN source_email_id INT NULL AFTER deal_id,
--   ADD COLUMN email_account_id INT NULL AFTER source_email_id,
--   ADD CONSTRAINT fk_events_email_account
--     FOREIGN KEY (email_account_id) REFERENCES email_accounts(id) ON DELETE SET NULL;

-- Add index for better query performance
-- Uncomment the following line to execute:
-- CREATE INDEX idx_events_email_account ON events(email_account_id);


-- ================================================
-- MIGRATION 3: User LinkedIn Fields - Verify Length
-- ================================================
-- PRIORITY: LOW (Informational)
-- REASON: Ensure token fields can store full tokens

-- Check current column definitions
SELECT
    column_name,
    column_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = DATABASE()
  AND column_name IN (
      'linkedin_token',
      'linkedin_refresh_token',
      'linkedin_token_expires',
      'linkedin_profile_id',
      'linkedin_profile_url'
  )
ORDER BY ordinal_position;

-- If LinkedIn token columns are too short (less than VARCHAR(500)), expand them:
-- Uncomment the following lines to execute:
-- ALTER TABLE users
--   MODIFY COLUMN linkedin_token VARCHAR(500) NULL,
--   MODIFY COLUMN linkedin_refresh_token VARCHAR(500) NULL;


-- ================================================
-- MIGRATION 4: Lead Fields - Verify New Columns
-- ================================================
-- PRIORITY: LOW (Informational)
-- REASON: Verify AI/ML feature columns exist

SELECT
    column_name,
    column_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
  AND table_schema = DATABASE()
  AND column_name IN ('email_guidelines', 'sales_intelligence')
ORDER BY ordinal_position;

-- If columns don't exist, add them:
-- Uncomment the following lines to execute:
-- ALTER TABLE leads
--   ADD COLUMN email_guidelines TEXT NULL AFTER source,
--   ADD COLUMN sales_intelligence JSON NULL AFTER email_guidelines;


-- ================================================
-- MIGRATION 5: Task - Add completed_at Column
-- ================================================
-- PRIORITY: MEDIUM
-- REASON: Track when tasks were actually completed

SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'completed_at'
        AND table_schema = DATABASE()
    )
    THEN 'Column tasks.completed_at already exists'
    ELSE 'Column tasks.completed_at does NOT exist - NEEDS MIGRATION'
    END as completed_at_status;

-- Add the column if it doesn't exist
-- Uncomment the following line to execute:
-- ALTER TABLE tasks ADD COLUMN completed_at DATETIME NULL AFTER status;

-- Update existing completed tasks with a timestamp
-- Uncomment the following lines to execute:
-- UPDATE tasks
-- SET completed_at = updated_at
-- WHERE status = 'completed' AND completed_at IS NULL;


-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Run this after migrations to verify success
SELECT
    'Verification Results' as info,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forecast_periods' AND column_name = 'name') THEN '✓' ELSE '✗' END as forecast_periods_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'source_email_id') THEN '✓' ELSE '✗' END as events_source_email_id,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'email_account_id') THEN '✓' ELSE '✗' END as events_email_account_id,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completed_at') THEN '✓' ELSE '✗' END as tasks_completed_at,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email_guidelines') THEN '✓' ELSE '✗' END as leads_email_guidelines,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'sales_intelligence') THEN '✓' ELSE '✗' END as leads_sales_intelligence;


-- ================================================
-- ROLLBACK SCRIPTS (In case of issues)
-- ================================================

-- Rollback Migration 1:
-- ALTER TABLE forecast_periods DROP COLUMN name;

-- Rollback Migration 2:
-- ALTER TABLE events DROP FOREIGN KEY fk_events_email_account;
-- ALTER TABLE events DROP COLUMN email_account_id;
-- ALTER TABLE events DROP COLUMN source_email_id;

-- Rollback Migration 5:
-- ALTER TABLE tasks DROP COLUMN completed_at;


-- ================================================
-- NOTES
-- ================================================
-- 1. Always backup your database before running migrations!
-- 2. Test migrations on a development/staging environment first
-- 3. Uncomment the actual ALTER TABLE statements when ready to execute
-- 4. Run migrations during low-traffic periods
-- 5. Monitor application logs after migrations for any errors
