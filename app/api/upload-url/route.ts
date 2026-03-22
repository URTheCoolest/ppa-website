import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Route segment config
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Backblaze B2 Configuration
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID || '00329dfb0600d150000000001'
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY || 'K003QYkZaYvX9VJxFv+Ee8EwKEC+EJc'
const B2_BUCKET_ID = process.env.BACKBLAZE_BUCKET_ID || '1259bd4fab80f67090cd0115'
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME || 'ppa-media'

/**
 * Get a presigned upload URL for direct client-to-Backblaze upload
 * This bypasses Vercel's 4.5MB body size limit
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { filename, contentType, photographerId, folderId, mediaId } = body

    if (!filename || !photographerId || !folderId || !mediaId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    // Build the file path
    const fileExt = filename.split('.').pop()
    const b2FileName = `${photographerId}/${folderId}/${mediaId}.${fileExt}`

    return NextResponse.json({
      uploadUrl,
      authorizationToken,
      fileName: b2FileName,
      bucketId: B2_BUCKET_ID
    })

  } catch (error: any) {
    console.error('Upload URL error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
