import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Route segment config for large file uploads
export const maxDuration = 300  // 5 minutes for large uploads
export const dynamic = 'force-dynamic'

// Backblaze B2 Configuration
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID!
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY!
const B2_BUCKET_ID = process.env.BACKBLAZE_BUCKET_ID!
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME!

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const photographerId = formData.get('photographerId') as string
    const folderId = formData.get('folderId') as string
    const mediaId = formData.get('mediaId') as string
    const filename = formData.get('filename') as string
    const description = formData.get('description') as string
    const shootingDate = formData.get('shooting_date') as string
    const category = formData.get('category') as string
    const location = formData.get('location') as string
    const keywordsRaw = formData.get('keywords') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Import Backblaze
    const B2 = require('backblaze-b2')
    const b2 = new B2({
      applicationKeyId: B2_KEY_ID,
      applicationKey: B2_APP_KEY
    })

    // Authorize
    await b2.authorize()

    // Get upload URL
    const uploadUrlResponse = await b2.getUploadUrl({
      bucketId: B2_BUCKET_ID
    })

    const { uploadUrl, authorizationToken } = uploadUrlResponse.data

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Backblaze
    const fileExt = file.name.split('.').pop()
    const b2FileName = `${photographerId}/${folderId}/${mediaId}.${fileExt}`

    await b2.uploadFile({
      uploadUrl: uploadUrl,
      uploadAuthToken: authorizationToken,
      fileName: b2FileName,
      data: buffer,
      contentType: file.type
    })

    const downloadUrl = `backblaze:${b2FileName}`

    // Determine media type
    const mediaType = file.type.startsWith('video') ? 'video' : 'photo'

    // Process keywords - split by comma and clean up
    const keywords = keywordsRaw 
      ? keywordsRaw.split(',').map((k: string) => k.trim().toLowerCase()).filter((k: string) => k.length > 0)
      : []

    // Save to Supabase database
    const supabase = createAdminClient()
    
    // Check if columns exist
    await checkColumns(supabase)

    // Check if photographer has auto-approve enabled
    const { data: photographer } = await supabase
      .from('profiles')
      .select('auto_approve_enabled')
      .eq('id', photographerId)
      .single()

    const autoApprove = photographer?.auto_approve_enabled ?? true

    // Build insert object based on available columns
    const insertData: any = {
      photographer_id: photographerId,
      folder_id: folderId,
      media_id: mediaId,
      filename: filename || mediaId,
      media_type: mediaType,
      file_path: downloadUrl,
      description: description,
      shooting_date: shootingDate,
      category: category,
      keywords: keywords,
      is_approved: autoApprove,
      price_pln: mediaType === 'photo' ? 20 : 50
    }

    // Only add location if the column exists
    if (hasLocation && location) {
      insertData.location = location
    }

    const { error: mediaError } = await supabase
      .from('media')
      .insert(insertData)

    if (mediaError) {
      console.error('Database error:', mediaError)
      
      // If error is about missing column, try without it
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
      filePath: b2FileName,
      mediaId,
      approved: autoApprove,
      hasLocation
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
