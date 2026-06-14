-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES products(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    is_approved BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_by_staff BOOLEAN DEFAULT false,
    staff_id UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to view approved reviews" ON reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Allow customers to create their own reviews" ON reviews
    FOR INSERT WITH CHECK (
        customer_id = auth.uid() AND 
        created_by_staff = false
    );

CREATE POLICY "Allow staff to manage all reviews" ON reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff WHERE email = auth.jwt()->>'email'
        )
    );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(is_featured);
