import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// This endpoint should be called once to add missing columns
export async function POST() {
  try {
    const supabase = createAdminClient()
    
    // Create a migration function (PostgREST doesn't allow DDL)
    // We'll use pg_execute if available, otherwise return SQL to run manually
    
    // Check if columns exist
    const { data: sampleMedia } = await supabase
      .from('media')
      .select('*')
      .limit(1)

    const { data: sampleProfile } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    const mediaHasLocation = sampleMedia && Object.keys(sampleMedia[0] || {}).includes('location')
    const profileHasSpecialty = sampleProfile && Object.keys(sampleProfile[0] || {}).includes('specialty')

    // Results
    const results = {
      media_table: {
        columns_before: sampleMedia ? Object.keys(sampleMedia[0]) : [],
        location_added: mediaHasLocation ? 'already exists' : 'MISSING - run SQL below'
      },
      profiles_table: {
        columns_before: sampleProfile ? Object.keys(sampleProfile[0]) : [],
        specialty_added: profileHasSpecialty ? 'already exists' : 'MISSING - run SQL below'
      }
    }

    // SQL to run in Supabase SQL Editor
    const migrationSQL = `
-- ============================================
-- PPA Database Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add location column to media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS location TEXT;

-- Add specialty column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT;

-- Verify columns were added
SELECT 'media.location' as column_name FROM information_schema.columns 
WHERE table_name = 'media' AND column_name = 'location'
UNION ALL
SELECT 'profiles.specialty' FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'specialty';
`

    return NextResponse.json({
      status: 'check_complete',
      results,
      action_needed: !mediaHasLocation || !profileHasSpecialty,
      migrationSQL: migrationSQL,
      supabase_sql_editor_url: 'https://supabase.com/dashboard/project/vikgvifuciykythbbdnc/sql/new'
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 })
  }
}

// Also provide GET for easy checking
export async function GET() {
  return POST()
}
