-- ============================================
-- PPA Database Migration Script
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/vikgvifuciykythbbdnc/sql/new
-- ============================================

-- 1. Add location column to media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. Add specialty column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT;

-- 3. Add is_approved column to profiles table (default true for existing users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- 4. Set is_approved = true for all existing profiles (so they can log in)
UPDATE profiles SET is_approved = true WHERE is_approved IS NULL;

-- 3. Verify the columns were added
DO $$
BEGIN
  -- Check media.location
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'media' AND column_name = 'location'
  ) THEN
    RAISE NOTICE '✓ Column media.location added successfully';
  ELSE
    RAISE WARNING '✗ Column media.location NOT found';
  END IF;
  
  -- Check profiles.specialty
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'specialty'
  ) THEN
    RAISE NOTICE '✓ Column profiles.specialty added successfully';
  ELSE
    RAISE WARNING '✗ Column profiles.specialty NOT found';
  END IF;
END $$;

-- 4. Show all columns in media table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'media' 
ORDER BY ordinal_position;

-- 5. Show all columns in profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
