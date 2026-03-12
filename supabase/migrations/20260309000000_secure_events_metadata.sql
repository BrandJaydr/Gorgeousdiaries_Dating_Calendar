-- Protect event status and metadata from unauthorized changes
CREATE OR REPLACE FUNCTION public.handle_event_metadata_protection()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Allow service_role or admins full access
  IF (current_setting('role') = 'service_role') OR is_admin() THEN
    RETURN NEW;
  END IF;

  -- Ensure non-admins cannot create/edit events for others
  IF (TG_OP = 'INSERT') THEN
    NEW.status := 'pending';
    NEW.featured := false;
    NEW.organizer_id := auth.uid();
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Block unauthorized identity or metadata escalation
    IF NEW.organizer_id <> OLD.organizer_id THEN
      RAISE EXCEPTION 'Changing event organizer is not allowed';
    END IF;
    IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
      RAISE EXCEPTION 'Only administrators can approve events';
    END IF;
    IF NEW.featured = true AND OLD.featured = false THEN
      RAISE EXCEPTION 'Only administrators can feature events';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_event_metadata_protection ON public.events;
CREATE TRIGGER tr_event_metadata_protection
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_event_metadata_protection();

COMMENT ON TRIGGER tr_event_metadata_protection ON public.events
IS 'Prevents non-admins from self-approving events or changing featured status.';
