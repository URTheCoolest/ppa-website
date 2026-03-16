import { NextRequest, NextResponse } from 'next/server'

// Backblaze B2 Configuration  
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID!
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY!
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME!
const B2_BUCKET_ID = process.env.BACKBLAZE_BUCKET_ID!

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    }

    // Import Backblaze
    const B2 = require('backblaze-b2')
    const b2 = new B2({
      applicationKeyId: B2_KEY_ID,
      applicationKey: B2_APP_KEY
    })

    // Authorize
    await b2.authorize()

    // Get download authorization
    const authResponse = await b2.getDownloadAuthorization({
      bucketName: B2_BUCKET_NAME,
      fileName: path,
      validDurationInSeconds: 3600,
      bucketId: B2_BUCKET_ID
    })

    const { authorizationToken } = authResponse.data

    // Build URL
    const downloadUrl = `${b2.downloadUrl}/file/${B2_BUCKET_NAME}/${path}?Authorization=${authorizationToken}`

    return NextResponse.redirect(downloadUrl)

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
