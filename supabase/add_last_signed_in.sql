-- Add last_signed_in column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS last_signed_in TIMESTAMP WITH TIME ZONE;
