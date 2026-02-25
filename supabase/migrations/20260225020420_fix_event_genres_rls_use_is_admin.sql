/*
  # Fix Event Genres RLS to Use is_admin() Function

  1. Changes
    - Drop existing event_genres RLS policy that uses inline admin check
    - Recreate policies using is_admin() security definer function
    - This prevents RLS recursion issues when authenticated users query events with genres

  2. Security
    - Maintains same access control rules
    - Anyone (anon/authenticated): can view genres for approved events
    - Organizers: can manage genres for their own events
    - Admins: can manage all event genres
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Organizers can manage event genres" ON event_genres;
DROP POLICY IF EXISTS "Anyone can view event genres" ON event_genres;

-- SELECT policy for viewing event genres
CREATE POLICY "Anyone can view event genres"
  ON event_genres FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_genres.event_id
      AND events.status = 'approved'
    )
  );

CREATE POLICY "Organizers can view own event genres"
  ON event_genres FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_genres.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all event genres"
  ON event_genres FOR SELECT
  TO authenticated
  USING (is_admin());

-- INSERT policy
CREATE POLICY "Organizers can insert own event genres"
  ON event_genres FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_genres.event_id
      AND (events.organizer_id = auth.uid() OR is_admin())
    )
  );

-- UPDATE policy
CREATE POLICY "Organizers can update own event genres"
  ON event_genres FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_genres.event_id
      AND (events.organizer_id = auth.uid() OR is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_genres.event_id
      AND (events.organizer_id = auth.uid() OR is_admin())
    )
  );

-- DELETE policy
CREATE POLICY "Organizers can delete own event genres"
  ON event_genres FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_genres.event_id
      AND (events.organizer_id = auth.uid() OR is_admin())
    )
  );
