/*
  # Protect Sensitive User Columns

  1. New Functions
    - `public.handle_user_update_protection()`: Trigger function to prevent non-admins
      from changing their own role or subscription_tier.

  2. New Triggers
    - `before_user_update_protection`: BEFORE UPDATE trigger on the users table.

  3. Security
    - Function is defined with SECURITY DEFINER and search_path = public.
    - Uses the existing is_admin() function for permission checks.
*/

CREATE OR REPLACE FUNCTION public.handle_user_update_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is an admin, allow all changes
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- If not an admin, prevent changing role or subscription_tier
  -- This provides defense-in-depth against privilege escalation
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;

  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    NEW.subscription_tier := OLD.subscription_tier;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the BEFORE UPDATE trigger
DROP TRIGGER IF EXISTS before_user_update_protection ON public.users;
CREATE TRIGGER before_user_update_protection
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update_protection();
