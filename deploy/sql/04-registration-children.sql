-- ============================================================
-- 04-registration-children.sql
-- Creates the registration_children table for structured child data.
-- Run this in the Supabase SQL editor (production).
-- ============================================================

CREATE TABLE IF NOT EXISTS registration_children (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  child_name  TEXT NOT NULL,
  child_age   INT  NOT NULL CHECK (child_age >= 0 AND child_age <= 18),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registration_children_ticket_id
  ON registration_children(ticket_id);

-- Row Level Security
ALTER TABLE registration_children ENABLE ROW LEVEL SECURITY;

-- Service role (used during registration) can insert
-- Admins can read/write all rows; owners can read their own via ticket
CREATE POLICY "Admin full access registration_children"
  ON registration_children FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'moderator', 'organizer')
    )
  );

-- Allow inserts by service role (bypasses RLS — used in registration flow)
-- Note: guest registrations use the service role client which bypasses RLS entirely.

-- Keep children_names_and_ages on event_registrations for backward compatibility
-- (existing data remains readable; new registrations use this table instead)
