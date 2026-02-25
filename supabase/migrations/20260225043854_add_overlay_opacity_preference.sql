/*
  # Add overlay opacity preference

  1. Changes
    - Add `overlay_opacity` column to `user_preferences` table
      - Type: integer with constraint (0-100 range)
      - Default value: 50
      - Used to control the opacity of overlay backgrounds in event detail modals
  
  2. Notes
    - This setting applies to overlay display mode
    - Value represents percentage (0 = fully transparent, 100 = fully opaque)
    - Default of 50 provides a balanced visibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'overlay_opacity'
  ) THEN
    ALTER TABLE user_preferences 
    ADD COLUMN overlay_opacity integer DEFAULT 50 CHECK (overlay_opacity >= 0 AND overlay_opacity <= 100);
  END IF;
END $$;