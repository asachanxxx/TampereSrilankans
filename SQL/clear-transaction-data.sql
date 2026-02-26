-- =====================================================
-- clear-transaction-data.sql
-- =====================================================
-- Removes ALL transaction data (registrations + tickets)
-- while preserving master records:
--   ✓ profiles        (user accounts)
--   ✓ events          (event definitions & payment instructions)
--   ✓ permissions     (system reference data)
--   ✓ role_permissions (system reference data)
--
-- Safe to run multiple times (idempotent).
-- Run in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql
-- =====================================================

-- Tickets must be deleted before registrations because there is
-- no FK between them, but deleting both ensures a clean slate.
-- RESTART IDENTITY resets any serial sequences (none here — UUIDs used).
-- CASCADE handles any future child tables automatically.

TRUNCATE TABLE tickets              RESTART IDENTITY CASCADE;
TRUNCATE TABLE event_registrations  RESTART IDENTITY CASCADE;
