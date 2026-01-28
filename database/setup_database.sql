-- LeadLab Database Setup
-- Run this on your MySQL server to create the database and initial data

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS leadlab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE leadlab;

-- Organizations table
DROP TABLE IF EXISTS organizations;
CREATE TABLE organizations (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  description text,
  website varchar(255),
  industry varchar(100),
  size enum('startup','small','medium','large','enterprise') DEFAULT 'small',
  status enum('active','inactive','trial') DEFAULT 'active',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Users table
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id int(11) NOT NULL AUTO_INCREMENT,
  email varchar(255) NOT NULL UNIQUE,
  hashed_password varchar(255) NOT NULL,
  first_name varchar(100),
  last_name varchar(100),
  is_active boolean NOT NULL DEFAULT true,
  is_superuser boolean NOT NULL DEFAULT false,
  organization_id int(11) NOT NULL,
  role enum('admin','manager','user','viewer') DEFAULT 'user',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_users_organization (organization_id),
  CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Lead stages table
DROP TABLE IF EXISTS lead_stages;
CREATE TABLE lead_stages (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  description text,
  color varchar(7) DEFAULT '#3B82F6',
  order_index int(11) NOT NULL DEFAULT 0,
  organization_id int(11) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_lead_stages_organization (organization_id),
  CONSTRAINT fk_lead_stages_organization FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Leads table
DROP TABLE IF EXISTS leads;
CREATE TABLE leads (
  id int(11) NOT NULL AUTO_INCREMENT,
  first_name varchar(100),
  last_name varchar(100),
  email varchar(255),
  phone varchar(50),
  mobile varchar(50),
  job_title varchar(255),
  company varchar(200),
  industry varchar(100),
  sector varchar(200),
  website varchar(500),
  linkedin varchar(500),
  location varchar(200),
  country varchar(100),
  time_in_current_role varchar(100),
  est_wealth_experience varchar(255),
  unique_lead_id varchar(100),
  wpi varchar(50),
  lab_comments text,
  client_comments text,
  psychometrics json,
  source varchar(100),
  user_id int(11) NOT NULL,
  organization_id int(11) NOT NULL,
  stage_id int(11) NOT NULL,
  created_by int(11) NOT NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_leads_email (email),
  KEY idx_leads_company (company),
  KEY fk_leads_user (user_id),
  KEY fk_leads_organization (organization_id),
  KEY fk_leads_stage (stage_id),
  CONSTRAINT fk_leads_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_leads_organization FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT fk_leads_stage FOREIGN KEY (stage_id) REFERENCES lead_stages (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AI insights table
DROP TABLE IF EXISTS ai_insights;
CREATE TABLE ai_insights (
  id int(11) NOT NULL AUTO_INCREMENT,
  lead_id int(11) NOT NULL,
  user_id int(11) NOT NULL,
  organization_id int(11) NOT NULL,
  analysis_type varchar(50) NOT NULL DEFAULT 'psychometric',
  quality_score decimal(5,2) DEFAULT 0.00,
  priority_score decimal(5,2) DEFAULT 0.00,
  confidence_score decimal(3,2) DEFAULT 0.00,
  personality_type varchar(20),
  disc_profile varchar(50),
  communication_style varchar(100),
  strengths json,
  recommendations json,
  sales_approach varchar(500),
  features_used int(11) DEFAULT 1,
  ai_model_version varchar(50) DEFAULT 'internal_v1.0',
  analysis_provider varchar(100) DEFAULT 'internal',
  raw_data json,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_lead_analysis (lead_id, analysis_type),
  KEY fk_ai_insights_lead (lead_id),
  CONSTRAINT fk_ai_insights_lead FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert demo organization
INSERT INTO organizations (name, slug, description, industry, size, status) VALUES
('LeadLab Demo', 'leadlab-demo', 'Demo organization for LeadLab platform', 'Technology', 'startup', 'active');

SET @org_id = LAST_INSERT_ID();

-- Insert demo users (password hash for 'admin123')
INSERT INTO users (email, hashed_password, first_name, last_name, is_active, is_superuser, organization_id, role) VALUES
('admin@the-leadlab.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Admin', 'User', true, true, @org_id, 'admin'),
('demo@the-leadlab.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Demo', 'User', true, false, @org_id, 'user');

SET @admin_user_id = (SELECT id FROM users WHERE email = 'admin@the-leadlab.com');
SET @demo_user_id = (SELECT id FROM users WHERE email = 'demo@the-leadlab.com');

-- Insert lead stages
INSERT INTO lead_stages (name, description, color, order_index, organization_id) VALUES
('New Lead', 'Newly acquired leads', '#3B82F6', 1, @org_id),
('Contacted', 'Initial contact made', '#F59E0B', 2, @org_id),
('Qualified', 'Lead has been qualified', '#10B981', 3, @org_id),
('Proposal', 'Proposal sent to lead', '#8B5CF6', 4, @org_id),
('Negotiation', 'In negotiation phase', '#F97316', 5, @org_id),
('Closed Won', 'Successfully closed', '#059669', 6, @org_id),
('Closed Lost', 'Lead was lost', '#DC2626', 7, @org_id);

-- Insert sample leads for demo
INSERT INTO leads (first_name, last_name, email, job_title, company, industry, location, country, linkedin, user_id, organization_id, stage_id, created_by) VALUES
('John', 'Smith', 'john.smith@techcorp.com', 'Chief Technology Officer', 'TechCorp Inc', 'Technology', 'San Francisco, CA', 'USA', 'https://linkedin.com/in/johnsmith', @demo_user_id, @org_id, 1, @admin_user_id),
('Sarah', 'Johnson', 'sarah.j@innovations.com', 'VP of Sales', 'Innovations Ltd', 'Software', 'London', 'UK', 'https://linkedin.com/in/sarahjohnson', @demo_user_id, @org_id, 2, @admin_user_id),
('Michael', 'Brown', 'mbrown@startup.io', 'Founder & CEO', 'Brown Startup', 'Fintech', 'New York, NY', 'USA', 'https://linkedin.com/in/michaelbrown', @demo_user_id, @org_id, 3, @admin_user_id),
('Emma', 'Wilson', 'emma.wilson@enterprise.com', 'Director of IT', 'Enterprise Solutions', 'Enterprise', 'Toronto', 'Canada', 'https://linkedin.com/in/emmawilson', @demo_user_id, @org_id, 1, @admin_user_id),
('David', 'Lee', 'david.lee@consulting.com', 'Principal Consultant', 'Lee Consulting', 'Consulting', 'Singapore', 'Singapore', 'https://linkedin.com/in/davidlee', @demo_user_id, @org_id, 4, @admin_user_id);

SET FOREIGN_KEY_CHECKS = 1;

-- Success message
SELECT 'LeadLab Database Setup Complete!' as Status;
SELECT 'Admin Login: admin@the-leadlab.com / Password: admin123' as AdminCredentials;
SELECT 'Demo Login: demo@the-leadlab.com / Password: admin123' as DemoCredentials; 