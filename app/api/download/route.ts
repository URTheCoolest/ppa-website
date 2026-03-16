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

    if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET_NAME || !B2_BUCKET_ID) {
      return NextResponse.json({ error: 'Download service not configured' }, { status: 500 })
    }

    const B2 = require('backblaze-b2')
    const b2 = new B2({
      applicationKeyId: B2_KEY_ID,
      applicationKey: B2_APP_KEY
    })

    await b2.authorize()

    // Get file by name to find the file ID
    const listResponse = await b2.listFileNames({
      bucketId: B2_BUCKET_ID,
      prefix: path,
      maxFileCount: 1
    })

    if (!listResponse.data.files || listResponse.data.files.length === 0) {
      return NextResponse.json({ error: 'File not found in bucket' }, { status: 404 })
    }

    const fileInfo = listResponse.data.files[0]
    const fileId = fileInfo.fileId
    const contentType = fileInfo.contentType
    const filename = path.split('/').pop() || 'download'

    console.log('Getting file:', fileId, contentType)

    // Download the file using downloadFileById with responseType: 'stream'
    const downloadResponse = await b2.downloadFileById({
      fileId: fileId,
      responseType: 'stream'
    })

    // Get the stream from the response
    const stream = downloadResponse.data

    // Create a readable stream from the data
    const chunks: Buffer[] = []
    
    // Convert stream to buffer
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    
    const buffer = Buffer.concat(chunks)
    console.log('Downloaded size:', buffer.length)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    })

  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data || 'No additional details'
    }, { status: 500 })
  }
}
