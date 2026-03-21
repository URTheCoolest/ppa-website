-- ============================================
-- PPA: Fix Missing Tables & Generate Photographer IDs
-- Run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/vikgvifuciykythbbdnc/sql/new
-- ============================================

-- ============================================
-- PART 1: Create downloads table (for admin dashboard)
-- ============================================

CREATE TABLE IF NOT EXISTS downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id UUID NOT NULL,
    license_request_id UUID,
    client_id UUID NOT NULL,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    download_type TEXT DEFAULT 'purchased', -- 'purchased', 'preview', 'watermarked'
    file_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for downloads
CREATE INDEX IF NOT EXISTS idx_downloads_media_id ON downloads(media_id);
CREATE INDEX IF NOT EXISTS idx_downloads_client_id ON downloads(client_id);
CREATE INDEX IF NOT EXISTS idx_downloads_license_request_id ON downloads(license_request_id);

RAISE NOTICE '✓ Created downloads table';

-- ============================================
-- PART 2: Create function to generate photographer IDs
-- ============================================

CREATE OR REPLACE FUNCTION generate_photographer_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    next_num INTEGER;
BEGIN
    -- Get the next sequential number
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(photographer_id FROM 'PPA-PHT-(\d+)$') AS INTEGER)
    ), 0) + 1 INTO next_num FROM profiles WHERE photographer_id LIKE 'PPA-PHT-%';
    
    -- Generate the new ID
    new_id := 'PPA-PHT-' || LPAD(next_num::TEXT, 5, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✓ Created generate_photographer_id function';

-- ============================================
-- PART 3: Assign photographer_id to all photographers who don't have one
-- ============================================

-- Update existing photographers with generated IDs
UPDATE profiles 
SET photographer_id = generate_photographer_id()
WHERE role = 'photographer' 
AND photographer_id IS NULL;

RAISE NOTICE '✓ Assigned photographer IDs to existing photographers';

-- ============================================
-- PART 4: Create trigger to auto-generate photographer_id on insert
-- ============================================

CREATE OR REPLACE FUNCTION set_photographer_id_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate ID if role is photographer and ID is null
    IF NEW.role = 'photographer' AND NEW.photographer_id IS NULL THEN
        NEW.photographer_id := generate_photographer_id();
    END IF;
    
    -- Default is_approved to true for all new users (change to false if you want manual approval)
    -- IF NEW.is_approved IS NULL THEN
    --     NEW.is_approved := true;
    -- END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_profiles_photographer_id ON profiles;
CREATE TRIGGER on_profiles_photographer_id
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_photographer_id_on_signup();

RAISE NOTICE '✓ Created auto-generate trigger for photographer_id';

-- ============================================
-- PART 5: Verify the changes
-- ============================================

-- Check downloads table
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'downloads' ORDER BY ordinal_position;

-- Check all photographers now have IDs
SELECT id, email, full_name, photographer_id, role, is_approved 
FROM profiles 
WHERE role = 'photographer';

-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- DONE! 
-- - Downloads table created
-- - All existing photographers now have IDs like PPA-PHT-00001
-- - New photographers will auto-get IDs on signup
-- ============================================
