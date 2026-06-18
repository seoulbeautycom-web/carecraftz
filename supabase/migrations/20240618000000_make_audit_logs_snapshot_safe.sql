-- Make audit logs snapshot-safe so historical rows do not block auth/user deletion.
--
-- Keep the existing performed_by value as a detached snapshot field,
-- but remove the live foreign key back to auth.users.

DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT c.conname
  INTO fk_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN unnest(c.conkey) AS ck(attnum) ON true
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ck.attnum
  WHERE c.contype = 'f'
    AND n.nspname = 'public'
    AND t.relname = 'audit_logs'
    AND a.attname = 'performed_by'
    AND c.confrelid = 'auth.users'::regclass
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.audit_logs DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;
