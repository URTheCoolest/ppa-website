-- ============================================
-- PPA Database Audit & Migration Script
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/vikgvifuciykythbbdnc/sql/new
-- 
-- This script will:
-- 1. Show ALL existing tables and their structure
-- 2. Show current data counts
-- 3. Safely add missing columns (IF NOT EXISTS)
-- 4. Verify changes
-- ============================================

-- ============================================
-- SECTION 1: SHOW ALL TABLES
-- ============================================
-- This shows every table in your public schema

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- SECTION 2: SHOW ALL COLUMNS IN EACH TABLE
-- ============================================

-- 2a. profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2b. media table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'media' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2c. media_folders table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'media_folders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2d. license_requests table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'license_requests' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2e. custom_requests table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'custom_requests' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2f. transactions table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2g. partners table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'partners' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2h. partner_discounts table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'partner_discounts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2i. aj247_ads table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'aj247_ads' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2j. settings table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'settings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- SECTION 3: SHOW CURRENT DATA COUNTS
-- ============================================

SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'media', COUNT(*) FROM media
UNION ALL
SELECT 'media_folders', COUNT(*) FROM media_folders
UNION ALL
SELECT 'license_requests', COUNT(*) FROM license_requests
UNION ALL
SELECT 'custom_requests', COUNT(*) FROM custom_requests
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'partners', COUNT(*) FROM partners
UNION ALL
SELECT 'partner_discounts', COUNT(*) FROM partner_discounts
UNION ALL
SELECT 'aj247_ads', COUNT(*) FROM aj247_ads
UNION ALL
SELECT 'settings', COUNT(*) FROM settings
ORDER BY table_name;

-- ============================================
-- SECTION 4: SAMPLE DATA (to verify structure)
-- ============================================

-- Sample profiles
SELECT id, email, role, is_approved FROM profiles LIMIT 5;

-- Sample media
SELECT id, photographer_id, media_type, is_approved, is_featured FROM media LIMIT 5;

-- ============================================
-- SECTION 5: MIGRATION - ADD MISSING COLUMNS
-- ============================================
-- These are SAFE operations - they use "IF NOT EXISTS"
-- so they won't fail if the columns already exist

-- 5a. Add specialty column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
RAISE NOTICE '5a. Added specialty to profiles (or already exists)';

-- 5b. Add is_approved column to profiles table (default true)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
RAISE NOTICE '5b. Added is_approved to profiles (or already exists)';

-- 5c. Set is_approved = true for all existing profiles (so they can log in)
UPDATE profiles SET is_approved = true WHERE is_approved IS NULL;
RAISE NOTICE '5c. Updated existing profiles to is_approved = true';

-- 5d. Add location column to media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS location TEXT;
RAISE NOTICE '5d. Added location to media (or already exists)';

-- ============================================
-- SECTION 6: VERIFY CHANGES
-- ============================================

-- 6a. Check profiles columns again
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6b. Check media columns again
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'media' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6c. Verify profiles is_approved count
SELECT 
    is_approved,
    COUNT(*) as count
FROM profiles 
GROUP BY is_approved;

-- 6d. Verify media has location column
SELECT 
    COUNT(*) as rows_with_location
FROM media 
WHERE location IS NOT NULL;

-- ============================================
-- SECTION 7: TEST THE HOMEPAGE QUERIES
-- ============================================
-- These are the exact queries the homepage uses

-- 7a. Count approved media
SELECT COUNT(*) as approved_media_count 
FROM media 
WHERE is_approved = true;

-- 7b. Count approved photographers
SELECT COUNT(*) as approved_photographers 
FROM profiles 
WHERE role = 'photographer' AND is_approved = true;

-- 7c. Count clients
SELECT COUNT(*) as clients 
FROM profiles 
WHERE role = 'client';

-- ============================================
-- DONE!
-- The migration is complete. Your homepage
-- should now display real counts from the database.
-- ============================================
