-- Persist WhatsApp OTPs + auto-create profiles on signup

CREATE TABLE IF NOT EXISTS public.whatsapp_otp_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.whatsapp_otp_codes IS 'Short-lived WhatsApp OTP codes (service-role only).';

ALTER TABLE public.whatsapp_otp_codes ENABLE ROW LEVEL SECURITY;
-- No public policies — edge functions use the service role.

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, updated_at)
  VALUES (
    NEW.id,
    nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(
      NEW.phone,
      NEW.raw_user_meta_data ->> 'phone',
      ''
    )), ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill profiles for existing auth users
INSERT INTO public.profiles (id, full_name, phone, updated_at)
SELECT
  u.id,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
  nullif(trim(coalesce(u.phone, u.raw_user_meta_data ->> 'phone', '')), ''),
  NOW()
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
