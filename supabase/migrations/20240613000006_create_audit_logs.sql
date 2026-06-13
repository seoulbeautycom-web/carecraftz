-- Create comprehensive audit log system

-- Audit logs table for all system actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'UPLOAD', 'DELETE_IMAGE')),
  old_data JSONB,
  new_data JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_by_name TEXT,
  performed_by_email TEXT,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' AND policyname = 'Allow admins to view audit logs'
  ) THEN
    CREATE POLICY "Allow admins to view audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM staff 
        WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
      )
    );
  END IF;
END $$;

-- Policy: System can insert audit logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' AND policyname = 'Allow system to insert audit logs'
  ) THEN
    CREATE POLICY "Allow system to insert audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Function to automatically log product changes
CREATE OR REPLACE FUNCTION log_product_audit()
RETURNS TRIGGER AS $$
DECLARE
  staff_record RECORD;
BEGIN
  -- Get staff info
  SELECT full_name, email INTO staff_record
  FROM staff
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (
      table_name, record_id, action, old_data, 
      performed_by, performed_by_name, performed_by_email
    ) VALUES (
      'products', OLD.id, 'DELETE', to_jsonb(OLD),
      auth.uid(), staff_record.full_name, staff_record.email
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (
      table_name, record_id, action, old_data, new_data,
      performed_by, performed_by_name, performed_by_email
    ) VALUES (
      'products', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW),
      auth.uid(), staff_record.full_name, staff_record.email
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (
      table_name, record_id, action, new_data,
      performed_by, performed_by_name, performed_by_email
    ) VALUES (
      'products', NEW.id, 'CREATE', to_jsonb(NEW),
      auth.uid(), staff_record.full_name, staff_record.email
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS product_audit_trigger ON products;

-- Create trigger for product audit
CREATE TRIGGER product_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_audit();

-- Function to log staff changes
CREATE OR REPLACE FUNCTION log_staff_audit()
RETURNS TRIGGER AS $$
DECLARE
  staff_record RECORD;
BEGIN
  -- Get staff info
  SELECT full_name, email INTO staff_record
  FROM staff
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (
      table_name, record_id, action, old_data,
      performed_by, performed_by_name, performed_by_email
    ) VALUES (
      'staff', OLD.id, 'DELETE', to_jsonb(OLD),
      auth.uid(), staff_record.full_name, staff_record.email
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (
      table_name, record_id, action, old_data, new_data,
      performed_by, performed_by_name, performed_by_email
    ) VALUES (
      'staff', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW),
      auth.uid(), staff_record.full_name, staff_record.email
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (
      table_name, record_id, action, new_data,
      performed_by, performed_by_name, performed_by_email
    ) VALUES (
      'staff', NEW.id, 'CREATE', to_jsonb(NEW),
      auth.uid(), staff_record.full_name, staff_record.email
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS staff_audit_trigger ON staff;

-- Create trigger for staff audit
CREATE TRIGGER staff_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION log_staff_audit();
