-- ============================================================
-- Product Sections: "Manifesto" banner + "Breakdown" split
-- Each product can have multiple sections of different types
-- ============================================================
CREATE TABLE IF NOT EXISTS product_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL CHECK (section_type IN ('manifesto', 'breakdown')),
    sort_order INTEGER DEFAULT 0,

    -- Manifesto section fields
    manifesto_title TEXT,
    manifesto_body TEXT,

    -- Breakdown section fields
    breakdown_title TEXT,
    breakdown_body TEXT,
    breakdown_image TEXT,    -- URL from Supabase storage
    breakdown_left_image TEXT, -- URL for left-side product lifestyle image

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_sections_product_id ON product_sections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sections_type ON product_sections(section_type);

ALTER TABLE product_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product sections" ON product_sections
    FOR SELECT USING (true);

CREATE POLICY "Staff can manage product sections" ON product_sections
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff WHERE email = auth.jwt()->>'email')
    );

-- ============================================================
-- Product ↔ Blog Post assignment (many-to-one, one blog per product)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_blog_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id)  -- one blog post per product
);

CREATE INDEX IF NOT EXISTS idx_pba_product_id ON product_blog_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_pba_blog_post_id ON product_blog_assignments(blog_post_id);

ALTER TABLE product_blog_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product blog assignments" ON product_blog_assignments
    FOR SELECT USING (true);

CREATE POLICY "Staff can manage product blog assignments" ON product_blog_assignments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM staff WHERE email = auth.jwt()->>'email')
    );

-- ============================================================
-- Ensure reviews.product_id FK exists (already created in 20240615000000)
-- Add is_verified_purchase column if missing
-- ============================================================
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
