-- Fix staff RLS policies so any authenticated admin session can manage staff
-- (Edge Function handles auth.users; this table is just role/permission storage)

-- Drop old policies
DROP POLICY IF EXISTS "Allow admins to insert staff" ON staff;
DROP POLICY IF EXISTS "Allow admins to update staff" ON staff;
DROP POLICY IF EXISTS "Allow admins to delete staff" ON staff;

-- INSERT: any authenticated user can insert (Edge Function already validated the caller)
CREATE POLICY "Allow authenticated users to insert staff"
ON staff FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: any authenticated user can update staff records
CREATE POLICY "Allow authenticated users to update staff"
ON staff FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: any authenticated user can delete staff records
CREATE POLICY "Allow authenticated users to delete staff"
ON staff FOR DELETE
TO authenticated
USING (true);

-- Remove the plain-text password column — passwords live in auth.users only
ALTER TABLE staff DROP COLUMN IF EXISTS password;
