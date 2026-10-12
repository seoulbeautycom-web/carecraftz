-- Link products to a single catalog brand; seed sample brands
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);

COMMENT ON COLUMN public.products.brand_id IS 'Selected catalog brand (one per product).';

-- Seed real skincare brands (idempotent by name)
INSERT INTO public.brands (name, logo_url)
SELECT v.name, v.logo_url
FROM (
  VALUES
    (
      'CareCraftz',
      'https://ui-avatars.com/api/?name=CC&background=4F46E5&color=fff&size=128&bold=true&format=png'
    ),
    (
      'The Ordinary',
      'https://ui-avatars.com/api/?name=TO&background=111111&color=fff&size=128&bold=true&format=png'
    ),
    (
      'CeraVe',
      'https://ui-avatars.com/api/?name=CV&background=005EB8&color=fff&size=128&bold=true&format=png'
    ),
    (
      'Neutrogena',
      'https://ui-avatars.com/api/?name=NG&background=F5A623&color=fff&size=128&bold=true&format=png'
    )
) AS v(name, logo_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.brands b WHERE LOWER(b.name) = LOWER(v.name)
);

-- Backfill brand_id when product already has a matching brand_name
UPDATE public.products p
SET brand_id = b.id
FROM public.brands b
WHERE p.brand_id IS NULL
  AND p.brand_name IS NOT NULL
  AND TRIM(p.brand_name) <> ''
  AND LOWER(TRIM(p.brand_name)) = LOWER(b.name);
