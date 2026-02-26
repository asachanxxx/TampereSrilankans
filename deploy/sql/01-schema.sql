-- =====================================================
-- 01-schema.sql  —  Full Database Schema
-- =====================================================
-- Run this FIRST in your new Supabase project.
-- Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql
--
-- This file is the complete schema including all
-- migrations. It is safe to re-run (uses IF NOT EXISTS).
-- =====================================================


-- =====================================================
-- 1. profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email        TEXT,
  role         TEXT NOT NULL
                 CHECK (role IN ('user','member','moderator','organizer','admin'))
                 DEFAULT 'user',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- =====================================================
-- 2. permissions & role_permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
  id          TEXT PRIMARY KEY,
  category    TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role          TEXT NOT NULL
                  CHECK (role IN ('user','member','organizer','moderator','admin')),
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_id)
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read permissions"
  ON permissions FOR SELECT USING (true);

CREATE POLICY "Anyone can read role_permissions"
  ON role_permissions FOR SELECT USING (true);

CREATE POLICY "Admins can manage permissions"
  ON permissions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage role_permissions"
  ON role_permissions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed permissions
INSERT INTO permissions (id, category, description) VALUES
  ('events:view_private',    'events',        'View private/hidden events'),
  ('events:create',          'events',        'Create new events'),
  ('events:edit',            'events',        'Edit any event'),
  ('events:delete',          'events',        'Delete any event'),
  ('registrations:view_all', 'registrations', 'View all users'' registrations'),
  ('tickets:view_all',       'tickets',       'View all tickets'),
  ('tickets:manage',         'tickets',       'Assign tickets and manage payment lifecycle'),
  ('tickets:board',          'tickets',       'Mark tickets as boarded at event entrance'),
  ('users:manage',           'users',         'Manage user roles'),
  ('permissions:manage',     'permissions',   'Manage role permissions')
ON CONFLICT (id) DO NOTHING;

-- Seed role → permission assignments
INSERT INTO role_permissions (role, permission_id) VALUES
  -- organizer
  ('organizer', 'events:create'),
  ('organizer', 'events:edit'),
  ('organizer', 'tickets:manage'),
  ('organizer', 'tickets:board'),
  -- moderator
  ('moderator', 'events:view_private'),
  ('moderator', 'events:create'),
  ('moderator', 'events:edit'),
  ('moderator', 'events:delete'),
  ('moderator', 'registrations:view_all'),
  ('moderator', 'tickets:view_all'),
  ('moderator', 'tickets:manage'),
  ('moderator', 'tickets:board'),
  -- admin (all)
  ('admin', 'events:view_private'),
  ('admin', 'events:create'),
  ('admin', 'events:edit'),
  ('admin', 'events:delete'),
  ('admin', 'registrations:view_all'),
  ('admin', 'tickets:view_all'),
  ('admin', 'tickets:manage'),
  ('admin', 'tickets:board'),
  ('admin', 'users:manage'),
  ('admin', 'permissions:manage')
ON CONFLICT DO NOTHING;


-- =====================================================
-- 3. events
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT NOT NULL,
  subtitle             TEXT,
  event_date           DATE NOT NULL,
  rating_average       NUMERIC(3,2) CHECK (rating_average >= 0 AND rating_average <= 5),
  rating_count         INTEGER DEFAULT 0 CHECK (rating_count >= 0),
  status_id            TEXT NOT NULL,
  category_id          TEXT NOT NULL,
  visibility_id        TEXT NOT NULL,
  start_at             TIMESTAMPTZ NOT NULL,
  end_at               TIMESTAMPTZ,
  location_name        TEXT,
  city                 TEXT,
  cover_image_url      TEXT,
  short_description    TEXT NOT NULL,
  description          TEXT NOT NULL,
  about_section_title  TEXT,
  organizer_name       TEXT NOT NULL,
  payment_instructions JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public events are viewable by everyone"
  ON events FOR SELECT USING (visibility_id = 'public');

CREATE POLICY "Admins can view all events"
  ON events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Only admins can insert events"
  ON events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Only admins can update events"
  ON events FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Only admins can delete events"
  ON events FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- =====================================================
-- 4. event_registrations
-- =====================================================
CREATE TABLE IF NOT EXISTS event_registrations (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id                       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  registered_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name                     TEXT NOT NULL,
  whatsapp_number               TEXT,
  email                         TEXT NOT NULL,
  spouse_name                   TEXT,
  children_under_7_count        INT NOT NULL DEFAULT 0,
  children_over_7_count         INT NOT NULL DEFAULT 0,
  children_names_and_ages       TEXT,
  vegetarian_meal_count         INT NOT NULL DEFAULT 0,
  non_vegetarian_meal_count     INT NOT NULL DEFAULT 0,
  other_preferences             TEXT,
  consent_to_store_personal_data BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can register themselves"
  ON event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own registrations"
  ON event_registrations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations"
  ON event_registrations FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can delete own registrations"
  ON event_registrations FOR DELETE USING (auth.uid() = user_id);

-- Guest uniqueness: one registration per email per event for anonymous users
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_guest_email
  ON event_registrations(event_id, email) WHERE user_id IS NULL;


-- =====================================================
-- 5. tickets  (with full lifecycle columns)
-- =====================================================
CREATE TABLE IF NOT EXISTS tickets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ticket_number    TEXT NOT NULL UNIQUE,
  issued_to_name   TEXT NOT NULL DEFAULT '',
  issued_to_email  TEXT NOT NULL DEFAULT '',
  issued_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Lifecycle: assignment
  assigned_to_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at      TIMESTAMPTZ,

  -- Lifecycle: payment
  payment_status   TEXT CHECK (payment_status IN ('payment_sent','paid')),
  payment_sent_at  TIMESTAMPTZ,
  paid_at          TIMESTAMPTZ,

  -- Lifecycle: boarding
  boarding_status  TEXT CHECK (boarding_status IN ('boarded')),
  boarded_at       TIMESTAMPTZ,
  boarded_by_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view ticket by number"
  ON tickets FOR SELECT USING (true);

CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "System can insert tickets"
  ON tickets FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update ticket lifecycle"
  ON tickets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('organizer','moderator','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('organizer','moderator','admin')
  ));


-- =====================================================
-- 6. Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_events_visibility        ON events(visibility_id);
CREATE INDEX IF NOT EXISTS idx_events_status            ON events(status_id);
CREATE INDEX IF NOT EXISTS idx_events_category          ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_date              ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_registrations_user       ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event      ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user             ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event            ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_number           ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to      ON tickets(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tickets_payment_status   ON tickets(payment_status);
CREATE INDEX IF NOT EXISTS idx_tickets_boarding_status  ON tickets(boarding_status);


-- =====================================================
-- 7. Trigger: auto-create profile on signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =====================================================
-- Done! Run 02-set-admin.sql next to create your
-- first admin user after signing up in the app.
-- =====================================================
