import { NextRequest, NextResponse } from 'next/server'

// Backblaze B2 Configuration  
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME
const B2_DOWNLOAD_DOMAIN = process.env.BACKBLAZE_DOWNLOAD_DOMAIN

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    }

    console.log('Download request for path:', path)

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
    await b2.authorize()

    // Use getDownloadAuthorization with fileNamePrefix to allow downloading any file in that folder
    // This creates a token that allows downloading any file with the given prefix
    const folderPrefix = path.substring(0, path.lastIndexOf('/') + 1)
    console.log('Folder prefix:', folderPrefix)
    
    const authResponse = await b2.getDownloadAuthorization({
      bucketName: B2_BUCKET_NAME,
      fileNamePrefix: folderPrefix,
      validDurationInSeconds: 3600
    })

    const { authorizationToken } = authResponse.data

    // Build URL using the S3-compatible download domain
    const downloadDomain = B2_DOWNLOAD_DOMAIN || 's3.eu-central-003.backblazeb2.com'
    const downloadUrl = `https://${downloadDomain}/${B2_BUCKET_NAME}/${path}?Authorization=${authorizationToken}`

    console.log('Redirecting to download URL')

    return NextResponse.redirect(downloadUrl)

  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data || 'No additional details'
    }, { status: 500 })
  }
}
