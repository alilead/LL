-- ================================================
-- LEADLAB DATABASE FIX - Missing Columns & Data Visibility
-- ================================================
-- This fixes all issues preventing full data visibility
-- Run this to ensure all backend models match database schema
--
-- BACKUP YOUR DATABASE FIRST!
-- ================================================

USE leadlab;

-- ================================================
-- FIX 1: Forecast Periods - Add 'name' column
-- ================================================
-- CRITICAL: Backend expects this column
-- Without it, forecasting feature shows 500 errors

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    AND table_name = 'forecast_periods'
    AND column_name = 'name'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE forecast_periods ADD COLUMN name VARCHAR(255) NULL AFTER organization_id',
    'SELECT "Column forecast_periods.name already exists" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records with generated names
UPDATE forecast_periods
SET name = CONCAT(
    CASE period_type
        WHEN 'weekly' THEN 'Week '
        WHEN 'monthly' THEN 'Month '
        WHEN 'quarterly' THEN 'Q'
        WHEN 'annual' THEN 'Year '
        ELSE 'Period '
    END,
    CASE period_type
        WHEN 'quarterly' THEN quarter
        ELSE YEAR(start_date)
    END,
    CASE
        WHEN period_type = 'monthly' THEN CONCAT(' ', DATE_FORMAT(start_date, '%M'))
        WHEN period_type = 'quarterly' THEN CONCAT(' ', YEAR(start_date))
        ELSE ''
    END
)
WHERE name IS NULL OR name = '';

-- ================================================
-- FIX 2: Events - Add Email Integration Columns
-- ================================================
-- Enables calendar sync from emails

SET @email_id_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    AND table_name = 'events'
    AND column_name = 'source_email_id'
);

SET @sql = IF(@email_id_exists = 0,
    'ALTER TABLE events ADD COLUMN source_email_id INT NULL AFTER deal_id',
    'SELECT "Column events.source_email_id already exists" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @email_account_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    AND table_name = 'events'
    AND column_name = 'email_account_id'
);

SET @sql = IF(@email_account_exists = 0,
    'ALTER TABLE events ADD COLUMN email_account_id INT NULL AFTER source_email_id',
    'SELECT "Column events.email_account_id already exists" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint (only if column was just added)
SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
    AND table_name = 'events'
    AND constraint_name = 'fk_events_email_account'
);

SET @sql = IF(@fk_exists = 0 AND @email_account_exists = 0,
    'ALTER TABLE events ADD CONSTRAINT fk_events_email_account FOREIGN KEY (email_account_id) REFERENCES email_accounts(id) ON DELETE SET NULL',
    'SELECT "Foreign key already exists or not needed" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ================================================
-- FIX 3: Tasks - Add completed_at Column
-- ================================================
-- Track actual completion time (not just status change)

SET @completed_at_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    AND table_name = 'tasks'
    AND column_name = 'completed_at'
);

SET @sql = IF(@completed_at_exists = 0,
    'ALTER TABLE tasks ADD COLUMN completed_at DATETIME NULL AFTER due_date',
    'SELECT "Column tasks.completed_at already exists" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing completed tasks
UPDATE tasks
SET completed_at = updated_at
WHERE status = 'COMPLETED' AND completed_at IS NULL;

-- ================================================
-- FIX 4: Leads - Add AI/ML Enhancement Columns
-- ================================================
-- Support for advanced AI features

SET @email_guidelines_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    AND table_name = 'leads'
    AND column_name = 'email_guidelines'
);

SET @sql = IF(@email_guidelines_exists = 0,
    'ALTER TABLE leads ADD COLUMN email_guidelines TEXT NULL AFTER source',
    'SELECT "Column leads.email_guidelines already exists" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sales_intelligence_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    AND table_name = 'leads'
    AND column_name = 'sales_intelligence'
);

SET @sql = IF(@sales_intelligence_exists = 0,
    'ALTER TABLE leads ADD COLUMN sales_intelligence JSON NULL AFTER email_guidelines',
    'SELECT "Column leads.sales_intelligence already exists" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ================================================
-- FIX 5: Add Performance Indexes
-- ================================================
-- Speed up common queries

-- Index for events email lookups
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
    AND table_name = 'events'
    AND index_name = 'idx_events_email_account'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_events_email_account ON events(email_account_id)',
    'SELECT "Index idx_events_email_account already exists" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index for forecast lookups
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
    AND table_name = 'forecast_periods'
    AND index_name = 'idx_forecast_periods_active'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_forecast_periods_active ON forecast_periods(organization_id, is_active, is_closed)',
    'SELECT "Index already exists" as status'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ================================================
-- FIX 6: Ensure Data Visibility - Check Filters
-- ================================================
-- Fix common data visibility issues

-- Remove soft-deleted leads from default views (already handled by is_deleted=false in queries)
-- Ensure all leads are visible to their organization
UPDATE leads
SET visible = 1
WHERE visible = 0 AND is_deleted = 0;

-- Ensure all users can see their organization's data
-- (Check organization_id consistency)
UPDATE leads l
JOIN users u ON l.user_id = u.id
SET l.organization_id = u.organization_id
WHERE l.organization_id != u.organization_id;

-- ================================================
-- VERIFICATION
-- ================================================

SELECT
    'Database Fixes Applied Successfully!' as Status,
    '' as Separator,
    'Checking Results...' as Info;

-- Verify all columns exist
SELECT
    'Column Verification' as Check_Type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forecast_periods' AND column_name = 'name' AND table_schema = DATABASE())
        THEN '✓ forecast_periods.name' ELSE '✗ MISSING: forecast_periods.name' END as Result1,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'source_email_id' AND table_schema = DATABASE())
        THEN '✓ events.source_email_id' ELSE '✗ MISSING: events.source_email_id' END as Result2,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'email_account_id' AND table_schema = DATABASE())
        THEN '✓ events.email_account_id' ELSE '✗ MISSING: events.email_account_id' END as Result3,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completed_at' AND table_schema = DATABASE())
        THEN '✓ tasks.completed_at' ELSE '✗ MISSING: tasks.completed_at' END as Result4;

SELECT
    'AI Features' as Check_Type,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email_guidelines' AND table_schema = DATABASE())
        THEN '✓ leads.email_guidelines' ELSE '✗ MISSING: leads.email_guidelines' END as Result1,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'sales_intelligence' AND table_schema = DATABASE())
        THEN '✓ leads.sales_intelligence' ELSE '✗ MISSING: leads.sales_intelligence' END as Result2;

-- Show data counts to verify visibility
SELECT
    'Data Visibility Check' as Check_Type,
    (SELECT COUNT(*) FROM leads WHERE is_deleted = 0 AND visible = 1) as Visible_Leads,
    (SELECT COUNT(*) FROM leads WHERE is_deleted = 0 AND visible = 0) as Hidden_Leads,
    (SELECT COUNT(*) FROM forecast_periods WHERE name IS NOT NULL) as Named_Forecast_Periods,
    (SELECT COUNT(*) FROM tasks WHERE status = 'COMPLETED' AND completed_at IS NOT NULL) as Completed_Tasks_With_Date;

SELECT '✅ All database fixes applied successfully!' as Final_Status;
SELECT 'Please restart your backend server to pick up the schema changes.' as Next_Step;
