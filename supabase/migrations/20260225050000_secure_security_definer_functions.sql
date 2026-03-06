-- Fix search path hijacking in SECURITY DEFINER functions.
CREATE OR REPLACE FUNCTION public.grant_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.users) = 0 THEN
    NEW.role := 'admin';
    NEW.subscription_tier := 'premium';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id UUID,
  new_role TEXT,
  new_subscription_tier TEXT
)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  IF new_role NOT IN ('public', 'organizer', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF new_subscription_tier NOT IN ('free', 'organizer', 'premium') THEN
    RAISE EXCEPTION 'Invalid subscription tier';
  END IF;

  UPDATE public.users
  SET
    role = new_role,
    subscription_tier = new_subscription_tier,
    updated_at = NOW()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
