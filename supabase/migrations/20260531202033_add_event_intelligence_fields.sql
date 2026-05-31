/*
  # Add Event Intelligence Fields

  ## Summary
  Extends the events table with metadata fields that support the intelligence database
  vision: tracking where event data came from, linking to external booking/info pages,
  and capturing free-text organizer names for externally imported events that have no
  platform account.

  ## New Columns on `events`

  - `website` (text, nullable) — primary informational website for the event
  - `ticket_url` (text, nullable) — direct link to purchase tickets
  - `source_url` (text, nullable) — URL of the original source record was scraped/imported from
  - `last_verified` (timestamptz, nullable) — timestamp when event data was last confirmed accurate
  - `organizer_name` (text, nullable) — free-text organizer name for external events not tied to a platform user account
  - `notes` (text, nullable) — internal admin notes on the event record
  - `end_date` (date) — already existed; this migration is a no-op guard for it

  ## Security
  - RLS already enabled on events table; no policy changes needed
  - New columns inherit existing row-level security policies

  ## Notes
  1. All columns are nullable to remain backward compatible with existing records.
  2. `organizer_name` is distinct from `organizer_id` (the FK to platform users).
     Both can coexist: an event imported from an external source has `organizer_name`
     populated; if that organizer later joins the platform the `organizer_id` FK is added.
  3. `source_url` enables deduplication checks during future automated imports.
  4. `last_verified` enables staleness detection — records not verified within N days
     can be flagged for review.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'website'
  ) THEN
    ALTER TABLE events ADD COLUMN website text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'ticket_url'
  ) THEN
    ALTER TABLE events ADD COLUMN ticket_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE events ADD COLUMN source_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'last_verified'
  ) THEN
    ALTER TABLE events ADD COLUMN last_verified timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'organizer_name'
  ) THEN
    ALTER TABLE events ADD COLUMN organizer_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'notes'
  ) THEN
    ALTER TABLE events ADD COLUMN notes text;
  END IF;
END $$;
