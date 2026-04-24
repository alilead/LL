-- WARNING:
-- Run this manually on production only after backup.
-- This script keeps ali@the-leadlab.com as the only active login and grants full admin rights.

BEGIN;

-- 1) Ensure Ali exists and has full platform access.
UPDATE users
SET
  role = 'admin',
  is_superuser = TRUE,
  is_active = TRUE,
  updated_at = NOW()
WHERE LOWER(email) = 'ali@the-leadlab.com';

-- 2) Disable all other users so only Ali can access the platform.
UPDATE users
SET
  is_active = FALSE,
  updated_at = NOW()
WHERE LOWER(email) <> 'ali@the-leadlab.com';

-- 3) Remove non-Ali email integrations/accounts from app tables.
DELETE FROM email_accounts
WHERE LOWER(email_address) <> 'ali@the-leadlab.com';

-- Optional hard-delete (uncomment only if you really want physical deletion and FK constraints allow it):
-- DELETE FROM users WHERE LOWER(email) <> 'ali@the-leadlab.com';

COMMIT;
