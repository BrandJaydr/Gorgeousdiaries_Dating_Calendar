-- Security Enhancement: Protect user roles and subscription tiers
-- This migration adds a trigger to prevent non-admins from promoting themselves to admin
-- or changing their subscription tier, while still allowing the intended self-upgrade
-- from 'public' to 'organizer'.

CREATE OR REPLACE FUNCTION public.check_user_privileges()
RETURNS TRIGGER AS $$
BEGIN
  -- Always allow admins to make any changes
  -- public.is_admin() is a security definer function that checks if the caller is an admin
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- For non-admins, ensure they only update their own row (extra safety beyond RLS)
  IF auth.uid() != NEW.id THEN
    RAISE EXCEPTION 'Access Denied: You can only update your own profile.';
  END IF;

  -- Check if role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Only allow 'public' -> 'organizer' transition as per business logic
    IF NOT (OLD.role = 'public' AND NEW.role = 'organizer') THEN
      RAISE EXCEPTION 'Access Denied: You do not have permission to change your role from % to %.', OLD.role, NEW.role;
    END IF;
  END IF;

  -- Check if subscription_tier is being changed
  IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier THEN
    RAISE EXCEPTION 'Access Denied: You do not have permission to change your subscription tier.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create the trigger to ensure it is applied
DROP TRIGGER IF EXISTS tr_check_user_privileges ON public.users;
CREATE TRIGGER tr_check_user_privileges
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_privileges();

-- Add a comment to the trigger for documentation
COMMENT ON TRIGGER tr_check_user_privileges ON public.users IS 'Enforces role transition rules and prevents unauthorized role/tier changes.';
