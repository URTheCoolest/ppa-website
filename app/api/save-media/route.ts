import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Route segment config
export const maxDuration = 30
export const dynamic = 'force-dynamic'

// Track if columns exist (cache for performance)
let columnsChecked = false
let hasLocation = false

async function checkColumns(supabase: any) {
  if (columnsChecked) return
  
  try {
    const { data } = await supabase
      .from('media')
      .select('*')
      .limit(1)
    
    if (data && data.length > 0) {
      hasLocation = 'location' in data[0]
    }
  } catch (e) {
    console.error('Error checking columns:', e)
  }
  
  columnsChecked = true
}

/**
 * Save media metadata after direct upload to Backblaze completes
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      filePath, 
      photographerId, 
      folderId, 
      mediaId, 
      filename,
      contentType,
      description,
      shootingDate,
      category,
      location,
      keywords
    } = body

    if (!filePath || !photographerId || !folderId || !mediaId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Determine media type
    const mediaType = contentType?.startsWith('video') ? 'video' : 'photo'

    // Process keywords
    const keywordsArray = keywords 
      ? keywords.split(',').map((k: string) => k.trim().toLowerCase()).filter((k: string) => k.length > 0)
      : []

    // Save to Supabase
    const supabase = createAdminClient()
    
    await checkColumns(supabase)

    // Check if photographer has auto-approve enabled
    const { data: photographer } = await supabase
      .from('profiles')
      .select('auto_approve_enabled')
      .eq('id', photographerId)
      .single()

    const autoApprove = photographer?.auto_approve_enabled ?? true

    // Build insert object
    const insertData: any = {
      photographer_id: photographerId,
      folder_id: folderId,
      media_id: mediaId,
      filename: filename || mediaId,
      media_type: mediaType,
      file_path: `backblaze:${filePath}`,
      description: description || null,
      shooting_date: shootingDate || null,
      category: category || null,
      keywords: keywordsArray.length > 0 ? keywordsArray : null,
      is_approved: autoApprove,
      price_pln: mediaType === 'photo' ? 20 : 50
    }

    if (hasLocation && location) {
      insertData.location = location
    }

    const { error: mediaError } = await supabase
      .from('media')
      .insert(insertData)

    if (mediaError) {
      console.error('Database error:', mediaError)
      
      if (mediaError.message.includes('location')) {
        hasLocation = false
        delete insertData.location
        
        const { error: retryError } = await supabase
          .from('media')
          .insert(insertData)
        
        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: mediaError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      filePath,
      mediaId,
      approved: autoApprove,
      hasLocation
    })

  } catch (error: any) {
    console.error('Save metadata error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
