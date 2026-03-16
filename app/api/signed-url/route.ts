import { NextRequest, NextResponse } from 'next/server'

// Backblaze B2 Configuration
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID!
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY!
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME!

export async function POST(req: NextRequest) {
  try {
    const { filePath } = await req.json()

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

    // Generate signed URL (valid for 1 hour)
    const signedUrlResponse = await b2.getDownloadSignedUrl({
      bucketName: B2_BUCKET_NAME,
      fileName: filePath,
      validDurationInSeconds: 3600
    })

    return NextResponse.json({ 
      url: signedUrlResponse.data.url
    })

  } catch (error: any) {
    console.error('Error generating signed URL:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
