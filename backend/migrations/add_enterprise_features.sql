-- Migration: Add Enterprise Features
-- Created: 2025-11-05
-- Description: Adds all enterprise feature tables (Territory, Workflow, Forecast, Dashboard, Email Sequences, CPQ, Conversation Intelligence)

-- ====================
-- TERRITORY MANAGEMENT
-- ====================

CREATE TABLE IF NOT EXISTS territories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id INT NOT NULL,
    parent_id INT NULL,
    path VARCHAR(500) NULL COMMENT 'Materialized path for hierarchy',
    level INT DEFAULT 0 COMMENT 'Depth level in hierarchy',
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES territories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_territories_org (organization_id),
    INDEX idx_territories_parent (parent_id),
    INDEX idx_territories_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS territory_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    territory_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'member' COMMENT 'owner, manager, member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_territory_user (territory_id, user_id),
    INDEX idx_territory_members_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS territory_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    territory_id INT NOT NULL,
    rule_type VARCHAR(50) NOT NULL COMMENT 'lead, account, opportunity',
    conditions JSON NOT NULL COMMENT 'Rule conditions for auto-assignment',
    priority INT DEFAULT 0 COMMENT 'Higher priority rules evaluated first',
    is_active BOOLEAN DEFAULT TRUE,
    auto_assign BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE,
    INDEX idx_territory_rules_territory (territory_id),
    INDEX idx_territory_rules_active (is_active),
    INDEX idx_territory_rules_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS territory_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    territory_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL COMMENT 'lead, account, opportunity',
    entity_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by_user_id INT NULL,
    assigned_by_rule_id INT NULL,
    FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by_rule_id) REFERENCES territory_rules(id) ON DELETE SET NULL,
    INDEX idx_territory_assignments_entity (entity_type, entity_id),
    INDEX idx_territory_assignments_territory (territory_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS territory_quotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    territory_id INT NOT NULL,
    year INT NOT NULL,
    quarter INT NULL COMMENT '1-4 for quarterly quotas',
    quota_amount DECIMAL(15, 2) NOT NULL,
    actual_amount DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE,
    INDEX idx_territory_quotas_territory (territory_id),
    INDEX idx_territory_quotas_period (year, quarter)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================
-- WORKFLOW AUTOMATION
-- ====================

CREATE TABLE IF NOT EXISTS workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id INT NOT NULL,
    trigger_type ENUM('manual', 'record_created', 'record_updated', 'field_changed', 'time_based', 'webhook', 'scheduled') NOT NULL,
    trigger_object VARCHAR(50) NOT NULL COMMENT 'lead, deal, task, etc.',
    flow_definition JSON NOT NULL COMMENT 'Nodes and edges for visual workflow',
    entry_criteria JSON NULL COMMENT 'Conditions to start workflow',
    is_active BOOLEAN DEFAULT FALSE,
    created_by_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_workflows_org (organization_id),
    INDEX idx_workflows_trigger (trigger_type, trigger_object),
    INDEX idx_workflows_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workflow_executions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    trigger_record_type VARCHAR(50) NOT NULL,
    trigger_record_id INT NOT NULL,
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    execution_log JSON NULL COMMENT 'Step-by-step execution log',
    error_message TEXT NULL,
    duration_ms INT NULL,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    INDEX idx_workflow_executions_workflow (workflow_id),
    INDEX idx_workflow_executions_trigger (trigger_record_type, trigger_record_id),
    INDEX idx_workflow_executions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workflow_action_executions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    execution_id INT NOT NULL,
    action_id VARCHAR(100) NOT NULL COMMENT 'Node ID from flow definition',
    action_type VARCHAR(50) NOT NULL,
    status ENUM('pending', 'running', 'completed', 'failed', 'skipped') DEFAULT 'pending',
    input_data JSON NULL,
    output_data JSON NULL,
    error_message TEXT NULL,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE,
    INDEX idx_workflow_action_executions_execution (execution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS approval_processes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id INT NOT NULL,
    object_type VARCHAR(50) NOT NULL COMMENT 'quote, discount, contract',
    approval_steps JSON NOT NULL COMMENT 'Sequential or parallel approval steps',
    allow_parallel BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_approval_processes_org (organization_id),
    INDEX idx_approval_processes_object (object_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS approval_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    process_id INT NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    submitted_by_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'recalled') DEFAULT 'pending',
    current_step INT DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    FOREIGN KEY (process_id) REFERENCES approval_processes(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_approval_requests_process (process_id),
    INDEX idx_approval_requests_record (record_type, record_id),
    INDEX idx_approval_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS approval_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    step_number INT NOT NULL,
    approver_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    responded_at DATETIME NULL,
    comments TEXT NULL,
    FOREIGN KEY (request_id) REFERENCES approval_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_approval_steps_request (request_id),
    INDEX idx_approval_steps_approver (approver_id),
    INDEX idx_approval_steps_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================
-- FORECASTING
-- ====================

CREATE TABLE IF NOT EXISTS forecast_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    period_type ENUM('weekly', 'monthly', 'quarterly', 'annual') NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_forecast_periods_org (organization_id),
    INDEX idx_forecast_periods_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS forecasts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_id INT NOT NULL,
    user_id INT NOT NULL,
    territory_id INT NULL,
    pipeline_amount FLOAT DEFAULT 0.0 COMMENT 'Total pipeline value',
    best_case_amount FLOAT DEFAULT 0.0 COMMENT 'Best case forecast',
    commit_amount FLOAT DEFAULT 0.0 COMMENT 'Committed forecast',
    closed_amount FLOAT DEFAULT 0.0 COMMENT 'Actually closed',
    manager_adjusted_commit FLOAT NULL COMMENT 'Manager override',
    adjustment_reason TEXT NULL,
    ai_predicted_commit FLOAT NULL COMMENT 'AI prediction',
    quota_amount FLOAT NULL,
    status ENUM('draft', 'submitted', 'approved') DEFAULT 'draft',
    submitted_at DATETIME NULL,
    adjusted_by_id INT NULL,
    adjusted_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES forecast_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE SET NULL,
    FOREIGN KEY (adjusted_by_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_forecast_period_user (period_id, user_id),
    INDEX idx_forecasts_period (period_id),
    INDEX idx_forecasts_user (user_id),
    INDEX idx_forecasts_territory (territory_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS forecast_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    forecast_id INT NOT NULL,
    deal_id INT NOT NULL,
    category ENUM('pipeline', 'best_case', 'commit', 'closed') NOT NULL,
    amount FLOAT NOT NULL,
    probability INT DEFAULT 0 COMMENT 'Win probability 0-100',
    close_date DATETIME NULL,
    notes TEXT NULL,
    FOREIGN KEY (forecast_id) REFERENCES forecasts(id) ON DELETE CASCADE,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    INDEX idx_forecast_items_forecast (forecast_id),
    INDEX idx_forecast_items_deal (deal_id),
    INDEX idx_forecast_items_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS forecast_rollups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_id INT NOT NULL,
    rollup_level VARCHAR(50) NOT NULL COMMENT 'user, team, territory, organization',
    entity_id INT NULL COMMENT 'ID of user/team/territory',
    pipeline_amount FLOAT DEFAULT 0.0,
    best_case_amount FLOAT DEFAULT 0.0,
    commit_amount FLOAT DEFAULT 0.0,
    closed_amount FLOAT DEFAULT 0.0,
    quota_amount FLOAT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES forecast_periods(id) ON DELETE CASCADE,
    INDEX idx_forecast_rollups_period (period_id),
    INDEX idx_forecast_rollups_level (rollup_level, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS forecast_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    forecast_id INT NOT NULL,
    changed_by_id INT NOT NULL,
    change_type VARCHAR(50) NOT NULL COMMENT 'submitted, adjusted, approved',
    previous_commit FLOAT NULL,
    new_commit FLOAT NULL,
    reason TEXT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (forecast_id) REFERENCES forecasts(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_forecast_history_forecast (forecast_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS forecast_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    forecast_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (forecast_id) REFERENCES forecasts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_forecast_comments_forecast (forecast_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================
-- DASHBOARD BUILDER
-- ====================

CREATE TABLE IF NOT EXISTS dashboards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id INT NOT NULL,
    created_by_id INT NULL,
    layout JSON NULL COMMENT 'Grid layout configuration',
    is_default BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_dashboards_org (organization_id),
    INDEX idx_dashboards_default (is_default),
    INDEX idx_dashboards_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dashboard_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    widget_type VARCHAR(50) NOT NULL COMMENT 'chart, table, metric, list',
    data_source VARCHAR(100) NOT NULL COMMENT 'leads, deals, activities, custom',
    configuration JSON NULL COMMENT 'Widget-specific configuration',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE,
    INDEX idx_dashboard_widgets_dashboard (dashboard_id),
    INDEX idx_dashboard_widgets_type (widget_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================
-- EMAIL SEQUENCES
-- ====================

CREATE TABLE IF NOT EXISTS email_sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    steps JSON NULL COMMENT 'Sequence step definitions',
    total_enrolled INT DEFAULT 0,
    total_completed INT DEFAULT 0,
    total_replied INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by_id INT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email_sequences_org (organization_id),
    INDEX idx_email_sequences_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sequence_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sequence_id INT NOT NULL,
    lead_id INT NOT NULL,
    current_step INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' COMMENT 'active, completed, paused, replied',
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    INDEX idx_sequence_enrollments_sequence (sequence_id),
    INDEX idx_sequence_enrollments_lead (lead_id),
    INDEX idx_sequence_enrollments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sequence_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    step_number INT NOT NULL,
    scheduled_at DATETIME NULL,
    sent_at DATETIME NULL,
    opened_at DATETIME NULL,
    clicked_at DATETIME NULL,
    replied_at DATETIME NULL,
    status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, sent, opened, clicked, replied',
    FOREIGN KEY (enrollment_id) REFERENCES sequence_enrollments(id) ON DELETE CASCADE,
    INDEX idx_sequence_steps_enrollment (enrollment_id),
    INDEX idx_sequence_steps_status (status),
    INDEX idx_sequence_steps_scheduled (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================
-- CPQ (Configure-Price-Quote)
-- ====================

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    organization_id INT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    category VARCHAR(100) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_products_org (organization_id),
    INDEX idx_products_sku (sku),
    INDEX idx_products_category (category),
    INDEX idx_products_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_number VARCHAR(100) UNIQUE NOT NULL,
    organization_id INT NOT NULL,
    deal_id INT NULL,
    created_by_id INT NULL,
    subtotal DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'draft' COMMENT 'draft, sent, accepted, rejected',
    valid_until DATETIME NULL,
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by_id INT NULL,
    approved_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME NULL,
    accepted_at DATETIME NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_quotes_org (organization_id),
    INDEX idx_quotes_number (quote_number),
    INDEX idx_quotes_deal (deal_id),
    INDEX idx_quotes_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    line_total DECIMAL(10, 2) NOT NULL,
    description TEXT NULL,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_quote_items_quote (quote_id),
    INDEX idx_quote_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pricing_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    organization_id INT NOT NULL,
    conditions JSON NULL COMMENT 'Rule conditions',
    discount_type VARCHAR(20) NOT NULL COMMENT 'percentage, fixed',
    discount_value DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0 COMMENT 'Higher priority evaluated first',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_pricing_rules_org (organization_id),
    INDEX idx_pricing_rules_active (is_active),
    INDEX idx_pricing_rules_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================
-- CONVERSATION INTELLIGENCE
-- ====================

CREATE TABLE IF NOT EXISTS call_recordings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    user_id INT NOT NULL,
    lead_id INT NOT NULL,
    recording_url VARCHAR(500) NOT NULL,
    duration_seconds INT NOT NULL,
    transcript TEXT NULL,
    transcription_status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, processing, completed, failed',
    sentiment_score FLOAT NULL COMMENT 'Sentiment score from -1 to 1',
    keywords JSON NULL COMMENT 'Extracted keywords with counts',
    topics JSON NULL COMMENT 'Identified topics',
    action_items JSON NULL COMMENT 'Detected action items',
    key_moments JSON NULL COMMENT 'Key moments in call',
    competitor_mentions JSON NULL COMMENT 'Competitor mentions with context',
    call_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    analyzed_at DATETIME NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    INDEX idx_call_recordings_org (organization_id),
    INDEX idx_call_recordings_user (user_id),
    INDEX idx_call_recordings_lead (lead_id),
    INDEX idx_call_recordings_date (call_date),
    INDEX idx_call_recordings_status (transcription_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conversation_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recording_id INT NOT NULL,
    insight_type VARCHAR(50) NOT NULL COMMENT 'objection, pain_point, buying_signal, question, commitment',
    description TEXT NOT NULL,
    confidence_score FLOAT NOT NULL COMMENT 'Confidence score 0-1',
    timestamp INT NOT NULL COMMENT 'Seconds into call',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recording_id) REFERENCES call_recordings(id) ON DELETE CASCADE,
    INDEX idx_conversation_insights_recording (recording_id),
    INDEX idx_conversation_insights_type (insight_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================
-- MIGRATION COMPLETE
-- ====================
