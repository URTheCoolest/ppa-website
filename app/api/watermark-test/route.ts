import { NextResponse } from 'next/server'

// Backblaze B2 Configuration  
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID || '00329dfb0600d150000000001'
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY || 'K003QYkZaYvX9VJxFv+Ee8EwKEC+EJc'
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME || 'ppa-media'
const B2_BUCKET_ID = process.env.BACKBLAZE_BUCKET_ID || '1259bd4fab80f67090cd0115'

// Possible watermark paths to try
const WATERMARK_PATHS = [
  'watermarks/PPA - Watermark - half scale.png',
  'watermarks/PPA-Watermark-half-scale.png',
  'watermarks/watermark.png',
  'PPA - Watermark - half scale.png',
]

export async function GET() {
  try {
    const B2 = require('backblaze-b2')
    const b2 = new B2({
      applicationKeyId: B2_KEY_ID,
      applicationKey: B2_APP_KEY
    })

    await b2.authorize()

    // Try each path until we find the watermark
    for (const wmPath of WATERMARK_PATHS) {
      console.log('Trying watermark path:', wmPath)
      
      const listResponse = await b2.listFileNames({
        bucketId: B2_BUCKET_ID,
        prefix: wmPath,
        maxFileCount: 1
      })

      if (listResponse.data.files && listResponse.data.files.length > 0) {
        const fileId = listResponse.data.files[0].fileId
        const fileName = listResponse.data.files[0].fileName
        const fileSize = listResponse.data.files[0].contentLength

        console.log('Found:', fileName, '-', fileSize, 'bytes')

        const downloadResponse = await b2.downloadFileById({
          fileId: fileId,
          responseType: 'stream'
        })

        const stream = downloadResponse.data
        const chunks: Buffer[] = []
        
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk))
        }
        
        const buffer = Buffer.concat(chunks)
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache'
          }
        })
      }
    }
    
    return NextResponse.json({ 
      error: 'Watermark not found',
      tried: WATERMARK_PATHS 
    }, { status: 404 })
  } catch (e: any) {
    console.error('Error:', e.message)
    return NextResponse.json({ 
      error: e.message 
    }, { status: 500 })
  }
}
