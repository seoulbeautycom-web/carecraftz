ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS delivery_type TEXT NOT NULL DEFAULT 'carecraftz';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_delivery_type_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_delivery_type_check
  CHECK (delivery_type IN ('carecraftz', 'partner'));
