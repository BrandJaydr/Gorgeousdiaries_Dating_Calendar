-- Security Enhancement: Protect event metadata (status and featured flag)
-- This migration adds a trigger to prevent non-admins from self-approving events
-- or marking them as featured.

CREATE OR REPLACE FUNCTION public.protect_event_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service role (null auth.uid()) to make any changes
  -- This is necessary for system-level operations and migrations
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Allow admins to make any changes
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- For non-admins:
  IF (TG_OP = 'INSERT') THEN
    -- Force status to pending and featured to false on creation
    NEW.status := 'pending';
    NEW.featured := false;
    -- Ensure the organizer_id matches the authenticated user
    NEW.organizer_id := auth.uid();
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Prevent unauthorized changes to status or featured flag
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.status := OLD.status;
    END IF;

    IF NEW.featured IS DISTINCT FROM OLD.featured THEN
      NEW.featured := OLD.featured;
    END IF;

    -- Prevent changing the organizer_id
    IF NEW.organizer_id IS DISTINCT FROM OLD.organizer_id THEN
      NEW.organizer_id := OLD.organizer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Apply the trigger to the events table
DROP TRIGGER IF EXISTS tr_protect_event_metadata ON public.events;
CREATE TRIGGER tr_protect_event_metadata
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_event_metadata();

-- Add a comment for documentation
COMMENT ON TRIGGER tr_protect_event_metadata ON public.events IS 'Enforces that only admins can approve events or mark them as featured.';
