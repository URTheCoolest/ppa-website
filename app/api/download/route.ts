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

    // Authorize
    await b2.authorize()

    // Get download authorization for this specific file
    const folderPrefix = path.substring(0, path.lastIndexOf('/') + 1)
    console.log('Getting auth for prefix:', folderPrefix)
    
    const authResponse = await b2.getDownloadAuthorization({
      bucketId: B2_BUCKET_ID,
      fileNamePrefix: folderPrefix,
      validDurationInSeconds: 3600
    })

    const { authorizationToken } = authResponse.data
    
    // The correct Backblaze download URL format
    // Based on their documentation, the download URL is: https://[server].backblazefile.com/file/[bucket]/[path]
    // The server number comes from the bucket - let's check what files are available first
    
    // List files to get the correct download URL
    const listResponse = await b2.listFileNames({
      bucketId: B2_BUCKET_ID,
      prefix: path,
      maxFileCount: 1
    })

    console.log('Files:', JSON.stringify(listResponse.data))
    
    if (!listResponse.data.files || listResponse.data.files.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const file = listResponse.data.files[0]
    
    // Get the download URL from the file info
    // It might have an attribute we can use
    return NextResponse.json({ 
      file: file,
      authToken: authorizationToken ? 'present' : 'missing'
    })

  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data || 'No additional details'
    }, { status: 500 })
  }
}
