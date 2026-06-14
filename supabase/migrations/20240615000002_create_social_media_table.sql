-- Create social_media_settings table
CREATE TABLE IF NOT EXISTS social_media_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL UNIQUE CHECK (platform IN ('facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'linkedin', 'pinterest')),
    url TEXT NOT NULL,
    username TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    notes TEXT,
    updated_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_info table for WhatsApp and Call numbers
CREATE TABLE IF NOT EXISTS contact_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL UNIQUE CHECK (type IN ('whatsapp', 'phone', 'email', 'address')),
    value TEXT NOT NULL,
    display_label TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    notes TEXT,
    updated_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE social_media_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;

-- Create policies for social_media_settings
CREATE POLICY "Allow public to view active social links" ON social_media_settings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow staff to manage social links" ON social_media_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff WHERE email = auth.jwt()->>'email'
        )
    );

-- Create policies for contact_info
CREATE POLICY "Allow public to view active contact info" ON contact_info
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow staff to manage contact info" ON contact_info
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff WHERE email = auth.jwt()->>'email'
        )
    );

-- Insert default contact info
INSERT INTO contact_info (type, value, display_label, notes) VALUES
    ('whatsapp', '+971501234567', 'WhatsApp Us', 'Main customer support WhatsApp'),
    ('phone', '+971501234567', 'Call Us', 'Main business phone number'),
    ('email', 'support@carecraftz.com', 'Email Us', 'Customer support email')
ON CONFLICT (type) DO NOTHING;
