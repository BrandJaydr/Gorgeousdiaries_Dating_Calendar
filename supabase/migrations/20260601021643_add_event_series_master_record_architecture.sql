/*
  # Event Series Foundation (Master Record Architecture)

  ## Summary
  Implements the series/occurrence data model recommended for convention intelligence
  at scale. A series record represents a recurring event brand (e.g. "DEF CON").
  Individual year/occurrence records in the events table link back to the series via
  series_id. All existing events receive series_id = null, preserving full backward
  compatibility.

  ## New Table: `event_series`
  The master brand record for a recurring event. Contains stable identity information
  that does not change year-over-year: the name, organizer, website, founding year,
  and how frequently the event occurs.

  ### Columns
  - `id` (uuid, PK)
  - `name` (text, unique) — brand name e.g. "DEF CON"
  - `slug` (text, unique) — URL-safe e.g. "def-con"
  - `description` (text, nullable) — about the brand
  - `organizer_name` (text, nullable) — primary organizing entity
  - `organizer_id` (uuid, nullable FK → users.id) — platform account if exists
  - `website` (text, nullable) — canonical brand URL
  - `image_url` (text, nullable) — brand logo or representative image
  - `category_id` (uuid, nullable FK → event_categories.id) — structural type
  - `founded_year` (int, nullable) — year the event brand was established
  - `frequency` (text) — enum: annual, biannual, monthly, irregular
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Modified `events` Table
  - `series_id` (uuid, nullable FK → event_series.id, SET NULL on delete) — links an
    occurrence to its brand. Null means a standalone event with no series affiliation.

  ## Security
  - RLS enabled on event_series
  - Authenticated users can read series records (for discovery UI)
  - Only admins can create/update/delete series records
  - series_id on events inherits existing events RLS

  ## Notes
  1. series_id is nullable so all existing events remain valid.
  2. ON DELETE SET NULL means deleting a series record does not cascade-delete events.
  3. The frequency enum is stored as text with a check constraint for flexibility —
     adding new values (e.g. "quarterly") requires only a constraint change not a type migration.
  4. updated_at is managed by a trigger for automatic timestamp maintenance.
*/

-- Create event_series table
CREATE TABLE IF NOT EXISTS event_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  organizer_name text,
  organizer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  website text,
  image_url text,
  category_id uuid REFERENCES event_categories(id) ON DELETE SET NULL,
  founded_year int,
  frequency text NOT NULL DEFAULT 'annual'
    CHECK (frequency IN ('annual', 'biannual', 'monthly', 'irregular')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read event series"
  ON event_series FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert event series"
  ON event_series FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update event series"
  ON event_series FOR UPDATE
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

CREATE POLICY "Admins can delete event series"
  ON event_series FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- Auto-update updated_at on event_series
CREATE OR REPLACE FUNCTION update_event_series_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_event_series_updated_at ON event_series;
CREATE TRIGGER set_event_series_updated_at
  BEFORE UPDATE ON event_series
  FOR EACH ROW
  EXECUTE FUNCTION update_event_series_updated_at();

-- Add series_id FK to events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'series_id'
  ) THEN
    ALTER TABLE events
      ADD COLUMN series_id uuid REFERENCES event_series(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for efficient series occurrence lookups
CREATE INDEX IF NOT EXISTS idx_events_series_id ON events(series_id)
  WHERE series_id IS NOT NULL;
