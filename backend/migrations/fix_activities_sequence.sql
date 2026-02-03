-- Fix activities table auto-increment sequence
-- This script resets the sequence for the activities.id column to the max id + 1

-- For PostgreSQL
SELECT setval('activities_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM activities));