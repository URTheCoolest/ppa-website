-- ============================================
-- RLS (Row Level Security) Migration - FIXED
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/nayiqxwlwmupqsrfzyvy/sql/new
--
-- This script enables Row Level Security on all tables
-- to fix the security vulnerability
-- ============================================

-- First, drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view approved photographer profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can insert profile on signup" ON profiles;

DROP POLICY IF EXISTS "Anyone can view approved media" ON media;
DROP POLICY IF EXISTS "Photographers can insert media" ON media;
DROP POLICY IF EXISTS "Photographers can update own media" ON media;
DROP POLICY IF EXISTS "Photographers can delete own media" ON media;

DROP POLICY IF EXISTS "Photographers can view own folders" ON media_folders;
DROP POLICY IF EXISTS "Photographers can create folders" ON media_folders;
DROP POLICY IF EXISTS "Photographers can update own folders" ON media_folders;
DROP POLICY IF EXISTS "Photographers can delete own folders" ON media_folders;

DROP POLICY IF EXISTS "Clients can view own requests" ON license_requests;
DROP POLICY IF EXISTS "Clients can create requests" ON license_requests;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;

DROP POLICY IF EXISTS "Anyone can view approved partners" ON partners;

DROP POLICY IF EXISTS "Anyone can view active discounts" ON partner_discounts;

DROP POLICY IF EXISTS "Anyone can view settings" ON settings;

DROP POLICY IF EXISTS "Clients can view own custom requests" ON custom_requests;
DROP POLICY IF EXISTS "Clients can create custom requests" ON custom_requests;

DROP POLICY IF EXISTS "Anyone can view active ads" ON aj247_ads;

-- ============================================
-- PROFILES TABLE
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public can view approved photographer profiles" ON profiles
  FOR SELECT USING (role = 'photographer' AND is_approved = true);

CREATE POLICY "Anyone can insert profile on signup" ON profiles
  FOR INSERT WITH CHECK (true);

-- ============================================
-- MEDIA TABLE
-- ============================================
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved media" ON media
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Photographers can insert media" ON media
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Photographers can update own media" ON media
  FOR UPDATE USING (true);

CREATE POLICY "Photographers can delete own media" ON media
  FOR DELETE USING (true);

-- ============================================
-- MEDIA_FOLDERS TABLE
-- ============================================
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers can view own folders" ON media_folders
  FOR SELECT USING (photographer_id = auth.uid());

CREATE POLICY "Photographers can create folders" ON media_folders
  FOR INSERT WITH CHECK (photographer_id = auth.uid());

CREATE POLICY "Photographers can update own folders" ON media_folders
  FOR UPDATE USING (photographer_id = auth.uid());

CREATE POLICY "Photographers can delete own folders" ON media_folders
  FOR DELETE USING (photographer_id = auth.uid());

-- ============================================
-- LICENSE_REQUESTS TABLE
-- ============================================
ALTER TABLE license_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own requests" ON license_requests
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can create requests" ON license_requests
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (photographer_id = auth.uid() OR client_id = auth.uid());

-- ============================================
-- PARTNERS TABLE
-- ============================================
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved partners" ON partners
  FOR SELECT USING (is_approved = true);

-- ============================================
-- PARTNER_DISCOUNTS TABLE
-- ============================================
ALTER TABLE partner_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active discounts" ON partner_discounts
  FOR SELECT USING (is_active = true);

-- ============================================
-- SETTINGS TABLE
-- ============================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON settings
  FOR SELECT USING (true);

-- ============================================
-- CUSTOM_REQUESTS TABLE
-- ============================================
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own custom requests" ON custom_requests
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can create custom requests" ON custom_requests
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- ============================================
-- AJ247_ADS TABLE
-- ============================================
ALTER TABLE aj247_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ads" ON aj247_ads
  FOR SELECT USING (is_active = true);

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;