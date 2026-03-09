/*
  # Secure SECURITY DEFINER functions

  1. Changes
    - Update `grant_first_user_admin()` and `update_user_role()` to include `SET search_path = public`.
    - This prevents search path hijacking vulnerabilities by ensuring the functions
      always use the public schema for table lookups.

  2. Security
    - SECURITY DEFINER functions run with the privileges of the creator (usually postgres).
    - Without a fixed search_path, a malicious user could create a malicious
      table (e.g., `users`) in their own schema and trick these functions
      into using it.
*/

-- Secure grant_first_user_admin function
CREATE OR REPLACE FUNCTION public.grant_first_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.users) = 0 THEN
    NEW.role := 'admin';
    NEW.subscription_tier := 'premium';
  END IF;
  RETURN NEW;
END;
$$;

-- Secure update_user_role function
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id UUID,
  new_role TEXT,
  new_subscription_tier TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Validate role
  IF new_role NOT IN ('public', 'organizer', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  -- Validate subscription tier
  IF new_subscription_tier NOT IN ('free', 'organizer', 'premium') THEN
    RAISE EXCEPTION 'Invalid subscription tier';
  END IF;

  -- Update the user
  UPDATE public.users
  SET
    role = new_role,
    subscription_tier = new_subscription_tier,
    updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;
