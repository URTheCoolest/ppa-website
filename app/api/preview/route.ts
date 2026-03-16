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
    const width = searchParams.get('width') || '800'
    const watermark = searchParams.get('watermark') !== 'false'

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    }

    console.log('Preview request for path:', path, 'width:', width, 'watermark:', watermark)

    if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET_NAME || !B2_BUCKET_ID) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
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

    // Download the file
    const downloadResponse = await b2.downloadFileById({
      fileId: fileId,
      responseType: 'stream'
    })

    const stream = downloadResponse.data
    const chunks: Buffer[] = []
    
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    
    const originalBuffer = Buffer.concat(chunks)

    // Process with sharp to resize and add watermark
    const sharp = require('sharp')
    
    let image = sharp(originalBuffer)
    const resizeWidth = parseInt(width)
    
    // Resize to max width while maintaining aspect ratio
    image = image.resize(resizeWidth, null, { 
      fit: 'inside',
      withoutEnlargement: true 
    })

    // Add watermark if requested
    if (watermark && contentType.startsWith('image/')) {
      // Create watermark text as SVG
      const watermarkText = 'PPA - PREVIEW ONLY'
      const svgWatermark = `
        <svg width="${resizeWidth}" height="100">
          <style>
            .watermark {
              fill: rgba(255, 255, 255, 0.5);
              font-size: 40px;
              font-weight: bold;
              text-anchor: middle;
            }
          </style>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.3)"/>
          <text x="50%" y="50%" class="watermark">${watermarkText}</text>
        </svg>
      `
      
      const watermarkBuffer = Buffer.from(svgWatermark)
      
      image = image
        .composite([{
          input: watermarkBuffer,
          top: 0,
          left: 0
        }])
    }

    // Get output as buffer
    const outputBuffer = await image.toBuffer()
    const outputContentType = contentType || 'image/jpeg'

    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': outputContentType,
        'Content-Length': outputBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600'
      }
    })

  } catch (error: any) {
    console.error('Preview error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data || 'No additional details'
    }, { status: 500 })
  }
}
