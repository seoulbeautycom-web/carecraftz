-- Add password column to staff table (used for admin portal login)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS password TEXT;
