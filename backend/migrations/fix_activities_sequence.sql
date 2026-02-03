-- Fix activities table auto-increment sequence (UniqueViolation on activities_pkey)
-- Run this if you see: Key (id)=(N) already exists / activities_pkey
-- Resets the sequence for activities.id to max(id)+1 so new inserts get unique IDs.

-- Option A: Use pg_get_serial_sequence (recommended)
SELECT setval(pg_get_serial_sequence('activities', 'id'), COALESCE((SELECT MAX(id) FROM activities), 1));

-- Option B: If sequence name is exactly activities_id_seq
-- SELECT setval('activities_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM activities));