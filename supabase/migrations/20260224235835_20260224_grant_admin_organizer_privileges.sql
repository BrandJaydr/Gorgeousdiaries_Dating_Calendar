/*
  # Grant Admin Users Full Organizer Privileges

  1. Changes
    - Update event policies to allow admins to create events with any organizer_id
    - Allow admins to update events without restriction to organizer_id validation
    - Ensure admins can manage all events like they own them
    - Admins now have parity with organizers plus admin-specific powers

  2. Event Table Policies
    - Admin CREATE: Allow admins to insert any event with any organizer_id
    - Admin UPDATE: Allow admins to update any event
    - Admin DELETE: Already exists, allow admins to delete any event
    - Organizer policies remain unchanged for non-admin users

  3. Security
    - RLS still prevents non-admins and non-organizers from unauthorized access
    - Admins have unrestricted access for moderation and management
    - All existing policies for public users and organizers remain intact
*/

-- Update the organizer create policy to allow admins without organizer_id restriction
DROP POLICY IF EXISTS "Organizers can create events" ON events;

CREATE POLICY "Organizers can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'organizer'
      )
      AND organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Update admin create policy to explicitly allow any organizer_id
DROP POLICY IF EXISTS "Admins can create events" ON events;

CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Update organizer update policy to allow admins
DROP POLICY IF EXISTS "Organizers can update own events" ON events;

CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    organizer_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    organizer_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Update organizer view policy to include events they can manage as admin
DROP POLICY IF EXISTS "Organizers can view own events" ON events;

CREATE POLICY "Organizers can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (
    organizer_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Ensure event_genres policies grant admins full access
DROP POLICY IF EXISTS "Organizers can manage event genres" ON event_genres;

CREATE POLICY "Organizers can manage event genres"
  ON event_genres FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE (
        events.id = event_genres.event_id
        AND (
          events.organizer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
          )
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE (
        events.id = event_genres.event_id
        AND (
          events.organizer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
          )
        )
      )
    )
  );
