-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- 'admin', 'manager', 'staff'
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_signed_in TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read staff
CREATE POLICY "Allow authenticated users to read staff"
ON staff FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow users to insert staff if they have admin role in their JWT metadata
-- OR if no staff records exist yet (for initial setup)
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

-- Policy: Allow admins to update staff
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

-- Policy: Allow admins to delete staff
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

-- Create function to automatically create staff record when user is created
CREATE OR REPLACE FUNCTION create_staff_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create staff record if one doesn't already exist for this email
  IF NOT EXISTS (SELECT 1 FROM staff WHERE email = NEW.email) THEN
    INSERT INTO staff (user_id, email, full_name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin'), COALESCE(NEW.raw_user_meta_data->>'role', 'staff'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create staff record on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_staff_record();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
