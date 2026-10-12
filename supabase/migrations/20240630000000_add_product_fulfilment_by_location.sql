ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS fulfilment_by_location JSONB NOT NULL DEFAULT '{}'::jsonb;
