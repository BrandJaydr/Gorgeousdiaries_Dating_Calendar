/*
  # Fix is_admin() function to prevent SQL inlining

  1. Problem
    - The is_admin() function is defined as a SQL language function with SECURITY DEFINER.
    - PostgreSQL can inline SQL functions, which strips the SECURITY DEFINER property
      and causes the query inside the function to run under the caller's RLS context.
    - This leads to infinite recursion when an admin user updates their own row in the
      users table, because the UPDATE policy re-evaluates is_admin() under RLS.

  2. Fix
    - Recreate is_admin() as a PL/pgSQL function, which PostgreSQL cannot inline.
    - This ensures SECURITY DEFINER is always respected, breaking the recursion.

  3. Security
    - Function still checks that the authenticated user has role = 'admin' in the users table.
    - SECURITY DEFINER ensures the SELECT inside the function bypasses RLS.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;
