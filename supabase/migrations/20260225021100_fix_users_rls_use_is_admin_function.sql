/*
  # Fix Users Table RLS to Use is_admin() Function

  1. Changes
    - Drop existing users RLS policies that use inline admin checks
    - Recreate policies using is_admin() security definer function
    - This prevents RLS recursion when authenticated users read their own profile

  2. Security
    - Users can read and update their own profile
    - Admins can view, update, and delete all users
    - Users can insert their own profile (for initial setup)
*/

-- Drop existing policies with inline admin checks
DROP POLICY IF EXISTS "Admins can view user management" ON users;
DROP POLICY IF EXISTS "Admins can delete any user" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- SELECT policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_admin());

-- INSERT policy
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE policies
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE policy
CREATE POLICY "Admins can delete any user"
  ON users FOR DELETE
  TO authenticated
  USING (is_admin());
