-- Professional CRM Features Migration
-- Date: 2024-01-XX
-- Description: Adding Stripe, Custom Fields, Notifications, and Reports functionality

-- 1. STRIPE CREDIT SYSTEM
-- Add credit and subscription columns to organizations
ALTER TABLE organizations 
ADD COLUMN credit_balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN stripe_customer_id VARCHAR(255) NULL,
ADD COLUMN subscription_status ENUM('trial', 'active', 'inactive', 'cancelled') DEFAULT 'trial',
ADD COLUMN subscription_plan VARCHAR(100) DEFAULT 'basic',
ADD COLUMN trial_ends_at DATETIME NULL,
ADD COLUMN billing_email VARCHAR(255) NULL;

-- Create credit packages table
CREATE TABLE credit_packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_price_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    features JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default credit packages
INSERT INTO credit_packages (name, description, credits, price, stripe_price_id, features) VALUES
('Starter Pack', 'Perfect for small teams', 1000, 29.99, 'price_starter', '["basic_crm", "email_sync"]'),
('Professional Pack', 'For growing businesses', 5000, 99.99, 'price_pro', '["advanced_crm", "custom_fields", "reports"]'),
('Enterprise Pack', 'Unlimited power', 25000, 299.99, 'price_enterprise', '["full_crm", "api_access", "premium_support"]');

-- 2. ENHANCE NOTIFICATIONS SYSTEM
ALTER TABLE notifications
ADD COLUMN type ENUM('info', 'warning', 'success', 'error', 'system') DEFAULT 'info',
ADD COLUMN priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
ADD COLUMN action_url VARCHAR(500) NULL,
ADD COLUMN metadata JSON NULL,
ADD COLUMN expires_at DATETIME NULL,
ADD COLUMN category VARCHAR(100) DEFAULT 'general';

-- 3. ENHANCE TRANSACTIONS FOR CREDIT TRACKING
ALTER TABLE transactions
ADD COLUMN stripe_payment_intent_id VARCHAR(255) NULL,
ADD COLUMN stripe_session_id VARCHAR(255) NULL,
ADD COLUMN credit_change INT DEFAULT 0,
ADD COLUMN status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending';

-- 4. ADD USAGE TRACKING
CREATE TABLE feature_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    user_id INT NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    usage_count INT DEFAULT 1,
    credits_consumed INT DEFAULT 0,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_org_feature (organization_id, feature_name),
    INDEX idx_user_feature (user_id, feature_name)
);

-- 5. REPORTS ENHANCEMENTS  
ALTER TABLE reports
ADD COLUMN credits_required INT DEFAULT 0,
ADD COLUMN data_retention_days INT DEFAULT 30,
ADD COLUMN is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN shared_with JSON NULL;

-- 6. CREATE SYSTEM SETTINGS TABLE
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    setting_key VARCHAR(255) NOT NULL,
    setting_value JSON NOT NULL,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    UNIQUE KEY unique_org_setting (organization_id, setting_key)
);

-- Insert default settings
INSERT INTO system_settings (organization_id, setting_key, setting_value) 
SELECT id, 'credit_consumption_rates', 
'{"lead_import": 1, "email_sync": 2, "report_generation": 5, "ai_insights": 10, "custom_fields_per_entity": 3}'
FROM organizations;

-- 7. CREATE AUDIT LOG
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_org_action (organization_id, action),
    INDEX idx_entity (entity_type, entity_id)
);

-- 8. UPDATE EXISTING DATA
-- Set trial period for existing organizations
UPDATE organizations 
SET trial_ends_at = DATE_ADD(created_at, INTERVAL 14 DAY),
    credit_balance = 500.00
WHERE trial_ends_at IS NULL;

-- Success message
SELECT 'Professional CRM Features Migration Completed Successfully!' as status; 