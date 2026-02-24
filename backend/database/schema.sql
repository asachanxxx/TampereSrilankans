-- =====================================================
-- Event Management App - Database Schema
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/_/sql

-- =====================================================
-- 1. Create profiles table
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'member', 'moderator', 'organizer', 'admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: add email column if upgrading from older schema
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 2. Create permissions tables
-- =====================================================

-- All available permissions in the system
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,               -- e.g. 'events:create'
  category TEXT NOT NULL,            -- e.g. 'events', 'users'
  description TEXT NOT NULL
);

-- Role → permission mapping (source of truth for access control)
CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT NOT NULL CHECK (role IN ('user', 'member', 'organizer', 'moderator', 'admin')),
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_id)
);

-- Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read permissions (needed for frontend checks)
CREATE POLICY "Anyone can read permissions"
  ON permissions FOR SELECT USING (true);

CREATE POLICY "Anyone can read role_permissions"
  ON role_permissions FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage permissions"
  ON permissions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage role_permissions"
  ON role_permissions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed: all available permissions
INSERT INTO permissions (id, category, description) VALUES
  ('events:view_private',      'events',        'View private/hidden events'),
  ('events:create',            'events',        'Create new events'),
  ('events:edit',              'events',        'Edit any event'),
  ('events:delete',            'events',        'Delete any event'),
  ('registrations:view_all',   'registrations', 'View all users'' registrations'),
  ('tickets:view_all',         'tickets',       'View all tickets'),
  ('users:manage',             'users',         'Manage user roles'),
  ('permissions:manage',       'permissions',   'Manage role permissions')
ON CONFLICT (id) DO NOTHING;

-- Seed: default role → permission assignments
INSERT INTO role_permissions (role, permission_id) VALUES
  -- organizer
  ('organizer', 'events:create'),
  ('organizer', 'events:edit'),
  -- moderator
  ('moderator', 'events:view_private'),
  ('moderator', 'events:create'),
  ('moderator', 'events:edit'),
  ('moderator', 'events:delete'),
  ('moderator', 'registrations:view_all'),
  ('moderator', 'tickets:view_all'),
  -- admin (all)
  ('admin', 'events:view_private'),
  ('admin', 'events:create'),
  ('admin', 'events:edit'),
  ('admin', 'events:delete'),
  ('admin', 'registrations:view_all'),
  ('admin', 'tickets:view_all'),
  ('admin', 'users:manage'),
  ('admin', 'permissions:manage')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. Create events table
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  event_date DATE NOT NULL,
  rating_average NUMERIC(3,2) CHECK (rating_average >= 0 AND rating_average <= 5),
  rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0),
  status_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  visibility_id TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location_name TEXT,
  city TEXT,
  cover_image_url TEXT,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  about_section_title TEXT,
  organizer_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Public events are viewable by everyone"
  ON events FOR SELECT
  USING (visibility_id = 'public');

CREATE POLICY "Admins can view all events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update events"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete events"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 4. Create event_registrations table
-- =====================================================
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT NOT NULL,
  spouse_name TEXT,
  children_under_7_count INT NOT NULL DEFAULT 0,
  children_over_7_count INT NOT NULL DEFAULT 0,
  children_names_and_ages TEXT,
  vegetarian_meal_count INT NOT NULL DEFAULT 0,
  non_vegetarian_meal_count INT NOT NULL DEFAULT 0,
  other_preferences TEXT,
  consent_to_store_personal_data BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_registrations
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Event registrations policies
CREATE POLICY "Users can register themselves"
  ON event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own registrations"
  ON event_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations"
  ON event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own registrations"
  ON event_registrations FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. Create tickets table
-- =====================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  issued_to_name TEXT NOT NULL DEFAULT '',
  issued_to_email TEXT NOT NULL DEFAULT '',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Tickets policies
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert tickets"
  ON tickets FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 6. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_events_visibility ON events(visibility_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);

-- =====================================================
-- 7. Create trigger to auto-create profile
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 8. Create your first admin user (OPTIONAL)
-- =====================================================
-- After signing up via the app, run this to make yourself admin:
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id-here';

-- =====================================================
-- 9. Setup Complete!
-- =====================================================
-- Next steps:
-- 1. Enable Email auth in Supabase Dashboard > Authentication > Providers
-- 2. Configure OAuth providers (Google, Facebook) if needed
-- 3. Set up redirect URLs in OAuth settings
-- 4. Copy your project URL and API keys to .env.local
-- =====================================================
