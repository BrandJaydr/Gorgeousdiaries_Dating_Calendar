-- Security Enhancement: Prevent unauthorized privilege escalation in the users table
-- This migration adds a BEFORE UPDATE trigger to protect role and subscription_tier.

CREATE OR REPLACE FUNCTION public.protect_user_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Allow the service_role (null auth.uid()) and admins to change anything
  IF auth.uid() IS NULL OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN NEW;
  END IF;

  -- Allow users to self-upgrade from public to organizer (but not to admin)
  IF OLD.role = 'public' AND NEW.role = 'organizer' AND OLD.id = auth.uid() THEN
    -- Prevent unauthorized subscription tier escalation
    IF NEW.subscription_tier <> OLD.subscription_tier AND NEW.subscription_tier <> 'organizer' THEN
       NEW.subscription_tier := OLD.subscription_tier;
    END IF;
    RETURN NEW;
  END IF;

  -- Block unauthorized changes to role and subscription tier
  NEW.role := OLD.role;
  NEW.subscription_tier := OLD.subscription_tier;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_user_privilege_protection ON public.users;
CREATE TRIGGER ensure_user_privilege_protection
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_privileges();
