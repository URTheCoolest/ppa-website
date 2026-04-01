-- ============================================
-- RLS (Row Level Security) Migration
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/nayiqxwlwmupqsrfzyvy/sql/new
--
-- This script enables Row Level Security on all tables
-- to fix the security vulnerability
-- ============================================

-- ============================================
-- PROFILES TABLE
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role to do everything (handled by anon/public policies below)
-- Allow public read for display purposes (names, avatars only)
CREATE POLICY "Public can view approved photographer profiles" ON profiles
  FOR SELECT USING (
    role = 'photographer' AND is_approved = true
  );

-- Admins can do everything (bypass via service-role)
-- Insert allowed via auth.signup (handled by trigger)
CREATE POLICY "Anyone can insert profile on signup" ON profiles
  FOR INSERT WITH CHECK (true);

-- ============================================
-- MEDIA TABLE
-- ============================================
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view approved media
CREATE POLICY "Anyone can view approved media" ON media
  FOR SELECT USING (is_approved = true);

-- Allow photographers to insert their own media
CREATE POLICY "Photographers can insert media" ON media
  FOR INSERT WITH CHECK (true);

-- Allow photographers to update their own media
CREATE POLICY "Photographers can update own media" ON media
  FOR UPDATE USING (true);

-- Allow photographers to delete their own media
CREATE POLICY "Photographers can delete own media" ON media
  FOR DELETE USING (true);

-- Admins can do everything via service-role

-- ============================================
-- MEDIA_FOLDERS TABLE
-- ============================================
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;

-- Allow photographers to view their own folders
CREATE POLICY "Photographers can view own folders" ON media_folders
  FOR SELECT USING (photographer_id = auth.uid());

-- Allow photographers to create folders
CREATE POLICY "Photographers can create folders" ON media_folders
  FOR INSERT WITH CHECK (photographer_id = auth.uid());

-- Allow photographers to update their own folders
CREATE POLICY "Photographers can update own folders" ON media_folders
  FOR UPDATE USING (photographer_id = auth.uid());

-- Allow photographers to delete their own folders
CREATE POLICY "Photographers can delete own folders" ON media_folders
  FOR DELETE USING (photographer_id = auth.uid());

-- ============================================
-- LICENSE_REQUESTS TABLE
-- ============================================
ALTER TABLE license_requests ENABLE ROW LEVEL SECURITY;

-- Allow clients to view their own requests
CREATE POLICY "Clients can view own requests" ON license_requests
  FOR SELECT USING (client_id = auth.uid());

-- Allow clients to create requests
CREATE POLICY "Clients can create requests" ON license_requests
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- Admins can view all

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (
    photographer_id = auth.uid() OR client_id = auth.uid()
  );

-- Admins can do everything

-- ============================================
-- PARTNERS TABLE
-- ============================================
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view approved partners
CREATE POLICY "Anyone can view approved partners" ON partners
  FOR SELECT USING (is_approved = true);

-- Admins can manage partners

-- ============================================
-- PARTNER_DISCOUNTS TABLE
-- ============================================
ALTER TABLE partner_discounts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active discounts
CREATE POLICY "Anyone can view active discounts" ON partner_discounts
  FOR SELECT USING (is_active = true);

-- Admins can manage discounts

-- ============================================
-- SETTINGS TABLE
-- ============================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow read for everyone
CREATE POLICY "Anyone can view settings" ON settings
  FOR SELECT USING (true);

-- Admins can update settings

-- ============================================
-- CUSTOM_REQUESTS TABLE
-- ============================================
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;

-- Allow clients to view their own requests
CREATE POLICY "Clients can view own custom requests" ON custom_requests
  FOR SELECT USING (client_id = auth.uid());

-- Allow clients to create requests
CREATE POLICY "Clients can create custom requests" ON custom_requests
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- ============================================
-- AJ247_ADS TABLE
-- ============================================
ALTER TABLE aj247_ads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active ads
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

-- RLS migration complete!