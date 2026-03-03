-- ============================================================
-- 03-app-config.sql
-- Creates the app_config table for runtime configuration values.
-- Run this in the Supabase SQL editor (production).
-- ============================================================

CREATE TABLE IF NOT EXISTS app_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can read config
CREATE POLICY "Public read app_config"
  ON app_config FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "Admin write app_config"
  ON app_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Seed default values
INSERT INTO app_config (key, value, description)
VALUES
  (
    'children_age_threshold',
    '7',
    'Age boundary separating younger and older children in event registrations. Labels show "Children Under N" and "Children N+" in forms.'
  ),
  (
    'ticket_base_url',
    'https://ingenious-bravery-production-2f4e.up.railway.app',
    'Base URL used to build ticket links shown to users after registration.'
  ),
  (
    'ticket_save_message',
    'Save your ticket number — you will need it when boarding the event.',
    'Message shown in the Registration Successful dialog reminding users to save their ticket number.'
  )
ON CONFLICT (key) DO NOTHING;
