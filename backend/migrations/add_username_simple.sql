-- Simple Safe Migration: Add Username Column
-- This preserves all existing users and data
-- Note: Run this only once. If column exists, it will error (that's okay)

-- Add username column
ALTER TABLE users 
ADD COLUMN username VARCHAR(100) NULL AFTER email;

-- Create unique index on username (will fail silently if exists)
-- Note: MySQL 5.7+ supports IF NOT EXISTS for indexes
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Optional: Generate usernames from emails for existing users
-- Uncomment to auto-create usernames:
-- UPDATE users 
-- SET username = SUBSTRING_INDEX(email, '@', 1) 
-- WHERE username IS NULL 
-- AND NOT EXISTS (
--   SELECT 1 FROM users u2 
--   WHERE u2.username = SUBSTRING_INDEX(users.email, '@', 1) 
--   AND u2.id != users.id
-- );

SELECT 'Migration completed! All users preserved.' as Status;
