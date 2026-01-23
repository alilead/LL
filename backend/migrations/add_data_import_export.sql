-- Migration: Add Data Import/Export Tables
-- Created: 2025-11-05
-- Description: Tables for importing data from competitors (Salesforce, HubSpot, Pipedrive) and CSV

-- Import Jobs
CREATE TABLE IF NOT EXISTS import_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    created_by_id INT NULL,

    -- Source
    source_type ENUM('csv', 'salesforce', 'hubspot', 'pipedrive', 'zoho', 'microsoft_dynamics', 'api') NOT NULL,
    source_name VARCHAR(255) NULL COMMENT 'Source name or filename',

    -- Import details
    entity_type VARCHAR(50) NOT NULL COMMENT 'leads, contacts, deals, accounts',
    file_path VARCHAR(500) NULL COMMENT 'CSV file path',

    -- Status
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',

    -- Field mapping
    field_mapping JSON NULL COMMENT 'Field mapping configuration',

    -- Statistics
    total_records INT DEFAULT 0,
    processed_records INT DEFAULT 0,
    successful_records INT DEFAULT 0,
    failed_records INT DEFAULT 0,
    skipped_records INT DEFAULT 0,

    -- Results
    error_log JSON NULL COMMENT 'Error details',
    import_summary JSON NULL COMMENT 'Import summary',

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,

    -- Settings
    options JSON NULL,
    deduplicate BOOLEAN DEFAULT TRUE,
    update_existing BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_import_jobs_org (organization_id),
    INDEX idx_import_jobs_status (status),
    INDEX idx_import_jobs_source (source_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Field Mappings
CREATE TABLE IF NOT EXISTS field_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_job_id INT NOT NULL,

    -- Mapping
    source_field VARCHAR(255) NOT NULL COMMENT 'External field name',
    target_field VARCHAR(255) NOT NULL COMMENT 'Internal field name',

    -- Transformation
    transform_function VARCHAR(100) NULL COMMENT 'Transform function name',
    default_value VARCHAR(255) NULL,
    is_required BOOLEAN DEFAULT FALSE,

    -- Validation
    validation_rule VARCHAR(255) NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (import_job_id) REFERENCES import_jobs(id) ON DELETE CASCADE,
    INDEX idx_field_mappings_job (import_job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Import Records
CREATE TABLE IF NOT EXISTS import_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_job_id INT NOT NULL,

    -- Record details
    source_record_id VARCHAR(255) NULL COMMENT 'ID from source system',
    target_record_id INT NULL COMMENT 'Created record ID',

    -- Status
    status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, success, failed, skipped',
    error_message TEXT NULL,

    -- Data
    source_data JSON NULL COMMENT 'Original record data',

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NULL,

    FOREIGN KEY (import_job_id) REFERENCES import_jobs(id) ON DELETE CASCADE,
    INDEX idx_import_records_job (import_job_id),
    INDEX idx_import_records_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Export Jobs
CREATE TABLE IF NOT EXISTS export_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    created_by_id INT NULL,

    -- Export details
    entity_type VARCHAR(50) NOT NULL COMMENT 'leads, contacts, deals, accounts',
    format VARCHAR(20) DEFAULT 'csv' COMMENT 'csv, json, xlsx',

    -- Filters
    filters JSON NULL COMMENT 'Export filters',

    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    file_path VARCHAR(500) NULL COMMENT 'Generated file path',
    file_url VARCHAR(500) NULL COMMENT 'Download URL',

    -- Statistics
    total_records INT DEFAULT 0,

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    expires_at DATETIME NULL COMMENT 'Download link expiration',

    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_export_jobs_org (organization_id),
    INDEX idx_export_jobs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CRM Connections
CREATE TABLE IF NOT EXISTS crm_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    created_by_id INT NULL,

    -- Connection details
    crm_type ENUM('csv', 'salesforce', 'hubspot', 'pipedrive', 'zoho', 'microsoft_dynamics', 'api') NOT NULL,
    connection_name VARCHAR(255) NOT NULL,

    -- Authentication
    credentials JSON NULL COMMENT 'Encrypted credentials',
    api_endpoint VARCHAR(500) NULL,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at DATETIME NULL,
    sync_status VARCHAR(50) NULL,

    -- Settings
    sync_settings JSON NULL COMMENT 'Auto-sync configuration',

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_crm_connections_org (organization_id),
    INDEX idx_crm_connections_type (crm_type),
    INDEX idx_crm_connections_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
