-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_signed_in TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read staff
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'staff' AND policyname = 'Allow authenticated users to read staff'
  ) THEN
    CREATE POLICY "Allow authenticated users to read staff"
    ON staff FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Policy: Allow admins to insert staff
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'staff' AND policyname = 'Allow admins to insert staff'
  ) THEN
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
  END IF;
END $$;

-- Policy: Allow admins to update staff
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'staff' AND policyname = 'Allow admins to update staff'
  ) THEN
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
  END IF;
END $$;

-- Policy: Allow admins to delete staff
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'staff' AND policyname = 'Allow admins to delete staff'
  ) THEN
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
  END IF;
END $$;

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for staff updated_at
CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
