-- Migration 06: Add 'not_coming' and 'paid_bonus' to payment_status CHECK constraint
-- Run this against your Supabase production database.
-- Safe: no row data is changed, only the constraint is replaced.

ALTER TABLE tickets
  DROP CONSTRAINT IF EXISTS tickets_payment_status_check;

ALTER TABLE tickets
  ADD CONSTRAINT tickets_payment_status_check
  CHECK (payment_status IN ('payment_sent', 'paid', 'paid_bonus', 'not_coming'));
