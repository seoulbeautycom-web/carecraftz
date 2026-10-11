-- Partner verification: document uploads, needs_info RPC, checklist + verified metadata, public store read for trust badges.

-- ── Documents table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.partner_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('business_license', 'certifications', 'lab_reports')),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  file_size INTEGER NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_application_documents_application_id
  ON public.partner_application_documents(application_id);

ALTER TABLE public.partner_application_documents ENABLE ROW LEVEL SECURITY;

-- ── Verification fields on partner_stores ────────────────────────
ALTER TABLE public.partner_stores
  ADD COLUMN IF NOT EXISTS verification_checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS public_certifications TEXT[] NOT NULL DEFAULT '{}'::text[];

-- Draft checklist can live on the application while under review
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS verification_checklist JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ── Storage bucket for partner evidence ──────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-documents',
  'partner-documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Allow public upload partner documents" ON storage.objects;
CREATE POLICY "Allow public upload partner documents"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'partner-documents'
  AND (storage.foldername(name))[1] = 'applications'
);

DROP POLICY IF EXISTS "Allow staff read partner documents" ON storage.objects;
CREATE POLICY "Allow staff read partner documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'partner-documents'
  AND public.rbac_has_any_permission(ARRAY[
    'partners.view', 'partners.review', 'partners.approve',
    'partners.reject', 'partners.provision', 'partners.manage', 'roles.manage'
  ])
);

DROP POLICY IF EXISTS "Allow staff delete partner documents" ON storage.objects;
CREATE POLICY "Allow staff delete partner documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-documents'
  AND public.rbac_has_any_permission(ARRAY[
    'partners.review', 'partners.manage', 'roles.manage'
  ])
);

-- ── Document RLS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow public to attach partner application documents" ON public.partner_application_documents;
CREATE POLICY "Allow public to attach partner application documents"
ON public.partner_application_documents
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.partner_applications pa
    WHERE pa.id = application_id
      AND pa.status IN ('submitted', 'needs_info')
      AND pa.created_at > NOW() - INTERVAL '24 hours'
  )
);

DROP POLICY IF EXISTS "Allow staff to view partner application documents" ON public.partner_application_documents;
CREATE POLICY "Allow staff to view partner application documents"
ON public.partner_application_documents
FOR SELECT
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY[
    'partners.view', 'partners.review', 'partners.approve',
    'partners.reject', 'partners.provision', 'partners.manage', 'roles.manage'
  ])
);

DROP POLICY IF EXISTS "Allow staff to delete partner application documents" ON public.partner_application_documents;
CREATE POLICY "Allow staff to delete partner application documents"
ON public.partner_application_documents
FOR DELETE
TO authenticated
USING (
  public.rbac_has_any_permission(ARRAY[
    'partners.review', 'partners.manage', 'roles.manage'
  ])
);

-- Public can read active approved stores for storefront trust badges
DROP POLICY IF EXISTS "Allow public to view active approved partner stores" ON public.partner_stores;
CREATE POLICY "Allow public to view active approved partner stores"
ON public.partner_stores
FOR SELECT
TO anon, authenticated
USING (status = 'active' AND approval_status = 'approved');

-- ── needs_info RPC ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mark_partner_application_needs_info(
  application_id uuid,
  p_review_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  application_row public.partner_applications%ROWTYPE;
  resolving_staff_id uuid;
  notes text;
BEGIN
  IF NOT public.rbac_has_any_permission(ARRAY['partners.review', 'partners.manage', 'roles.manage']) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  resolving_staff_id := public.current_staff_id();
  IF resolving_staff_id IS NULL THEN
    RAISE EXCEPTION 'Staff record not found for current user' USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO application_row
  FROM public.partner_applications
  WHERE id = application_id
  FOR UPDATE;

  IF application_row.id IS NULL THEN
    RAISE EXCEPTION 'Partner application not found' USING ERRCODE = 'P0002';
  END IF;

  IF application_row.status = 'approved' THEN
    RAISE EXCEPTION 'Cannot request more info on an approved application' USING ERRCODE = 'P0001';
  END IF;

  notes := COALESCE(NULLIF(trim(COALESCE(p_review_notes, '')), ''), application_row.review_notes, '');
  IF notes = '' THEN
    RAISE EXCEPTION 'Review notes are required when requesting more information' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.partner_applications
  SET
    status = 'needs_info',
    review_notes = notes,
    reviewed_by_staff_id = resolving_staff_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = application_row.id;

  RETURN jsonb_build_object(
    'application_id', application_row.id,
    'status', 'needs_info'
  );
END;
$$;

-- Save checklist draft on application (and optionally sync to linked store)
CREATE OR REPLACE FUNCTION public.save_partner_verification_checklist(
  application_id uuid,
  p_checklist jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  application_row public.partner_applications%ROWTYPE;
  resolving_staff_id uuid;
  checklist jsonb;
BEGIN
  IF NOT public.rbac_has_any_permission(ARRAY['partners.review', 'partners.approve', 'partners.manage', 'roles.manage']) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  resolving_staff_id := public.current_staff_id();
  IF resolving_staff_id IS NULL THEN
    RAISE EXCEPTION 'Staff record not found for current user' USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO application_row
  FROM public.partner_applications
  WHERE id = application_id
  FOR UPDATE;

  IF application_row.id IS NULL THEN
    RAISE EXCEPTION 'Partner application not found' USING ERRCODE = 'P0002';
  END IF;

  checklist := COALESCE(p_checklist, '{}'::jsonb);

  UPDATE public.partner_applications
  SET
    verification_checklist = checklist,
    reviewed_by_staff_id = resolving_staff_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = application_row.id;

  UPDATE public.partner_stores
  SET
    verification_checklist = checklist,
    updated_at = NOW()
  WHERE application_id = application_row.id;

  RETURN jsonb_build_object(
    'application_id', application_row.id,
    'verification_checklist', checklist
  );
END;
$$;

-- Replace approve to require complete checklist and stamp verified_* fields
DROP FUNCTION IF EXISTS public.approve_partner_application(uuid, text, text);
DROP FUNCTION IF EXISTS public.approve_partner_application(uuid, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.approve_partner_application(
  application_id uuid,
  slug_override text DEFAULT NULL,
  p_review_notes text DEFAULT NULL,
  p_verification_checklist jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  application_row public.partner_applications%ROWTYPE;
  resolving_staff_id uuid;
  resolved_slug text;
  created_store_id uuid;
  notes text;
  checklist jsonb;
BEGIN
  IF NOT public.rbac_has_any_permission(ARRAY['partners.approve', 'partners.provision', 'partners.manage', 'roles.manage']) THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = '42501';
  END IF;

  resolving_staff_id := public.current_staff_id();
  IF resolving_staff_id IS NULL THEN
    RAISE EXCEPTION 'Staff record not found for current user' USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO application_row
  FROM public.partner_applications
  WHERE id = application_id
  FOR UPDATE;

  IF application_row.id IS NULL THEN
    RAISE EXCEPTION 'Partner application not found' USING ERRCODE = 'P0002';
  END IF;

  IF application_row.status = 'approved' THEN
    RAISE EXCEPTION 'Partner application is already approved' USING ERRCODE = 'P0001';
  END IF;

  checklist := COALESCE(p_verification_checklist, application_row.verification_checklist, '{}'::jsonb);

  IF NOT (
    COALESCE((checklist->>'identity_business')::boolean, false)
    AND COALESCE((checklist->>'formula_safety')::boolean, false)
    AND COALESCE((checklist->>'claims_accuracy')::boolean, false)
    AND COALESCE((checklist->>'packaging')::boolean, false)
    AND COALESCE((checklist->>'docs_reviewed')::boolean, false)
  ) THEN
    RAISE EXCEPTION 'Verification checklist must be complete before approval' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.partner_application_documents d
    WHERE d.application_id = application_row.id
      AND d.document_type = 'business_license'
  ) THEN
    RAISE EXCEPTION 'Business license document is required before approval' USING ERRCODE = 'P0001';
  END IF;

  notes := COALESCE(NULLIF(trim(COALESCE(p_review_notes, '')), ''), application_row.review_notes, '');
  resolved_slug := public.generate_unique_partner_slug(COALESCE(NULLIF(trim(COALESCE(slug_override, '')), ''), application_row.company_name));

  INSERT INTO public.partner_stores (
    application_id,
    slug,
    tenant_type,
    display_name,
    legal_name,
    primary_email,
    status,
    approval_status,
    commission_rate,
    branding_json,
    settings_json,
    verification_checklist,
    verified_at,
    verified_by_staff_id,
    public_certifications,
    approved_by_staff_id,
    approved_at,
    created_at,
    updated_at
  ) VALUES (
    application_row.id,
    resolved_slug,
    'partner',
    application_row.company_name,
    application_row.company_name,
    application_row.contact_email,
    'active',
    'approved',
    0,
    '{}'::jsonb,
    '{}'::jsonb,
    checklist,
    NOW(),
    resolving_staff_id,
    COALESCE(application_row.certifications, '{}'::text[]),
    resolving_staff_id,
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO created_store_id;

  UPDATE public.partner_applications
  SET
    slug = resolved_slug,
    status = 'approved',
    review_notes = notes,
    verification_checklist = checklist,
    reviewed_by_staff_id = resolving_staff_id,
    reviewed_at = NOW(),
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = application_row.id;

  RETURN jsonb_build_object(
    'application_id', application_row.id,
    'partner_store_id', created_store_id,
    'slug', resolved_slug,
    'status', 'approved',
    'verified_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_partner_application_needs_info(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_partner_verification_checklist(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_partner_application(uuid, text, text, jsonb) TO authenticated;
