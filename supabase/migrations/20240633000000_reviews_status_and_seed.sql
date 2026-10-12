-- Moderation status + reply fields for product reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_reply TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_status_check;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_status_check
  CHECK (status IN ('pending', 'published', 'flagged', 'rejected'));

-- Keep is_approved aligned with status for storefront queries
UPDATE public.reviews
SET
  status = CASE
    WHEN is_approved = true THEN 'published'
    ELSE 'pending'
  END
WHERE status = 'pending' AND is_approved = true;

CREATE OR REPLACE FUNCTION public.sync_review_approval_from_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_approved := (NEW.status = 'published');
  NEW.updated_at := NOW();
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.moderated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_sync_approval_trigger ON public.reviews;
CREATE TRIGGER reviews_sync_approval_trigger
BEFORE INSERT OR UPDATE OF status ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.sync_review_approval_from_status();

CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- Staff can insert reviews (for seeded/admin-created entries)
DROP POLICY IF EXISTS "Allow staff to create reviews via RBAC" ON public.reviews;
CREATE POLICY "Allow staff to create reviews via RBAC"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  public.rbac_has_any_permission(ARRAY['reviews.moderate', 'roles.manage'])
);

-- Seed the sample moderation queue reviews (idempotent by title + customer_name)
WITH ranked_products AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC NULLS LAST) - 1 AS rn
  FROM public.products
),
product_count AS (
  SELECT COUNT(*)::int AS total FROM ranked_products
),
seed_rows AS (
  SELECT * FROM (VALUES
    (
      'Sarah K.',
      'My skin has never felt better',
      'I switched to this soap six months ago and haven''t looked back. It lathers beautifully and leaves zero residue. My skin feels soft all day.',
      5,
      'published'::text,
      24,
      0
    ),
    (
      'Theo C.',
      'Worth every penny',
      'I was skeptical at first but after two weeks of use I can see a noticeable difference in my skin tone. The texture is lightweight and absorbs fast.',
      5,
      'published'::text,
      18,
      1
    ),
    (
      'Priya S.',
      'Really effective but strong scent',
      'Does exactly what it claims. My pores are visibly smaller after 2 uses. Giving 4 stars only because the clay scent is quite strong for my taste.',
      4,
      'pending'::text,
      7,
      2
    ),
    (
      'Leo F.',
      'So moisturizing!',
      'Love how thick and creamy this is. Perfect for dry winter skin. Takes a while to absorb but once it does, skin stays hydrated all day.',
      4,
      'pending'::text,
      12,
      3
    )
  ) AS v(customer_name, title, review_text, rating, status, helpful_count, product_offset)
)
INSERT INTO public.reviews (
  customer_name,
  title,
  review_text,
  rating,
  status,
  is_approved,
  helpful_count,
  product_id,
  created_by_staff
)
SELECT
  s.customer_name,
  s.title,
  s.review_text,
  s.rating,
  s.status,
  s.status = 'published',
  s.helpful_count,
  CASE
    WHEN pc.total > 0 THEN (
      SELECT rp.id
      FROM ranked_products rp
      WHERE rp.rn = (s.product_offset % pc.total)
      LIMIT 1
    )
    ELSE NULL
  END,
  true
FROM seed_rows s
CROSS JOIN product_count pc
WHERE NOT EXISTS (
  SELECT 1
  FROM public.reviews r
  WHERE r.customer_name = s.customer_name
    AND r.title = s.title
);

COMMENT ON COLUMN public.reviews.status IS 'Moderation status: pending, published, flagged, rejected.';
COMMENT ON COLUMN public.reviews.admin_reply IS 'Optional staff reply shown with the review.';
COMMENT ON COLUMN public.reviews.title IS 'Short review headline.';
