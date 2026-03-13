-- Fix organizations table primary key sequence
-- Run this when you see: duplicate key value violates unique constraint "organizations_pkey"
-- (Key (id)=(N) already exists) during account creation or organization creation.
-- The sequence got out of sync (e.g. after seeds or restores); this resets it.

-- PostgreSQL: reset organizations.id sequence to next free value
SELECT setval(
  pg_get_serial_sequence('organizations', 'id'),
  COALESCE((SELECT MAX(id) FROM organizations), 0)
);
