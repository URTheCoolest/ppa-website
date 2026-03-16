import { NextRequest, NextResponse } from 'next/server'

// Backblaze B2 Configuration  
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME
const B2_BUCKET_ID = process.env.BACKBLAZE_BUCKET_ID

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    }

    console.log('Download request for:', path)

    // Check if Backblaze env vars are configured
    if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET_NAME) {
      console.error('Missing Backblaze configuration')
      return NextResponse.json({ error: 'Download service not configured' }, { status: 500 })
    }

    // Import Backblaze
    const B2 = require('backblaze-b2')
    const b2 = new B2({
      applicationKeyId: B2_KEY_ID,
      applicationKey: B2_APP_KEY
    })

    // Authorize
    console.log('Authorizing with Backblaze...')
    await b2.authorize()
    console.log('Authorized successfully')

    // Get download authorization
    console.log('Getting download authorization for:', path)
    const authResponse = await b2.getDownloadAuthorization({
      bucketName: B2_BUCKET_NAME,
      fileName: path,
      validDurationInSeconds: 3600,
      bucketId: B2_BUCKET_ID
    })

    const { authorizationToken } = authResponse.data

    // Build URL - use the download URL from the auth response
    const downloadUrl = `${b2.downloadUrl}/file/${B2_BUCKET_NAME}/${path}?Authorization=${authorizationToken}`

    console.log('Redirecting to:', downloadUrl.substring(0, 100) + '...')

    return NextResponse.redirect(downloadUrl)

  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data || 'No additional details'
    }, { status: 500 })
  }
}
