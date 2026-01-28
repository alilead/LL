# LeadLab Database Schema

## Complete Database Tables Required

This document lists all 65+ database tables required for LeadLab CRM system.

---

## Core Tables

### 1. `organizations`
```sql
CREATE TABLE organizations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    website VARCHAR(255),
    is_active BOOLEAN,
    logo_filename VARCHAR(255),
    logo_content_type VARCHAR(50),
    logo_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);
```

### 2. `users`
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255),
    job_title VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    organization_role ENUM('VIEWER', 'MEMBER', 'MANAGER') DEFAULT 'MEMBER' NOT NULL,
    last_login DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,

    -- LinkedIn Integration
    linkedin_token VARCHAR(500),
    linkedin_refresh_token VARCHAR(500),
    linkedin_token_expires DATETIME,
    linkedin_profile_id VARCHAR(100),
    linkedin_profile_url VARCHAR(255),

    INDEX idx_email (email),
    INDEX idx_organization (organization_id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

### 3. `roles`
```sql
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN,
    is_system BOOLEAN,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

### 4. `permissions`
```sql
CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

### 5. `user_roles` (Association Table)
```sql
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

### 6. `role_permissions` (Association Table)
```sql
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

---

## Lead Management Tables

### 7. `lead_stages`
```sql
CREATE TABLE lead_stages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    order_index INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

### 8. `currencies`
```sql
CREATE TABLE currencies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9. `leads`
```sql
CREATE TABLE leads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    job_title VARCHAR(255),
    company VARCHAR(200),
    linkedin VARCHAR(500),
    location VARCHAR(200),
    country VARCHAR(100),
    website VARCHAR(500),
    unique_lead_id VARCHAR(100),
    est_wealth_experience VARCHAR(255),
    user_id INT,
    organization_id INT NOT NULL,
    stage_id INT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    telephone VARCHAR(50),
    mobile VARCHAR(50),
    sector VARCHAR(200),
    time_in_current_role VARCHAR(100),
    created_by INT,
    lab_comments TEXT,
    client_comments TEXT,
    psychometrics JSON,
    wpi VARCHAR(50),
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    visible BOOLEAN DEFAULT TRUE NOT NULL,
    source VARCHAR(100),

    -- AI/ML Features
    email_guidelines TEXT,
    sales_intelligence JSON,

    INDEX idx_email (email),
    INDEX idx_organization (organization_id),
    INDEX idx_stage (stage_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (stage_id) REFERENCES lead_stages(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 10. `tags`
```sql
CREATE TABLE tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    organization_id INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

### 11. `lead_tags` (Association Table)
```sql
CREATE TABLE lead_tags (
    lead_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (lead_id, tag_id),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

---

## Deal & Opportunity Tables

### 12. `deals`
```sql
CREATE TABLE deals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency_id INT,
    status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') NOT NULL,
    valid_until DATE,
    accepted_at DATETIME,
    rejected_at DATETIME,
    assigned_to_id INT,
    lead_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (currency_id) REFERENCES currencies(id),
    FOREIGN KEY (assigned_to_id) REFERENCES users(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
);
```

### 13. `opportunities`
```sql
CREATE TABLE opportunities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    value FLOAT,
    probability INT CHECK (probability BETWEEN 0 AND 100),
    expected_close_date DATETIME,
    actual_close_date DATETIME,
    status ENUM('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost') DEFAULT 'new',
    user_id INT NOT NULL,
    organization_id INT NOT NULL,
    lead_id INT,
    currency_id INT,
    deal_id INT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (currency_id) REFERENCES currencies(id),
    FOREIGN KEY (deal_id) REFERENCES deals(id)
);
```

---

## Activity & Communication Tables

### 14. `activities`
```sql
CREATE TABLE activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('call', 'email', 'meeting', 'note', 'task', 'linkedin_message') NOT NULL,
    description TEXT NOT NULL,
    scheduled_at DATETIME,
    duration INT DEFAULT 0,
    user_id INT NOT NULL,
    organization_id INT NOT NULL,
    lead_id INT,
    deal_id INT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (deal_id) REFERENCES deals(id)
);
```

### 15. `tasks`
```sql
CREATE TABLE tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATETIME,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    completed_at DATETIME,
    assigned_to_id INT,
    organization_id INT NOT NULL,
    lead_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
);
```

### 16. `events`
```sql
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    location VARCHAR(255),
    event_type ENUM('meeting', 'video_call', 'task', 'reminder') DEFAULT 'meeting' NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled' NOT NULL,
    organization_id INT NOT NULL,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
    lead_id INT,
    deal_id INT,

    -- ⚠️ NOTE: These columns may need to be added via migration
    -- source_email_id INT,
    -- email_account_id INT,

    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (deal_id) REFERENCES deals(id)
    -- FOREIGN KEY (email_account_id) REFERENCES email_accounts(id)
);
```

### 17. `event_attendees`
```sql
CREATE TABLE event_attendees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending' NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 18. `notes`
```sql
CREATE TABLE notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    organization_id INT NOT NULL,
    created_by_id INT NOT NULL,
    lead_id INT,
    deal_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);
```

### 19. `communications`
```sql
CREATE TABLE communications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('email', 'sms', 'call', 'meeting', 'video_call', 'whatsapp') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    scheduled_at DATETIME,
    completed_at DATETIME,
    duration INT,
    notes TEXT,
    user_id INT NOT NULL,
    organization_id INT NOT NULL,
    lead_id INT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
);
```

### 20. `messages`
```sql
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    organization_id INT NOT NULL,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

---

## Email Management Tables

### 21. `email_accounts`
```sql
CREATE TABLE email_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL,
    imap_host VARCHAR(255) NOT NULL,
    imap_port INT DEFAULT 993 NOT NULL,
    imap_use_ssl BOOLEAN DEFAULT TRUE,
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INT DEFAULT 587 NOT NULL,
    smtp_use_tls BOOLEAN DEFAULT TRUE,
    password_encrypted TEXT NOT NULL,
    sync_status VARCHAR(50) DEFAULT 'idle',
    last_sync_at DATETIME,
    sync_error_message TEXT,
    sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency_minutes INT DEFAULT 15,
    sync_sent_items BOOLEAN DEFAULT TRUE,
    sync_inbox BOOLEAN DEFAULT TRUE,
    days_to_sync INT DEFAULT 30,
    signature TEXT,
    auto_create_contacts BOOLEAN DEFAULT TRUE,
    auto_create_tasks BOOLEAN DEFAULT TRUE,
    calendar_sync_enabled BOOLEAN DEFAULT TRUE,
    calendar_url VARCHAR(500),
    calendar_sync_token TEXT,
    last_calendar_sync_at DATETIME,
    calendar_sync_error TEXT,
    auto_sync_calendar_events BOOLEAN DEFAULT TRUE,
    organization_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 22. `emails`
```sql
CREATE TABLE emails (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id VARCHAR(255) UNIQUE,
    thread_id VARCHAR(255),
    subject VARCHAR(500),
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    to_emails TEXT NOT NULL,
    cc_emails TEXT,
    bcc_emails TEXT,
    reply_to VARCHAR(255),
    body_text TEXT,
    body_html TEXT,
    direction ENUM('inbound', 'outbound') NOT NULL,
    status ENUM('draft', 'sent', 'delivered', 'failed', 'bounced') DEFAULT 'sent',
    priority VARCHAR(20) DEFAULT 'normal',
    sent_date DATETIME NOT NULL,
    received_date DATETIME,
    is_important BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    has_attachments BOOLEAN DEFAULT FALSE,
    folder_name VARCHAR(255) DEFAULT 'INBOX',
    imap_uid VARCHAR(50),

    -- AI Features
    contains_meeting_info BOOLEAN DEFAULT FALSE,
    extracted_dates TEXT,
    action_items TEXT,
    sentiment_score VARCHAR(20),

    email_account_id INT NOT NULL,
    organization_id INT NOT NULL,
    lead_id INT,
    deal_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (email_account_id) REFERENCES email_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
);
```

### 23. `email_attachments`
```sql
CREATE TABLE email_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT DEFAULT 0 NOT NULL,
    content LONGBLOB,
    file_path VARCHAR(500),
    is_inline BOOLEAN DEFAULT FALSE,
    is_calendar_invite BOOLEAN DEFAULT FALSE,
    email_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);
```

### 24. `email_templates`
```sql
CREATE TABLE email_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    description TEXT,
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    organization_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

### 25. `email_logs`
```sql
CREATE TABLE email_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed', 'bounced') DEFAULT 'pending',
    error_message TEXT,
    sent_at DATETIME,
    created_at DATETIME,
    organization_id INT NOT NULL,
    template_id INT,
    user_id INT NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## File & Custom Field Tables

### 26. `files`
```sql
CREATE TABLE files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    path VARCHAR(512) NOT NULL,
    entity_type ENUM('lead', 'deal', 'task', 'note', 'communication') NOT NULL,
    entity_id INT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 27. `custom_field_definitions`
```sql
CREATE TABLE custom_field_definitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    entity_type ENUM('lead', 'deal', 'contact', 'task', 'organization') NOT NULL,
    field_type ENUM('text', 'number', 'date', 'select', 'multi_select', 'checkbox', 'url', 'email', 'phone') NOT NULL,
    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) NOT NULL,
    description TEXT,
    placeholder VARCHAR(255),
    default_value JSON,
    options JSON,
    validation_rules JSON,
    is_required BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    is_filterable BOOLEAN DEFAULT TRUE,
    order INT DEFAULT 0,
    group_name VARCHAR(255),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY unique_org_entity_key (organization_id, entity_type, key),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

### 28. `custom_field_values`
```sql
CREATE TABLE custom_field_values (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    field_definition_id INT NOT NULL,
    entity_type ENUM('lead', 'deal', 'contact', 'task', 'organization') NOT NULL,
    entity_id INT NOT NULL,
    value JSON,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY unique_field_entity (field_definition_id, entity_type, entity_id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (field_definition_id) REFERENCES custom_field_definitions(id)
);
```

---

## Settings & Configuration Tables

### 29. `organization_settings`
```sql
CREATE TABLE organization_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL UNIQUE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(20) DEFAULT 'HH:mm',
    currency_id INT,
    logo_url VARCHAR(512),
    theme_settings JSON,
    email_settings JSON,
    notification_settings JSON,
    default_lead_stage_id INT,
    lead_auto_assignment BOOLEAN DEFAULT FALSE,
    deal_approval_required BOOLEAN DEFAULT FALSE,
    min_deal_amount DECIMAL(15, 2),
    max_deal_amount DECIMAL(15, 2),
    task_reminder_enabled BOOLEAN DEFAULT TRUE,
    default_task_reminder_minutes INT DEFAULT 30,
    email_signature TEXT,
    default_email_template_id INT,
    analytics_enabled BOOLEAN DEFAULT TRUE,
    custom_analytics_settings JSON,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (currency_id) REFERENCES currencies(id),
    FOREIGN KEY (default_lead_stage_id) REFERENCES lead_stages(id),
    FOREIGN KEY (default_email_template_id) REFERENCES email_templates(id)
);
```

---

## API & Integration Tables

### 30. `api_tokens`
```sql
CREATE TABLE api_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    description TEXT,
    scopes JSON NOT NULL,
    ip_whitelist JSON,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATETIME,
    last_used_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 31. `api_token_usage`
```sql
CREATE TABLE api_token_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token_id INT NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    status_code INT NOT NULL,
    response_time INT,
    error_message TEXT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (token_id) REFERENCES api_tokens(id) ON DELETE CASCADE
);
```

### 32. `tokens`
```sql
CREATE TABLE tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 33. `transactions`
```sql
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    lead_id INT,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    data_type VARCHAR(50),
    description VARCHAR(255),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
);
```

### 34. `linkedin_connections`
```sql
CREATE TABLE linkedin_connections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at DATETIME,
    profile_id VARCHAR(100),
    profile_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Team & Collaboration Tables

### 35. `team_invitations`
```sql
CREATE TABLE team_invitations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    invitation_token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    organization_id INT NOT NULL,
    invited_by_id INT NOT NULL,
    message TEXT,
    expires_at DATETIME NOT NULL,
    accepted_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (invited_by_id) REFERENCES users(id)
);
```

### 36. `information_requests`
```sql
CREATE TABLE information_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lead_id INT NOT NULL,
    requested_by INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    completed_at DATETIME,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
);
```

### 37. `ai_insights`
```sql
CREATE TABLE ai_insights (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lead_id INT NOT NULL,
    insight_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    confidence_score DECIMAL(3, 2),
    data JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
```

---

## 🏢 ENTERPRISE FEATURES

## Territory Management

### 38. `territories`
```sql
CREATE TABLE territories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('geographic', 'account_based', 'product', 'industry', 'custom') DEFAULT 'geographic',
    parent_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES territories(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 39. `territory_members`
```sql
CREATE TABLE territory_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    territory_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'manager', 'member') DEFAULT 'member',
    assigned_at DATETIME NOT NULL,
    assigned_by INT NOT NULL,
    UNIQUE KEY unique_territory_user (territory_id, user_id),
    FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);
```

### 40. `territory_rules`
```sql
CREATE TABLE territory_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    territory_id INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL,
    value TEXT NOT NULL,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE
);
```

### 41. `territory_assignments`
```sql
CREATE TABLE territory_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lead_id INT NOT NULL,
    territory_id INT NOT NULL,
    assigned_by_rule_id INT,
    priority ENUM('automatic', 'manual_high', 'manual_low') DEFAULT 'automatic',
    assigned_at DATETIME NOT NULL,
    UNIQUE KEY unique_lead_territory (lead_id, territory_id),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by_rule_id) REFERENCES territory_rules(id) ON DELETE SET NULL
);
```

### 42. `territory_quotas`
```sql
CREATE TABLE territory_quotas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    territory_id INT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    quota_amount DECIMAL(15, 2) NOT NULL,
    achieved_amount DECIMAL(15, 2) DEFAULT 0,
    currency_id INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE,
    FOREIGN KEY (currency_id) REFERENCES currencies(id)
);
```

---

## CPQ (Configure, Price, Quote)

### 43. `products`
```sql
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    base_price DECIMAL(15, 2) NOT NULL,
    currency_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_recurring BOOLEAN DEFAULT FALSE,
    billing_frequency ENUM('one_time', 'monthly', 'quarterly', 'annually'),
    cost_of_goods DECIMAL(15, 2),
    tax_rate DECIMAL(5, 2),
    product_data JSON,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (currency_id) REFERENCES currencies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 44. `quotes`
```sql
CREATE TABLE quotes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lead_id INT,
    deal_id INT,
    subtotal DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency_id INT NOT NULL,
    status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
    valid_until DATE,
    terms_conditions TEXT,
    notes TEXT,
    created_by INT NOT NULL,
    approved_by INT,
    approved_at DATETIME,
    sent_at DATETIME,
    accepted_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL,
    FOREIGN KEY (currency_id) REFERENCES currencies(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);
```

### 45. `quote_items`
```sql
CREATE TABLE quote_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quote_id INT NOT NULL,
    product_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    line_total DECIMAL(15, 2) NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);
```

### 46. `pricing_rules`
```sql
CREATE TABLE pricing_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type ENUM('discount', 'markup', 'tiered', 'bundle') NOT NULL,
    applies_to ENUM('product', 'category', 'all') DEFAULT 'product',
    product_id INT,
    category VARCHAR(100),
    min_quantity INT,
    max_quantity INT,
    adjustment_type ENUM('percentage', 'fixed_amount') NOT NULL,
    adjustment_value DECIMAL(15, 2) NOT NULL,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

---

## Email Sequences

### 47. `email_sequences`
```sql
CREATE TABLE email_sequences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 48. `sequence_steps`
```sql
CREATE TABLE sequence_steps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sequence_id INT NOT NULL,
    step_number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    delay_days INT DEFAULT 0,
    delay_hours INT DEFAULT 0,
    send_time TIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE
);
```

### 49. `sequence_enrollments`
```sql
CREATE TABLE sequence_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sequence_id INT NOT NULL,
    lead_id INT NOT NULL,
    status ENUM('active', 'paused', 'completed', 'failed') DEFAULT 'active',
    current_step INT DEFAULT 0,
    enrolled_at DATETIME NOT NULL,
    completed_at DATETIME,
    last_email_sent_at DATETIME,
    next_email_scheduled_at DATETIME,
    UNIQUE KEY unique_sequence_lead (sequence_id, lead_id),
    FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
```

---

## Workflow Automation

### 50. `workflows`
```sql
CREATE TABLE workflows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type ENUM('manual', 'field_update', 'time_based', 'webhook') NOT NULL,
    trigger_config JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 51. `workflow_executions`
```sql
CREATE TABLE workflow_executions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workflow_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
    started_at DATETIME,
    completed_at DATETIME,
    error_message TEXT,
    execution_data JSON,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);
```

### 52. `workflow_action_executions`
```sql
CREATE TABLE workflow_action_executions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    execution_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_config JSON,
    status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
    started_at DATETIME,
    completed_at DATETIME,
    error_message TEXT,
    result JSON,
    FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE
);
```

### 53. `approval_processes`
```sql
CREATE TABLE approval_processes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entity_type ENUM('deal', 'quote', 'discount', 'custom') NOT NULL,
    approval_criteria JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 54. `approval_steps`
```sql
CREATE TABLE approval_steps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    process_id INT NOT NULL,
    step_number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    approver_type ENUM('user', 'role', 'manager') NOT NULL,
    approver_id INT,
    is_required BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (process_id) REFERENCES approval_processes(id) ON DELETE CASCADE
);
```

### 55. `approval_requests`
```sql
CREATE TABLE approval_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    process_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    current_step INT DEFAULT 0,
    requested_by INT NOT NULL,
    requested_at DATETIME NOT NULL,
    completed_at DATETIME,
    notes TEXT,
    FOREIGN KEY (process_id) REFERENCES approval_processes(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id)
);
```

---

## Conversation Intelligence

### 56. `call_recordings`
```sql
CREATE TABLE call_recordings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_size BIGINT NOT NULL,
    duration_seconds INT,
    transcription TEXT,
    speaker_labels JSON,
    lead_id INT,
    deal_id INT,
    uploaded_by INT NOT NULL,
    uploaded_at DATETIME NOT NULL,
    processed_at DATETIME,
    processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
```

### 57. `conversation_insights`
```sql
CREATE TABLE conversation_insights (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recording_id INT NOT NULL,
    insight_type ENUM('sentiment', 'keywords', 'action_items', 'objections', 'questions') NOT NULL,
    content TEXT NOT NULL,
    confidence_score DECIMAL(3, 2),
    timestamp_start INT,
    timestamp_end INT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (recording_id) REFERENCES call_recordings(id) ON DELETE CASCADE
);
```

---

## Forecasting

### 58. `forecast_periods`
```sql
CREATE TABLE forecast_periods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(255),  -- ⚠️ NOTE: Column may not exist in current DB
    period_type ENUM('weekly', 'monthly', 'quarterly', 'annually') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 59. `forecasts`
```sql
CREATE TABLE forecasts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    period_id INT NOT NULL,
    user_id INT NOT NULL,
    territory_id INT,
    quota_amount DECIMAL(15, 2) NOT NULL,
    committed_amount DECIMAL(15, 2) DEFAULT 0,
    best_case_amount DECIMAL(15, 2) DEFAULT 0,
    pipeline_amount DECIMAL(15, 2) DEFAULT 0,
    closed_amount DECIMAL(15, 2) DEFAULT 0,
    status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
    submitted_at DATETIME,
    submitted_by INT,
    approved_at DATETIME,
    approved_by INT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (period_id) REFERENCES forecast_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE SET NULL,
    FOREIGN KEY (submitted_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);
```

### 60. `forecast_items`
```sql
CREATE TABLE forecast_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    forecast_id INT NOT NULL,
    deal_id INT NOT NULL,
    category ENUM('commit', 'best_case', 'pipeline', 'omitted') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    close_probability INT,
    expected_close_date DATE,
    notes TEXT,
    FOREIGN KEY (forecast_id) REFERENCES forecasts(id) ON DELETE CASCADE,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);
```

### 61. `forecast_history`
```sql
CREATE TABLE forecast_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    forecast_id INT NOT NULL,
    changed_by INT NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    old_value JSON,
    new_value JSON,
    notes TEXT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (forecast_id) REFERENCES forecasts(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);
```

### 62. `forecast_rollups`
```sql
CREATE TABLE forecast_rollups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    period_id INT NOT NULL,
    territory_id INT,
    level INT NOT NULL,
    total_quota DECIMAL(15, 2) NOT NULL,
    total_committed DECIMAL(15, 2) DEFAULT 0,
    total_best_case DECIMAL(15, 2) DEFAULT 0,
    total_pipeline DECIMAL(15, 2) DEFAULT 0,
    total_closed DECIMAL(15, 2) DEFAULT 0,
    calculated_at DATETIME NOT NULL,
    UNIQUE KEY unique_period_territory_level (period_id, territory_id, level),
    FOREIGN KEY (period_id) REFERENCES forecast_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE
);
```

### 63. `forecast_comments`
```sql
CREATE TABLE forecast_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    forecast_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (forecast_id) REFERENCES forecasts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Data Import/Export

### 64. `crm_connections`
```sql
CREATE TABLE crm_connections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider ENUM('salesforce', 'hubspot', 'pipedrive', 'zoho', 'custom') NOT NULL,
    api_credentials JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at DATETIME,
    sync_status VARCHAR(50),
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 65. `import_jobs`
```sql
CREATE TABLE import_jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    source ENUM('csv', 'excel', 'salesforce', 'hubspot', 'pipedrive', 'api') NOT NULL,
    entity_type ENUM('leads', 'deals', 'contacts', 'accounts') NOT NULL,
    file_path VARCHAR(512),
    connection_id INT,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    total_records INT DEFAULT 0,
    processed_records INT DEFAULT 0,
    successful_records INT DEFAULT 0,
    failed_records INT DEFAULT 0,
    error_log JSON,
    started_at DATETIME,
    completed_at DATETIME,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (connection_id) REFERENCES crm_connections(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 66. `field_mappings`
```sql
CREATE TABLE field_mappings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    import_job_id INT NOT NULL,
    source_field VARCHAR(255) NOT NULL,
    target_field VARCHAR(255) NOT NULL,
    transformation_rule JSON,
    FOREIGN KEY (import_job_id) REFERENCES import_jobs(id) ON DELETE CASCADE
);
```

### 67. `import_records`
```sql
CREATE TABLE import_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    import_job_id INT NOT NULL,
    source_data JSON NOT NULL,
    transformed_data JSON,
    status ENUM('pending', 'success', 'failed', 'skipped') DEFAULT 'pending',
    error_message TEXT,
    entity_id INT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (import_job_id) REFERENCES import_jobs(id) ON DELETE CASCADE
);
```

### 68. `export_jobs`
```sql
CREATE TABLE export_jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    entity_type ENUM('leads', 'deals', 'contacts', 'accounts', 'reports') NOT NULL,
    format ENUM('csv', 'excel', 'json', 'pdf') NOT NULL,
    filters JSON,
    file_path VARCHAR(512),
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    total_records INT DEFAULT 0,
    error_message TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

---

## 🎯 CRITICAL DATABASE MIGRATIONS NEEDED

### Required Migrations

#### 1. Events Table - Add Email Integration Columns (Optional)
```sql
ALTER TABLE events
  ADD COLUMN source_email_id INT NULL,
  ADD COLUMN email_account_id INT NULL,
  ADD CONSTRAINT fk_events_email_account
    FOREIGN KEY (email_account_id) REFERENCES email_accounts(id);
```

#### 2. Forecast Periods Table - Add Name Column (Required)
```sql
ALTER TABLE forecast_periods
  ADD COLUMN name VARCHAR(255) NULL;
```

---

## Summary

**Total Tables: 68+**

**Categories:**
- Core (Users, Organizations, Roles): 6 tables
- Lead Management: 5 tables
- Deal & Opportunity: 2 tables
- Activity & Communication: 7 tables
- Email Management: 5 tables
- Files & Custom Fields: 4 tables
- Settings & Configuration: 1 table
- API & Integration: 5 tables
- Team & Collaboration: 3 tables
- **Enterprise Features:**
  - Territory Management: 5 tables
  - CPQ (Configure, Price, Quote): 4 tables
  - Email Sequences: 3 tables
  - Workflow Automation: 6 tables
  - Conversation Intelligence: 2 tables
  - Forecasting: 6 tables
  - Data Import/Export: 5 tables

**Database Status:**
- ✅ Most tables are properly defined in models
- ⚠️ 2 columns may be missing from database (need migrations)
- ✅ All foreign keys and relationships properly configured
