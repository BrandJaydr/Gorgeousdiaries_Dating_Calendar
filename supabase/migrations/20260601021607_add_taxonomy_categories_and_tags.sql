/*
  # Two-Tier Taxonomy: Event Categories and Tags

  ## Summary
  Introduces a two-dimensional classification system that runs alongside the existing
  genres system. Genres describe content (Jazz, Hip Hop, Boxing). Categories describe
  event structure (Convention, Conference, Festival). Tags describe topics and communities
  (AI, Cybersecurity, Gaming). All three dimensions can coexist on a single event.

  ## New Tables

  ### `event_categories`
  Controlled vocabulary for structural event types. Single-select per event.
  - `id` (uuid, PK)
  - `name` (text, unique) — display name e.g. "Convention"
  - `slug` (text, unique) — URL-safe identifier e.g. "convention"
  - `description` (text, nullable) — brief explanation
  - `icon_name` (text, nullable) — lucide-react icon name
  - `color` (text) — hex color for UI badges
  - `sort_order` (int) — controls display ordering
  - `created_at` (timestamptz)

  ### `tags`
  Controlled vocabulary for topic/community domains. Many-to-many per event.
  - `id` (uuid, PK)
  - `name` (text, unique) — display name e.g. "Cybersecurity"
  - `slug` (text, unique) — URL-safe identifier
  - `description` (text, nullable)
  - `domain` (text) — grouping: technology, lifestyle, entertainment, business, science, social
  - `created_at` (timestamptz)

  ### `event_tags`
  Junction table linking events to tags (many-to-many).
  - `event_id` (uuid, FK → events.id, cascade delete)
  - `tag_id` (uuid, FK → tags.id, cascade delete)

  ## Modified `events` Table
  - `category_id` (uuid, nullable FK → event_categories.id) — single event category

  ## Seed Data
  - 10 event categories from the specification
  - 13 topic tags from the specification

  ## Security
  - RLS enabled on all new tables
  - Public users can read categories and tags (needed for filter UI)
  - Only admins can insert/update/delete categories and tags
  - event_tags follows the same access pattern as event_genres
*/

-- Create event_categories table
CREATE TABLE IF NOT EXISTS event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon_name text,
  color text NOT NULL DEFAULT '#6B7280',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read event categories"
  ON event_categories FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert event categories"
  ON event_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update event categories"
  ON event_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete event categories"
  ON event_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  domain text NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tags"
  ON tags FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete tags"
  ON tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- Create event_tags junction table
CREATE TABLE IF NOT EXISTS event_tags (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read event tags"
  ON event_tags FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Organizers and admins can insert event tags"
  ON event_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
        AND (
          events.organizer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
          )
        )
    )
  );

CREATE POLICY "Organizers and admins can delete event tags"
  ON event_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
        AND (
          events.organizer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
          )
        )
    )
  );

-- Add category_id FK to events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE events
      ADD COLUMN category_id uuid REFERENCES event_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Seed event categories
INSERT INTO event_categories (name, slug, description, icon_name, color, sort_order) VALUES
  ('Convention',   'convention',   'Large multi-day fan or industry gatherings',      'users',         '#0EA5E9', 1),
  ('Conference',   'conference',   'Professional or academic speaking events',         'presentation',  '#3B82F6', 2),
  ('Expo',         'expo',         'Trade shows and exhibition floors',                'layout',        '#06B6D4', 3),
  ('Festival',     'festival',     'Multi-act cultural or music celebrations',         'music',         '#10B981', 4),
  ('Meetup',       'meetup',       'Casual community gatherings',                      'coffee',        '#F59E0B', 5),
  ('Webinar',      'webinar',      'Online-only educational sessions',                 'monitor',       '#8B5CF6', 6),
  ('Networking',   'networking',   'Professional networking and mixer events',         'share-2',       '#EC4899', 7),
  ('Workshop',     'workshop',     'Hands-on skill-building sessions',                 'tool',          '#F97316', 8),
  ('Competition',  'competition',  'Contests, tournaments, and championships',         'trophy',        '#EF4444', 9),
  ('Concert',      'concert',      'Live music performances',                          'headphones',    '#14B8A6', 10)
ON CONFLICT (slug) DO NOTHING;

-- Seed tags
INSERT INTO tags (name, slug, description, domain) VALUES
  ('AI',            'ai',            'Artificial intelligence and machine learning',        'technology'),
  ('Cybersecurity', 'cybersecurity', 'Information security, hacking, and privacy',         'technology'),
  ('Dating',        'dating',        'Dating, relationships, and social skills',            'social'),
  ('Psychology',    'psychology',    'Mental health, behavioral science, and therapy',      'science'),
  ('Gaming',        'gaming',        'Video games, board games, and esports',               'entertainment'),
  ('Anime',         'anime',         'Japanese animation, manga, and culture',              'entertainment'),
  ('Comics',        'comics',        'Comic books, graphic novels, and illustration',       'entertainment'),
  ('Business',      'business',      'Entrepreneurship, startups, and operations',          'business'),
  ('Technology',    'technology',    'General tech trends and software development',        'technology'),
  ('Marketing',     'marketing',     'Digital marketing, branding, and growth',             'business'),
  ('Science',       'science',       'Scientific research, STEM, and innovation',           'science'),
  ('Politics',      'politics',      'Government, policy, and civic engagement',            'social'),
  ('Finance',       'finance',       'Personal finance, investing, and economics',          'business')
ON CONFLICT (slug) DO NOTHING;
