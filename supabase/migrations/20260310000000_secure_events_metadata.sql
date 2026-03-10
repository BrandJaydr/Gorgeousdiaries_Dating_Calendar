-- Security Enhancement: Protect event metadata (status and featured)
-- This migration adds a BEFORE INSERT OR UPDATE trigger to prevent non-admins
-- from self-approving events or marking them as featured.

CREATE OR REPLACE FUNCTION public.protect_event_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always allow the service_role (null auth.uid()) and admins to change anything
  -- We check public.is_admin() which is a secure SECURITY DEFINER function
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- FOR NON-ADMINS:

  -- 1. Force status to pending for any change
  -- This ensures that any new event or any update to an existing event
  -- requires admin approval.
  NEW.status := 'pending';

  -- 2. Force featured to false
  -- Only admins should be able to mark an event as featured.
  NEW.featured := false;

  -- 3. Protect organizer_id
  IF TG_OP = 'UPDATE' THEN
    -- Prevent organizers from transferring event ownership
    IF NEW.organizer_id IS DISTINCT FROM OLD.organizer_id THEN
      RAISE EXCEPTION 'Cannot change event organizer';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- Ensure the organizer_id matches the authenticated user
    NEW.organizer_id := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS ensure_event_metadata_protection ON public.events;
CREATE TRIGGER ensure_event_metadata_protection
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_event_metadata();

-- Add a comment to the trigger for documentation
COMMENT ON TRIGGER ensure_event_metadata_protection ON public.events IS 'Enforces that only admins can approve events, feature events, or change event ownership.';
