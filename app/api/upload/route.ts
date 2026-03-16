import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Backblaze B2 Configuration
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID!
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY!
const B2_BUCKET_ID = process.env.BACKBLAZE_BUCKET_ID!
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME!

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Import Backblaze
    const B2 = require('backblaze-b2')
    const b2 = new B2({
      applicationKeyId: B2_KEY_ID,
      applicationKey: B2_APP_KEY
    })

    // Authorize
    await b2.authorize()

    // Upload to Backblaze
    const fileExt = file.name.split('.').pop()
    const b2FileName = `${photographerId}/${folderId}/${mediaId}.${fileExt}`

    const uploadResult = await b2.upload({
      bucketId: B2_BUCKET_ID,
      fileName: b2FileName,
      data: buffer,
      contentType: file.type
    })

    // Get the download URL
    const downloadUrl = `https://${process.env.BACKBLAZE_DOWNLOAD_DOMAIN || 'ppa-media.backblazeb2.com'}/${b2FileName}`

    // Determine media type
    const mediaType = file.type.startsWith('video') ? 'video' : 'photo'

    // Save to Supabase database
    const supabase = createAdminClient()

    const { error: mediaError } = await supabase
      .from('media')
      .insert({
        photographer_id: photographerId,
        folder_id: folderId,
        media_id: mediaId,
        filename: filename,
        media_type: mediaType,
        file_path: downloadUrl,
        description: description,
        shooting_date: shootingDate,
        category: category,
        keywords: description.toLowerCase().split(' ').filter((w: string) => w.length > 2),
        is_approved: false,
        price_pln: mediaType === 'photo' ? 20 : 50
      })

    if (mediaError) {
      console.error('Database error:', mediaError)
      return NextResponse.json({ error: mediaError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      url: downloadUrl,
      mediaId
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
