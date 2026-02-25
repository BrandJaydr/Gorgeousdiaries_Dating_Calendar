/*
  # Add Calendar Connections and Menu Preferences

  1. New Tables
    - `calendar_connections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `provider` (text) - google, outlook, apple, yahoo, ical
      - `access_token` (text, encrypted) - OAuth access token
      - `refresh_token` (text, encrypted) - OAuth refresh token
      - `expires_at` (timestamptz) - token expiration time
      - `is_connected` (boolean) - connection status
      - `last_sync_at` (timestamptz) - last successful sync
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to `user_preferences`
    - Add `menu_interaction_mode` (text) - click or hover (default: click)
    - Add `menu_overlay_enabled` (boolean) - dim background when menu open (default: false)

  3. Security
    - Enable RLS on `calendar_connections` table
    - Add policy for users to manage their own calendar connections
    - Update user_preferences with new columns
*/

-- Create calendar_connections table
CREATE TABLE IF NOT EXISTS calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('google', 'outlook', 'apple', 'yahoo', 'ical')),
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  is_connected boolean DEFAULT false,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS on calendar_connections
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own calendar connections
CREATE POLICY "Users can view own calendar connections"
  ON calendar_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own calendar connections
CREATE POLICY "Users can insert own calendar connections"
  ON calendar_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own calendar connections
CREATE POLICY "Users can update own calendar connections"
  ON calendar_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own calendar connections
CREATE POLICY "Users can delete own calendar connections"
  ON calendar_connections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add menu preferences to user_preferences table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'menu_interaction_mode'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN menu_interaction_mode text DEFAULT 'click' CHECK (menu_interaction_mode IN ('click', 'hover'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'menu_overlay_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN menu_overlay_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_provider ON calendar_connections(user_id, provider);