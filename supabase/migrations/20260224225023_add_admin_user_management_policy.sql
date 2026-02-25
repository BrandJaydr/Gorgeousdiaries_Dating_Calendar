/*
  # Add Admin User Management Policies

  1. Security Changes
    - Add policy for admins to update any user
    - Add policy for admins to delete any user (for account management)
    
  This enables full administrative control over user accounts.
*/

CREATE POLICY "Admins can update any user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Admins can delete any user"
  ON users
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));