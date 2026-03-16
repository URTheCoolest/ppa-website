import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// Backblaze B2 Configuration  
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID || '00329dfb0600d150000000001'
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY || 'K003QYkZaYvX9VJxFv+Ee8EwKEC+EJc'
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME || 'ppa-media'
const B2_BUCKET_ID = process.env.BACKBLAZE_BUCKET_ID || '1259bd4fab80f67090cd0115'

// Load watermark logo at startup
let watermarkBuffer: Buffer | null = null
try {
  watermarkBuffer = readFileSync(join(process.cwd(), 'public', 'watermark-logo.png'))
  console.log('Watermark loaded:', watermarkBuffer?.length, 'bytes')
} catch (e: any) {
  console.log('Failed to load watermark:', e.message)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')
    const width = searchParams.get('width') || '800'
    const watermark = searchParams.get('watermark') !== 'false'

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    }

    console.log('Preview request:', path, 'watermark:', watermark, 'hasLogo:', !!watermarkBuffer)

    if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET_NAME || !B2_BUCKET_ID) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    const B2 = require('backblaze-b2')
    const b2 = new B2({
      applicationKeyId: B2_KEY_ID,
      applicationKey: B2_APP_KEY
    })

    await b2.authorize()

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

    const sharp = require('sharp')
    
    let image = sharp(originalBuffer)
    const resizeWidth = parseInt(width)
    
    // Get image metadata
    const metadata = await image.metadata()
    const origWidth = metadata.width || resizeWidth
    const origHeight = metadata.height || resizeWidth
    
    // Resize to max width while maintaining aspect ratio
    image = image.resize(resizeWidth, null, { 
      fit: 'inside',
      withoutEnlargement: true 
    })

    // Add watermark if requested
    if (watermark && contentType.startsWith('image/') && watermarkBuffer) {
      console.log('Adding watermark to image...')
      
      // Get resized image dimensions
      const resizedMeta = await image.clone().metadata()
      const imgWidth = resizedMeta.width || resizeWidth
      const imgHeight = resizedMeta.height || resizeWidth
      
      // Resize watermark to be 40% of image width
      const watermarkWidth = Math.min(Math.floor(imgWidth * 0.4), 400)
      
      const wmBuffer = await sharp(watermarkBuffer)
        .resize(watermarkWidth, null, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .toBuffer()
      
      // Get watermark dimensions after resize
      const wmMeta = await sharp(wmBuffer).metadata()
      const wmWidth = wmMeta.width || watermarkWidth
      const wmHeight = wmMeta.height || watermarkWidth
      
      // Calculate center position
      const left = Math.floor((imgWidth - wmWidth) / 2)
      const top = Math.floor((imgHeight - wmHeight) / 2)
      
      console.log('Image:', imgWidth, 'x', imgHeight, 'Watermark:', wmWidth, 'x', wmHeight)
      
      // Create a dark semi-transparent background for the watermark
      const overlaySvg = Buffer.from(`
        <svg width="${wmWidth}" height="${wmHeight}">
          <rect width="100%" height="100%" fill="black" opacity="0.5"/>
        </svg>
      `)
      
      // First composite the dark overlay
      image = image.composite([{
        input: overlaySvg,
        top: Math.max(0, top),
        left: Math.max(0, left)
      }])
      
      // Then composite the watermark on top
      image = image.composite([{
        input: wmBuffer,
        top: Math.max(0, top),
        left: Math.max(0, left)
      }])
      
      console.log('Watermark added!')
    }

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
      details: error.stack
    }, { status: 500 })
  }
}
