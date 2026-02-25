/*
  # Fix Events RLS Policies to Use is_admin() Function

  1. Changes
    - Drop all existing events RLS policies
    - Recreate policies using is_admin() security definer function instead of inline subqueries
    - This prevents RLS recursion issues when checking admin status

  2. Security
    - Maintains same access control rules
    - Uses security definer function to bypass RLS during admin check
    - Admins: full access to all events
    - Organizers: can create/update/view own events
    - Public: can view approved events only
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view approved events" ON events;
DROP POLICY IF EXISTS "Admins can view all events" ON events;
DROP POLICY IF EXISTS "Organizers can view own events" ON events;
DROP POLICY IF EXISTS "Organizers can create events" ON events;
DROP POLICY IF EXISTS "Admins can create events" ON events;
DROP POLICY IF EXISTS "Organizers can update own events" ON events;
DROP POLICY IF EXISTS "Admins can update any event" ON events;
DROP POLICY IF EXISTS "Admins can delete any event" ON events;

-- SELECT policies
CREATE POLICY "Anyone can view approved events"
  ON events FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Admins can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Organizers can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (organizer_id = auth.uid());

-- INSERT policies
CREATE POLICY "Organizers can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'organizer'
    ) AND organizer_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE policies
CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid() OR is_admin())
  WITH CHECK (organizer_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can update any event"
  ON events FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE policies
CREATE POLICY "Admins can delete any event"
  ON events FOR DELETE
  TO authenticated
  USING (is_admin());
