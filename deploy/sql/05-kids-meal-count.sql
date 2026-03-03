-- Migration: Add kids_meal_count column to event_registrations
-- Run this against existing databases that were created before this field was added.

ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS kids_meal_count INT NOT NULL DEFAULT 0;
