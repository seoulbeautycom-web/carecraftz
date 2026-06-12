-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read staff" ON staff;
DROP POLICY IF EXISTS "Allow admins to insert staff" ON staff;
DROP POLICY IF EXISTS "Allow admins to update staff" ON staff;
DROP POLICY IF EXISTS "Allow admins to delete staff" ON staff;

-- Recreate policies with proper RLS
CREATE POLICY "Allow authenticated users to read staff"
ON staff FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to insert staff"
ON staff FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->>'role' = 'admin' OR
  NOT EXISTS (SELECT 1 FROM staff LIMIT 1) OR
  EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Allow admins to update staff"
ON staff FOR UPDATE
TO authenticated
USING (
  auth.jwt()->>'role' = 'admin' OR
  EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.jwt()->>'role' = 'admin' OR
  EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Allow admins to delete staff"
ON staff FOR DELETE
TO authenticated
USING (
  auth.jwt()->>'role' = 'admin' OR
  EXISTS (
    SELECT 1 FROM staff 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update admin user metadata to have admin role
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'admin@carecraftz.com';

-- Update existing staff record for admin
UPDATE staff
SET role = 'admin'
WHERE email = 'admin@carecraftz.com';
