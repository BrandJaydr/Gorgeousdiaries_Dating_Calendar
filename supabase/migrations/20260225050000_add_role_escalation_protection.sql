/*
  # Add Role Escalation Protection

  1. New Functions
    - `handle_user_update_protection()`: Validates that users cannot escalate their own privileges or change sensitive identity fields.

  2. Triggers
    - `user_update_protection_trigger`: Runs before any update on the `users` table.

  3. Security
    - Prevents non-admins from changing their `role` (except for self-upgrading from public to organizer).
    - Prevents non-admins from changing their `subscription_tier`.
    - Prevents all users from changing their `id`.
    - Prevents non-admins from changing their `email` (should be handled via Supabase Auth).
*/

CREATE OR REPLACE FUNCTION public.handle_user_update_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always prevent changing the ID
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Changing user ID is not allowed';
  END IF;

  -- If the caller is an admin, they have full permission for other fields
  -- We use the existing is_admin() function which is also SECURITY DEFINER
  IF is_admin() THEN
    RETURN NEW;
  END IF;

  -- FOR NON-ADMINS:

  -- 1. Prevent changing email
  IF NEW.email <> OLD.email THEN
    RAISE EXCEPTION 'Changing email address is not permitted through this interface';
  END IF;

  -- 2. Prevent changing subscription tier
  IF NEW.subscription_tier <> OLD.subscription_tier THEN
    RAISE EXCEPTION 'Unauthorized subscription tier change';
  END IF;

  -- 3. Restrict role changes
  -- Allow ONLY public -> organizer (self-upgrade feature)
  IF NEW.role <> OLD.role THEN
    IF NOT (OLD.role = 'public' AND NEW.role = 'organizer') THEN
      RAISE EXCEPTION 'Unauthorized role change. You cannot promote yourself to admin or change roles once you are an organizer.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS user_update_protection_trigger ON public.users;
CREATE TRIGGER user_update_protection_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update_protection();
