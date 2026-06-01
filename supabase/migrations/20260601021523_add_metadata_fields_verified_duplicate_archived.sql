/*
  # Add Internal Metadata Fields: verified, duplicate_check, archived status

  ## Summary
  Extends the events table with three internal metadata fields that complete the
  data governance layer needed for scraping pipelines, bulk imports, and external
  integrations (Make.com, n8n, WordPress importers).

  ## Changes to `events` table

  ### New Columns
  - `verified` (boolean, default false) — Binary data-quality signal. Distinct from
    `last_verified` (timestamp of last check). An event is verified:true when a human
    or automated process has confirmed the record against an authoritative source.
    Events created by platform organizers or manually by admins may be set to
    verified:true immediately. CSV-imported or scraped events default to false.

  - `duplicate_check` (boolean, default false) — Processing flag indicating whether
    a deduplication algorithm has been run against this record. In bulk import
    pipelines, new records arrive with duplicate_check:false. After dedup runs, the
    flag is set to true. Admins can filter for duplicate_check:false to find
    unprocessed imports.

  ### Modified Constraints
  - The `status` column check constraint is extended to include 'archived' as a
    fourth legal value. Archived is distinct from rejected: rejected means a
    moderation decision was made against the event; archived means the event is
    no longer actively promoted but is retained for historical record (e.g., a
    past convention year, a cancelled recurring event).

  ## Security
  - RLS already enabled; no policy changes needed.
  - New boolean columns inherit existing row-level security.

  ## Notes
  1. The status constraint change uses DROP CONSTRAINT + ADD CONSTRAINT pattern
     wrapped in a DO block to handle the case where the constraint may have
     different names across environments.
  2. All new columns default to false so existing records are unaffected.
  3. `verified` pairs with the existing `last_verified` timestamptz column:
     last_verified = when the check happened, verified = current pass/fail state.
*/

-- Add verified flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'verified'
  ) THEN
    ALTER TABLE events ADD COLUMN verified boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add duplicate_check flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'duplicate_check'
  ) THEN
    ALTER TABLE events ADD COLUMN duplicate_check boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Extend status check constraint to include 'archived'
-- Drop the existing constraint by scanning pg_constraint for any check on status
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'events'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE events DROP CONSTRAINT %I', constraint_name);
  END IF;

  -- Re-add with archived included
  ALTER TABLE events
    ADD CONSTRAINT events_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'archived'));
END $$;
