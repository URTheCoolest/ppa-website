import { NextRequest, NextResponse } from 'next/server'

// Backblaze B2 Configuration  
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID || '00329dfb0600d150000000001'
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY || 'K003QYkZaYvX9VJxFv+Ee8EwKEC+EJc'
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME || 'ppa-media'
const B2_BUCKET_ID = process.env.BACKBLAZE_BUCKET_ID || '1259bd4fab80f67090cd0115'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    }

    console.log('Download request for path:', path)

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

    // Get download authorization for the folder containing this file
    const folderPrefix = path.substring(0, path.lastIndexOf('/') + 1)
    
    const authResponse = await b2.getDownloadAuthorization({
      bucketId: B2_BUCKET_ID,
      fileNamePrefix: folderPrefix,
      validDurationInSeconds: 3600
    })

    const { authorizationToken } = authResponse.data
    
    // Use download.backblazeb2.com for authorized downloads
    const downloadUrl = `https://download.backblazeb2.com/file/${B2_BUCKET_NAME}/${path}?Authorization=${authorizationToken}`
    
    console.log('Redirecting to Backblaze')

    return NextResponse.redirect(downloadUrl)

  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data || 'No additional details'
    }, { status: 500 })
  }
}
