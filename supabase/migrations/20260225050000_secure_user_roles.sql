/*
  # Secure User Roles and Subscription Tiers

  1. Changes
    - Update `grant_first_user_admin` to force 'public' role for all users except the first one.
    - Add `handle_user_update` function to prevent unauthorized changes to `role` and `subscription_tier`.
    - Add `BEFORE UPDATE` trigger to the `users` table.

  2. Security
    - Prevents privilege escalation where a user could change their own role to 'admin'.
    - Prevents unauthorized subscription tier changes.
    - Admins can still manage roles and tiers through the `update_user_role` function or direct updates.
*/

-- Improve the first user admin grant to be more restrictive
CREATE OR REPLACE FUNCTION grant_first_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is the first user, make them admin
  IF (SELECT COUNT(*) FROM users) = 0 THEN
    NEW.role := 'admin';
    NEW.subscription_tier := 'premium';
  ELSE
    -- For all other users, force 'public' and 'free' on insert
    -- even if they tried to set something else in the insert call
    NEW.role := 'public';
    NEW.subscription_tier := 'free';
  END IF;
  RETURN NEW;
END;
$$;

-- Function to handle user updates and protect sensitive columns
CREATE OR REPLACE FUNCTION handle_user_update_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the current user is an admin, allow all changes
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Prevent non-admins from changing their role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can change user roles.';
  END IF;

  -- Prevent non-admins from changing their subscription tier
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can change subscription tiers.';
  END IF;

  RETURN NEW;
END;
$$;

-- Create the before update trigger
DROP TRIGGER IF EXISTS user_update_security_trigger ON users;
CREATE TRIGGER user_update_security_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_update_security();
