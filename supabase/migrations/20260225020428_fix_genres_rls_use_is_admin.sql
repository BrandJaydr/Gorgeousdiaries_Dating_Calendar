/*
  # Fix Genres RLS to Use is_admin() Function

  1. Changes
    - Drop existing genres RLS policy that uses inline admin check
    - Recreate policies using is_admin() security definer function
    - This prevents RLS recursion issues

  2. Security
    - Anyone (anon/authenticated): can view all genres
    - Admins only: can manage (insert/update/delete) genres
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage genres" ON genres;
DROP POLICY IF EXISTS "Anyone can view genres" ON genres;

-- SELECT policy - anyone can view genres
CREATE POLICY "Anyone can view genres"
  ON genres FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT policy - admins only
CREATE POLICY "Admins can insert genres"
  ON genres FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE policy - admins only
CREATE POLICY "Admins can update genres"
  ON genres FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE policy - admins only
CREATE POLICY "Admins can delete genres"
  ON genres FOR DELETE
  TO authenticated
  USING (is_admin());
