-- Professional CRM Features Setup
-- Run this script to enable advanced features

-- 1. Add Stripe Credit System to Organizations
ALTER TABLE organizations 
ADD COLUMN credit_balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN stripe_customer_id VARCHAR(255) NULL,
ADD COLUMN subscription_status ENUM('trial', 'active', 'inactive') DEFAULT 'trial',
ADD COLUMN trial_ends_at DATETIME NULL;

-- 2. Create Credit Packages Table
CREATE TABLE credit_packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    credits INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stripe_price_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insert Default Packages
INSERT INTO credit_packages (name, credits, price, stripe_price_id) VALUES
('Starter Pack', 1000, 29.99, 'price_starter'),
('Pro Pack', 5000, 99.99, 'price_pro'),
('Enterprise Pack', 25000, 299.99, 'price_enterprise');

-- 4. Enhance Notifications
ALTER TABLE notifications
ADD COLUMN type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
ADD COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
ADD COLUMN action_url VARCHAR(500) NULL;

-- 5. Enhance Transactions for Credits
ALTER TABLE transactions
ADD COLUMN stripe_payment_intent_id VARCHAR(255) NULL,
ADD COLUMN credit_change INT DEFAULT 0,
ADD COLUMN status ENUM('pending', 'completed', 'failed') DEFAULT 'pending';

-- 6. Create Feature Usage Tracking
CREATE TABLE feature_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    user_id INT NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    credits_consumed INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 7. Give Trial Credits to Existing Organizations
UPDATE organizations 
SET credit_balance = 500.00, 
    trial_ends_at = DATE_ADD(NOW(), INTERVAL 14 DAY)
WHERE credit_balance IS NULL;

-- 8. Success Message
SELECT 'Professional Features Setup Complete!' as result;

