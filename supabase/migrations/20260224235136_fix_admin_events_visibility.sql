/*
  # Fix Admin Events Visibility

  1. Issue
    - Admin users cannot view all events in the calendar
    - The RLS policy for admins only applied to management operations (INSERT/UPDATE/DELETE)
    - It did not have a SELECT condition, so admins were only seeing approved events

  2. Solution
    - Add a proper SELECT policy for admins that allows viewing all events
    - This gives admins full visibility to all events regardless of status

  3. Security
    - This is intentional and secure - admins should see all events for moderation/management
    - The existing policies for non-admins remain unchanged
*/

-- Drop and recreate the admin policy to include SELECT
DROP POLICY IF EXISTS "Admins can manage all events" ON events;

CREATE POLICY "Admins can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update any event"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete any event"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
