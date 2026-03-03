/*
  # Secure User Roles and Subscription Tiers

  1. Changes
    - Add a `BEFORE UPDATE` trigger on the `users` table to prevent unauthorized escalation of privileges.
    - Non-admin users are prohibited from changing their own (or others') `role` or `subscription_tier`.

  2. Security
    - Uses a `SECURITY DEFINER` function with `SET search_path = public` to safely check the caller's role.
    - Protects the integrity of the authorization system by ensuring only admins can manage user permissions.
*/

CREATE OR REPLACE FUNCTION public.handle_user_role_protection()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if role or subscription_tier is being changed
  IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier) THEN
    -- Only allow the change if the current user is an admin
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can modify user roles or subscription tiers';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply the trigger to the users table
DROP TRIGGER IF EXISTS ensure_user_role_protection ON public.users;
CREATE TRIGGER ensure_user_role_protection
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_role_protection();
