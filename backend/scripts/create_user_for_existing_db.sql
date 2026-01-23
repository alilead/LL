-- Create New MySQL User for Existing Database
-- This preserves all existing data and users
-- Run this as MySQL root user

-- Create new MySQL user
CREATE USER IF NOT EXISTS 'leadlab_user'@'localhost' IDENTIFIED BY 'LeadLab123!';

-- Grant access to EXISTING database (preserves all data)
-- Change 'leadlab_db' to your actual database name if different
GRANT ALL PRIVILEGES ON leadlab_db.* TO 'leadlab_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify user was created
SELECT 'User created successfully!' as Status;
SELECT User, Host FROM mysql.user WHERE User = 'leadlab_user';
SELECT 'User can now access existing database: leadlab_db' as Note;
SELECT 'All existing users and data are preserved!' as Important;
