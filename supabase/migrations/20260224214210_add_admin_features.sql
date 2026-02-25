/*
  # Admin Features Enhancement

  ## Changes
  1. Create database trigger to automatically grant admin role to first user
  2. Add user management view for admins
  3. Add function to update user roles

  ## Functions
  - `grant_first_user_admin()` - Automatically makes first registered user an admin
  - `update_user_role()` - Allows admins to change user roles and subscription tiers

  ## Triggers
  - Trigger on user insert to check if they should be admin

  ## Security
  - Only admins can update user roles
  - First user automatically gets admin privileges
*/

-- Function to automatically grant admin to first user
CREATE OR REPLACE FUNCTION grant_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM users) = 0 THEN
    NEW.role := 'admin';
    NEW.subscription_tier := 'premium';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for first user admin grant
DROP TRIGGER IF EXISTS first_user_admin_trigger ON users;
CREATE TRIGGER first_user_admin_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION grant_first_user_admin();

-- Function to allow admins to update user roles
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id UUID,
  new_role TEXT,
  new_subscription_tier TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users
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
  UPDATE users
  SET 
    role = new_role,
    subscription_tier = new_subscription_tier,
    updated_at = NOW()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for user management (admin only)
CREATE OR REPLACE VIEW user_management AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.subscription_tier,
  u.created_at,
  COUNT(DISTINCT e.id) as event_count,
  COUNT(DISTINCT f.event_id) as favorite_count
FROM users u
LEFT JOIN events e ON e.organizer_id = u.id
LEFT JOIN user_favorites f ON f.user_id = u.id
GROUP BY u.id, u.email, u.full_name, u.role, u.subscription_tier, u.created_at;

-- Grant access to user_management view for admins
ALTER VIEW user_management OWNER TO postgres;

-- Add RLS policy for user_management view
CREATE POLICY "Admins can view user management"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
