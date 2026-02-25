/*
  # Add User Preferences and Fix Event RLS

  1. New Tables
    - `user_preferences`
      - `user_id` (uuid, primary key, references users)
      - `show_past_events` (boolean, default false)
      - `calendar_sync_google` (boolean, default false)
      - `calendar_sync_apple` (boolean, default false)
      - `calendar_sync_outlook` (boolean, default false)
      - `calendar_sync_yahoo` (boolean, default false)
      - `calendar_sync_ical` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on user_preferences
    - Users can only read/update their own preferences

  3. Changes
    - Update events RLS to ensure anon role can access approved events
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  show_past_events boolean DEFAULT false,
  calendar_sync_google boolean DEFAULT false,
  calendar_sync_apple boolean DEFAULT false,
  calendar_sync_outlook boolean DEFAULT false,
  calendar_sync_yahoo boolean DEFAULT false,
  calendar_sync_ical boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view approved events" ON events;

CREATE POLICY "Anyone can view approved events"
  ON events
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

DROP POLICY IF EXISTS "Anyone can view event genres" ON event_genres;

CREATE POLICY "Anyone can view event genres"
  ON event_genres
  FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_genres.event_id 
    AND events.status = 'approved'
  ));

DROP POLICY IF EXISTS "Anyone can view genres" ON genres;

CREATE POLICY "Anyone can view genres"
  ON genres
  FOR SELECT
  TO anon, authenticated
  USING (true);