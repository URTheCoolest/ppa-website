import { NextRequest, NextResponse } from 'next/server'

// Backblaze B2 Configuration  
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID || '00329dfb0600d150000000001'
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY || 'K003QYkZaYvX9VJxFv+Ee8EwKEC+EJc'
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME || 'ppa-media'
const B2_BUCKET_ID = process.env.BACKBLAZE_BUCKET_ID || '1259bd4fab80f67090cd0115'
const B2_DOWNLOAD_DOMAIN = process.env.BACKBLAZE_DOWNLOAD_DOMAIN || 's3.eu-central-003.backblazeb2.com'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    }

    console.log('Download request for path:', path)
    console.log('Using bucket ID:', B2_BUCKET_ID)

    // Check if Backblaze env vars are configured
    if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET_NAME || !B2_BUCKET_ID) {
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

    // Get download authorization
    const folderPrefix = path.substring(0, path.lastIndexOf('/') + 1)
    console.log('Folder prefix:', folderPrefix)
    
    const authResponse = await b2.getDownloadAuthorization({
      bucketId: B2_BUCKET_ID,
      fileNamePrefix: folderPrefix,
      validDurationInSeconds: 3600
    })

    const { authorizationToken } = authResponse.data
    console.log('Got auth token')

    // Use Backblaze's native download URL (not S3-compatible)
    // The format is: https://[downloadUrl]/file/[bucketName]/[fileName]?Authorization=[token]
    const downloadUrl = `${b2.downloadUrl}/file/${B2_BUCKET_NAME}/${path}?Authorization=${authorizationToken}`

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
