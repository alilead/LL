-- LeadLab Database Tables Check Script
-- Run this script to verify all required tables exist in your database

-- Show all tables in current database
SHOW TABLES;

-- Check specific critical tables
SELECT
    'Core Tables' as Category,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN '✓' ELSE '✗' END as organizations,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN '✓' ELSE '✗' END as users,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN '✓' ELSE '✗' END as roles,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN '✓' ELSE '✗' END as permissions
UNION ALL
SELECT
    'Lead Management',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_stages') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tags') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_tags') THEN '✓' ELSE '✗' END
UNION ALL
SELECT
    'Activity & Tasks',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN '✓' ELSE '✗' END
UNION ALL
SELECT
    'Email Management',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_accounts') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emails') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs') THEN '✓' ELSE '✗' END
UNION ALL
SELECT
    'Enterprise: Territories',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'territories') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'territory_members') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'territory_rules') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'territory_quotas') THEN '✓' ELSE '✗' END
UNION ALL
SELECT
    'Enterprise: CPQ',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quote_items') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_rules') THEN '✓' ELSE '✗' END
UNION ALL
SELECT
    'Enterprise: Email Sequences',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_sequences') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sequence_steps') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sequence_enrollments') THEN '✓' ELSE '✗' END,
    '' as placeholder
UNION ALL
SELECT
    'Enterprise: Workflows',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflows') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_processes') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_executions') THEN '✓' ELSE '✗' END,
    '' as placeholder
UNION ALL
SELECT
    'Enterprise: Forecasting',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forecast_periods') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forecasts') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forecast_items') THEN '✓' ELSE '✗' END,
    '' as placeholder
UNION ALL
SELECT
    'Enterprise: Conversations',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_recordings') THEN '✓' ELSE '✗' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_insights') THEN '✓' ELSE '✗' END,
    '' as placeholder1,
    '' as placeholder2;

-- Check for missing columns in existing tables
SELECT
    'Column Checks' as Info,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'source_email_id'
    ) THEN '✓' ELSE '✗ MISSING' END as events_source_email_id,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'email_account_id'
    ) THEN '✓' ELSE '✗ MISSING' END as events_email_account_id,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'forecast_periods' AND column_name = 'name'
    ) THEN '✓' ELSE '✗ MISSING' END as forecast_periods_name;

-- Get total table count
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_type = 'BASE TABLE';

-- List all tables with row counts
SELECT
    table_name,
    table_rows as estimated_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
