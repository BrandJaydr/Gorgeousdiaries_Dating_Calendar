/*
  # Add Event Display Preferences to User Preferences

  1. Changes to `user_preferences` table
    - Add `event_interaction_mode` (text) - Controls how event details are triggered: 'click' or 'hover'
    - Add `event_display_mode` (text) - Controls display style: 'popup', 'overlay', or 'fullpage'
    - Add `event_background_mode` (text) - Controls background treatment: 'image', 'white', or 'blur'
  
  2. Default Values
    - `event_interaction_mode` defaults to 'click'
    - `event_display_mode` defaults to 'popup'
    - `event_background_mode` defaults to 'white'
  
  3. Notes
    - These preferences allow users to customize how they view event details
    - Click vs hover controls the interaction trigger
    - Display mode controls the layout (centered popup, full overlay, or page transition)
    - Background mode controls the visual style (event image, clean white, or blurred effect)
*/

-- Add event display preferences to user_preferences table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'event_interaction_mode'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN event_interaction_mode text DEFAULT 'click' CHECK (event_interaction_mode IN ('click', 'hover'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'event_display_mode'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN event_display_mode text DEFAULT 'popup' CHECK (event_display_mode IN ('popup', 'overlay', 'fullpage'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'event_background_mode'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN event_background_mode text DEFAULT 'white' CHECK (event_background_mode IN ('image', 'white', 'blur'));
  END IF;
END $$;