ALTER TABLE public.partner_stores
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'carecraftz';

ALTER TABLE public.partner_stores
  DROP CONSTRAINT IF EXISTS partner_stores_delivery_mode_check;

ALTER TABLE public.partner_stores
  ADD CONSTRAINT partner_stores_delivery_mode_check
  CHECK (delivery_mode IN ('carecraftz', 'own'));

COMMENT ON COLUMN public.partner_stores.delivery_mode IS 'Who fulfils delivery: CareCraftz network or partner own logistics.';
