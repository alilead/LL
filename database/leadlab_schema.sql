-- LeadLab Database Schema and Initial Data
-- Generated for production deployment
-- Usage: mysql -u httpdvic1_admin -pJVI~dEtn6#gs leadlab < leadlab_schema.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Database: `leadlab`
-- --------------------------------------------------------

USE `leadlab`;

-- --------------------------------------------------------
-- Table structure for table `organizations`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(100) NOT NULL UNIQUE,
  `description` text,
  `website` varchar(255),
  `industry` varchar(100),
  `size` enum('startup','small','medium','large','enterprise') DEFAULT 'small',
  `status` enum('active','inactive','trial') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL UNIQUE,
  `hashed_password` varchar(255) NOT NULL,
  `first_name` varchar(100),
  `last_name` varchar(100),
  `is_active` boolean NOT NULL DEFAULT true,
  `is_superuser` boolean NOT NULL DEFAULT false,
  `organization_id` int(11) NOT NULL,
  `role` enum('admin','manager','user','viewer') DEFAULT 'user',
  `avatar_url` varchar(500),
  `phone` varchar(50),
  `timezone` varchar(50) DEFAULT 'UTC',
  `language` varchar(10) DEFAULT 'en',
  `last_login` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_users_organization` (`organization_id`),
  CONSTRAINT `fk_users_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `lead_stages`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `lead_stages`;
CREATE TABLE `lead_stages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `color` varchar(7) DEFAULT '#3B82F6',
  `order_index` int(11) NOT NULL DEFAULT 0,
  `organization_id` int(11) NOT NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_lead_stages_organization` (`organization_id`),
  CONSTRAINT `fk_lead_stages_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `leads`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `leads`;
CREATE TABLE `leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100),
  `last_name` varchar(100),
  `email` varchar(255),
  `phone` varchar(50),
  `mobile` varchar(50),
  `job_title` varchar(255),
  `company` varchar(200),
  `industry` varchar(100),
  `sector` varchar(200),
  `website` varchar(500),
  `linkedin` varchar(500),
  `location` varchar(200),
  `country` varchar(100),
  `time_in_current_role` varchar(100),
  `est_wealth_experience` varchar(255),
  `unique_lead_id` varchar(100),
  `wpi` varchar(50),
  `lab_comments` text,
  `client_comments` text,
  `psychometrics` json,
  `source` varchar(100),
  `user_id` int(11) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `stage_id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `is_deleted` boolean NOT NULL DEFAULT false,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_leads_email` (`email`),
  KEY `idx_leads_company` (`company`),
  KEY `idx_leads_country` (`country`),
  KEY `idx_leads_sector` (`sector`),
  KEY `idx_leads_wpi` (`wpi`),
  KEY `idx_leads_unique_id` (`unique_lead_id`),
  KEY `fk_leads_user` (`user_id`),
  KEY `fk_leads_organization` (`organization_id`),
  KEY `fk_leads_stage` (`stage_id`),
  KEY `fk_leads_created_by` (`created_by`),
  CONSTRAINT `fk_leads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leads_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leads_stage` FOREIGN KEY (`stage_id`) REFERENCES `lead_stages` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_leads_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `ai_insights`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `ai_insights`;
CREATE TABLE `ai_insights` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lead_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `analysis_type` varchar(50) NOT NULL DEFAULT 'psychometric',
  `quality_score` decimal(5,2) DEFAULT 0.00,
  `priority_score` decimal(5,2) DEFAULT 0.00,
  `confidence_score` decimal(3,2) DEFAULT 0.00,
  `personality_type` varchar(20),
  `disc_profile` varchar(50),
  `communication_style` varchar(100),
  `strengths` json,
  `recommendations` json,
  `sales_approach` varchar(500),
  `features_used` int(11) DEFAULT 1,
  `ai_model_version` varchar(50) DEFAULT 'internal_v1.0',
  `analysis_provider` varchar(100) DEFAULT 'internal',
  `raw_data` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lead_analysis` (`lead_id`, `analysis_type`),
  KEY `idx_ai_insights_quality` (`quality_score`),
  KEY `idx_ai_insights_priority` (`priority_score`),
  KEY `idx_ai_insights_personality` (`personality_type`),
  KEY `fk_ai_insights_lead` (`lead_id`),
  KEY `fk_ai_insights_user` (`user_id`),
  KEY `fk_ai_insights_organization` (`organization_id`),
  CONSTRAINT `fk_ai_insights_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ai_insights_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ai_insights_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `activities`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `activities`;
CREATE TABLE `activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lead_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `activity_type` enum('note','email','call','meeting','task','linkedin','analysis') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `metadata` json,
  `completed_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activities_type` (`activity_type`),
  KEY `idx_activities_completed` (`completed_at`),
  KEY `fk_activities_lead` (`lead_id`),
  KEY `fk_activities_user` (`user_id`),
  KEY `fk_activities_organization` (`organization_id`),
  CONSTRAINT `fk_activities_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activities_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activities_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `notes`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `notes`;
CREATE TABLE `notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lead_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_private` boolean NOT NULL DEFAULT false,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_notes_lead` (`lead_id`),
  KEY `fk_notes_user` (`user_id`),
  CONSTRAINT `fk_notes_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `tags`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `color` varchar(7) DEFAULT '#3B82F6',
  `organization_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tag_org` (`name`, `organization_id`),
  KEY `fk_tags_organization` (`organization_id`),
  CONSTRAINT `fk_tags_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `lead_tags`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `lead_tags`;
CREATE TABLE `lead_tags` (
  `lead_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`lead_id`, `tag_id`),
  KEY `fk_lead_tags_tag` (`tag_id`),
  CONSTRAINT `fk_lead_tags_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lead_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `linkedin_connections`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `linkedin_connections`;
CREATE TABLE `linkedin_connections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lead_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `linkedin_profile_url` varchar(500) NOT NULL,
  `connection_status` enum('pending','connected','declined','not_sent') DEFAULT 'not_sent',
  `message_sent` text,
  `connected_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lead_linkedin` (`lead_id`, `user_id`),
  KEY `idx_linkedin_status` (`connection_status`),
  KEY `fk_linkedin_connections_lead` (`lead_id`),
  KEY `fk_linkedin_connections_user` (`user_id`),
  CONSTRAINT `fk_linkedin_connections_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_linkedin_connections_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `settings`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `organization_id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `is_public` boolean NOT NULL DEFAULT false,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_org_setting` (`organization_id`, `setting_key`),
  KEY `fk_settings_organization` (`organization_id`),
  CONSTRAINT `fk_settings_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Initial Data Inserts
-- --------------------------------------------------------

-- Insert default organization
INSERT INTO `organizations` (`name`, `slug`, `description`, `industry`, `size`, `status`) VALUES
('LeadLab Demo', 'leadlab-demo', 'Demo organization for LeadLab platform', 'Technology', 'startup', 'active');

SET @org_id = LAST_INSERT_ID();

-- Insert admin user (password: admin123)
INSERT INTO `users` (`email`, `hashed_password`, `first_name`, `last_name`, `is_active`, `is_superuser`, `organization_id`, `role`) VALUES
('admin@the-leadlab.com', '$2b$12$LQv3c1yqBw2LeOSqdKE5nO8bVKcFT1Q1VrELPJcOT2NK5F8F8F8F8', 'Admin', 'User', true, true, @org_id, 'admin'),
('demo@the-leadlab.com', '$2b$12$LQv3c1yqBw2LeOSqdKE5nO8bVKcFT1Q1VrELPJcOT2NK5F8F8F8F8', 'Demo', 'User', true, false, @org_id, 'user');

SET @admin_user_id = (SELECT id FROM users WHERE email = 'admin@the-leadlab.com');
SET @demo_user_id = (SELECT id FROM users WHERE email = 'demo@the-leadlab.com');

-- Insert default lead stages
INSERT INTO `lead_stages` (`name`, `description`, `color`, `order_index`, `organization_id`) VALUES
('New Lead', 'Newly acquired leads', '#3B82F6', 1, @org_id),
('Contacted', 'Initial contact made', '#F59E0B', 2, @org_id),
('Qualified', 'Lead has been qualified', '#10B981', 3, @org_id),
('Proposal', 'Proposal sent to lead', '#8B5CF6', 4, @org_id),
('Negotiation', 'In negotiation phase', '#F97316', 5, @org_id),
('Closed Won', 'Successfully closed', '#059669', 6, @org_id),
('Closed Lost', 'Lead was lost', '#DC2626', 7, @org_id);

-- Insert sample tags
INSERT INTO `tags` (`name`, `color`, `organization_id`) VALUES
('Hot Lead', '#DC2626', @org_id),
('Cold Lead', '#3B82F6', @org_id),
('High Value', '#059669', @org_id),
('Follow Up', '#F59E0B', @org_id),
('LinkedIn', '#0077B5', @org_id),
('Referral', '#8B5CF6', @org_id);

-- Insert sample leads
INSERT INTO `leads` (`first_name`, `last_name`, `email`, `job_title`, `company`, `industry`, `location`, `country`, `user_id`, `organization_id`, `stage_id`, `created_by`) VALUES
('John', 'Smith', 'john.smith@techcorp.com', 'CTO', 'TechCorp Inc', 'Technology', 'San Francisco, CA', 'USA', @demo_user_id, @org_id, 1, @admin_user_id),
('Sarah', 'Johnson', 'sarah.j@innovations.com', 'VP of Sales', 'Innovations Ltd', 'Software', 'London', 'UK', @demo_user_id, @org_id, 2, @admin_user_id),
('Michael', 'Brown', 'mbrown@startup.io', 'Founder', 'Brown Startup', 'Fintech', 'New York, NY', 'USA', @demo_user_id, @org_id, 3, @admin_user_id),
('Emma', 'Wilson', 'emma.wilson@enterprise.com', 'Director of IT', 'Enterprise Solutions', 'Enterprise', 'Toronto', 'Canada', @demo_user_id, @org_id, 1, @admin_user_id),
('David', 'Lee', 'david.lee@consulting.com', 'Principal', 'Lee Consulting', 'Consulting', 'Singapore', 'Singapore', @demo_user_id, @org_id, 4, @admin_user_id);

-- Insert sample settings
INSERT INTO `settings` (`organization_id`, `setting_key`, `setting_value`, `setting_type`, `is_public`) VALUES
(@org_id, 'company_name', 'LeadLab Demo', 'string', true),
(@org_id, 'default_timezone', 'UTC', 'string', true),
(@org_id, 'enable_linkedin_integration', 'true', 'boolean', false),
(@org_id, 'enable_ai_insights', 'true', 'boolean', false),
(@org_id, 'max_leads_per_user', '1000', 'number', false);

-- --------------------------------------------------------
-- Create Indexes for Performance
-- --------------------------------------------------------

-- Composite indexes for common queries
CREATE INDEX `idx_leads_org_stage` ON `leads` (`organization_id`, `stage_id`);
CREATE INDEX `idx_leads_user_created` ON `leads` (`user_id`, `created_at`);
CREATE INDEX `idx_ai_insights_org_created` ON `ai_insights` (`organization_id`, `created_at`);
CREATE INDEX `idx_activities_lead_type` ON `activities` (`lead_id`, `activity_type`);

-- Full-text search indexes
ALTER TABLE `leads` ADD FULLTEXT(`first_name`, `last_name`, `company`, `job_title`);

-- --------------------------------------------------------
-- Views for Common Queries
-- --------------------------------------------------------

-- Lead summary view
CREATE OR REPLACE VIEW `lead_summary` AS
SELECT 
    l.id,
    l.first_name,
    l.last_name,
    l.email,
    l.company,
    l.job_title,
    ls.name as stage_name,
    ls.color as stage_color,
    u.first_name as owner_first_name,
    u.last_name as owner_last_name,
    l.created_at,
    l.updated_at,
    (SELECT COUNT(*) FROM notes WHERE lead_id = l.id) as notes_count,
    (SELECT COUNT(*) FROM activities WHERE lead_id = l.id) as activities_count
FROM leads l
JOIN lead_stages ls ON l.stage_id = ls.id
JOIN users u ON l.user_id = u.id
WHERE l.is_deleted = false;

-- AI insights summary view
CREATE OR REPLACE VIEW `ai_insights_summary` AS
SELECT 
    ai.lead_id,
    ai.personality_type,
    ai.disc_profile,
    ai.quality_score,
    ai.confidence_score,
    ai.communication_style,
    ai.updated_at as last_analysis
FROM ai_insights ai
WHERE ai.analysis_type = 'psychometric';

-- --------------------------------------------------------
-- Stored Procedures
-- --------------------------------------------------------

DELIMITER //

-- Procedure to get lead with AI insights
CREATE PROCEDURE GetLeadWithInsights(IN p_lead_id INT)
BEGIN
    SELECT 
        l.*,
        ls.name as stage_name,
        ls.color as stage_color,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        ai.personality_type,
        ai.disc_profile,
        ai.quality_score,
        ai.confidence_score
    FROM leads l
    JOIN lead_stages ls ON l.stage_id = ls.id
    JOIN users u ON l.user_id = u.id
    LEFT JOIN ai_insights ai ON l.id = ai.lead_id AND ai.analysis_type = 'psychometric'
    WHERE l.id = p_lead_id AND l.is_deleted = false;
END //

-- Procedure to update lead stage
CREATE PROCEDURE UpdateLeadStage(IN p_lead_id INT, IN p_stage_id INT, IN p_user_id INT)
BEGIN
    UPDATE leads SET stage_id = p_stage_id, updated_at = CURRENT_TIMESTAMP WHERE id = p_lead_id;
    
    INSERT INTO activities (lead_id, user_id, organization_id, activity_type, title, description)
    SELECT p_lead_id, p_user_id, organization_id, 'note', 'Stage Updated', 
           CONCAT('Lead stage updated to ', (SELECT name FROM lead_stages WHERE id = p_stage_id))
    FROM leads WHERE id = p_lead_id;
END //

DELIMITER ;

-- --------------------------------------------------------
-- Triggers
-- --------------------------------------------------------

DELIMITER //

-- Trigger to create activity when lead is created
CREATE TRIGGER after_lead_insert
AFTER INSERT ON leads
FOR EACH ROW
BEGIN
    INSERT INTO activities (lead_id, user_id, organization_id, activity_type, title, description)
    VALUES (NEW.id, NEW.created_by, NEW.organization_id, 'note', 'Lead Created', 'New lead added to the system');
END //

-- Trigger to update lead updated_at when notes are added
CREATE TRIGGER after_note_insert
AFTER INSERT ON notes
FOR EACH ROW
BEGIN
    UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.lead_id;
END //

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Final Setup
-- --------------------------------------------------------

-- Update auto increment values
ALTER TABLE organizations AUTO_INCREMENT = 1000;
ALTER TABLE users AUTO_INCREMENT = 1000;
ALTER TABLE leads AUTO_INCREMENT = 10000;
ALTER TABLE lead_stages AUTO_INCREMENT = 100;
ALTER TABLE ai_insights AUTO_INCREMENT = 10000;
ALTER TABLE activities AUTO_INCREMENT = 10000;
ALTER TABLE notes AUTO_INCREMENT = 10000;
ALTER TABLE tags AUTO_INCREMENT = 100;

-- Optimize tables
OPTIMIZE TABLE organizations, users, leads, lead_stages, ai_insights, activities, notes, tags, lead_tags, linkedin_connections, settings;

-- --------------------------------------------------------
-- Database Information
-- --------------------------------------------------------

SELECT 'LeadLab Database Schema Created Successfully!' as Status;
SELECT VERSION() as MySQL_Version;
SELECT DATABASE() as Current_Database;
SELECT COUNT(*) as Total_Tables FROM information_schema.tables WHERE table_schema = DATABASE();

-- Show default login credentials
SELECT 'Default Login Credentials:' as Info;
SELECT 'Email: admin@the-leadlab.com, Password: admin123' as Admin_Login;
SELECT 'Email: demo@the-leadlab.com, Password: demo123' as Demo_Login; 