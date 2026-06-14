-- Create blog_posts table for CMS
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    body TEXT NOT NULL,
    featured_image TEXT,
    author_name TEXT NOT NULL,
    author_id UUID REFERENCES staff(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    views INTEGER DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to view published posts" ON blog_posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Allow staff to manage all posts" ON blog_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff WHERE email = auth.jwt()->>'email'
        )
    );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);

-- Function to auto-generate slug
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(REGEXP_REPLACE(
        REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'),
        '\s+', '-', 'g'
    )) || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
END;
$$ LANGUAGE plpgsql;
