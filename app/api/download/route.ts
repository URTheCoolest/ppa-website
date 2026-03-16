import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Backblaze B2 Configuration  
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID!
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY!

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 })
    }

    // Import Backblaze
    const B2 = require('backblaze-b2')
    const b2 = new B2({
      applicationKeyId: B2_KEY_ID,
      applicationKey: B2_APP_KEY
    })

    // Authorize
    await b2.authorize()

    // Get download authorization (creates a token valid for limited time)
    const authResponse = await b2.getDownloadAuthorization({
      bucketName: process.env.BACKBLAZE_BUCKET_NAME!,
      fileName: filePath,
      validDurationInSeconds: 3600, // 1 hour
      bucketId: process.env.BACKBLAZE_BUCKET_ID!
    })

    const { authorizationToken } = authResponse.data

    // Build the download URL
    const downloadUrl = `${b2.downloadUrl}/file/${process.env.BACKBLAZE_BUCKET_NAME}/${filePath}?Authorization=${authorizationToken}`

    return NextResponse.redirect(downloadUrl)

  } catch (error: any) {
    console.error('Error generating download URL:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
