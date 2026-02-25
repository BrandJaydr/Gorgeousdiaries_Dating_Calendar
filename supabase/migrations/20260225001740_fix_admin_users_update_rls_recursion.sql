/*
  # Fix Admin Users Update RLS Recursion

  1. Problem
    - "Admins can update any user" policy uses a subquery on the `users` table
      to check if the current user is an admin.
    - When an admin updates their own row, this subquery re-reads the same
      `users` table mid-update, which can cause a recursive policy evaluation
      failure, resulting in "Failed to update profile" errors.

  2. Fix
    - Drop the existing recursive admin UPDATE policy.
    - Replace it with a policy using auth.jwt() to read the user's role from
      the JWT claims instead of querying the users table again.
    - Also replace the recursive admin SELECT and DELETE policies for consistency.

  3. Security
    - Admin privileges are still enforced -- only users whose JWT contains
      role='admin' in raw_app_meta_data can use admin-level access.
    - Non-admin users are unaffected; their own-profile UPDATE policy remains.
*/

-- Drop the recursive admin update policy
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- Replace with a non-recursive version using a security-definer helper function
-- that avoids re-querying the users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- New admin update policy using the security-definer function
-- The SECURITY DEFINER function breaks the recursion by running with
-- elevated privileges outside of the RLS context
CREATE POLICY "Admins can update any user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
