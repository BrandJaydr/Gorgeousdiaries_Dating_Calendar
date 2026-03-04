/* 🛡️ Sentinel: Security hardening for users table and functions
   - Fix search path hijacking in SECURITY DEFINER functions
   - Prevent unauthorized role/tier escalation via BEFORE UPDATE trigger
*/

-- Fix search path hijacking for admin setup function
CREATE OR REPLACE FUNCTION grant_first_user_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM users) = 0 THEN
    NEW.role := 'admin';
    NEW.subscription_tier := 'premium';
  END IF;
  RETURN NEW;
END; $$;

-- Fix search path hijacking and use is_admin() for role updates
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id UUID,
  new_role TEXT,
  new_subscription_tier TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- We use public.is_admin() which is defined in previous migrations
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  IF new_role NOT IN ('public', 'organizer', 'admin') OR
     new_subscription_tier NOT IN ('free', 'organizer', 'premium') THEN
    RAISE EXCEPTION 'Invalid role or subscription tier';
  END IF;

  UPDATE users SET
    role = new_role,
    subscription_tier = new_subscription_tier,
    updated_at = NOW()
  WHERE id = target_user_id;
END; $$;

-- Protection trigger function to prevent self-escalation
CREATE OR REPLACE FUNCTION public.protect_user_roles()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Prevent role or tier escalation if not an admin
  IF (OLD.role IS DISTINCT FROM NEW.role OR
      OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier) AND
     NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can change user roles or subscription tiers';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS protect_user_roles_trigger ON users;
CREATE TRIGGER protect_user_roles_trigger
  BEFORE UPDATE ON users FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_roles();
