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
    const resizeWidth = parseInt(width)
    
    // First, get the original metadata
    const metadata = await sharp(originalBuffer).metadata()
    const origWidth = metadata.width || resizeWidth
    const origHeight = metadata.height || resizeWidth
    
    // Calculate the final dimensions after resize
    const aspectRatio = origWidth / origHeight
    let finalWidth = resizeWidth
    let finalHeight = Math.floor(resizeWidth / aspectRatio)
    
    if (origWidth <= resizeWidth) {
      finalWidth = origWidth
      finalHeight = origHeight
    }
    
    console.log('Final dimensions:', finalWidth, 'x', finalHeight)
    
    // Add watermark if requested
    if (watermark && contentType.startsWith('image/') && watermarkBuffer) {
      console.log('=== WATERMARK PROCESSING ===')
      console.log('Logo buffer size:', watermarkBuffer.length)
      console.log('Final image size:', finalWidth, 'x', finalHeight)
      
      // Resize logo to 40% of image width
      const wmWidth = Math.floor(finalWidth * 0.4)
      console.log('Target logo width:', wmWidth)
      
      const logoResized = await sharp(watermarkBuffer)
        .resize(wmWidth, null, { fit: 'inside' })
        .toBuffer()
      console.log('Resized logo:', logoResized.length)
      
      // Get actual size
      const meta = await sharp(logoResized).metadata()
      console.log('Logo actual:', meta.width, 'x', meta.height)
      
      // Create dark background box
      const bgWidth = (meta.width || wmWidth) + 40
      const bgHeight = (meta.height || wmWidth) + 40
      const centerX = Math.floor((finalWidth - bgWidth) / 2)
      const centerY = Math.floor((finalHeight - bgHeight) / 2)
      
      console.log('Background:', bgWidth, 'x', bgHeight, 'at', centerX, ',', centerY)
      
      const bgSvg = Buffer.from(`<svg width="${bgWidth}" height="${bgHeight}"><rect width="100%" height="100%" fill="black" opacity="0.7"/></svg>`)
      
      // Composite
      let img = sharp(originalBuffer)
        .resize(finalWidth, finalHeight, { fit: 'fill' })
        .composite([{ input: bgSvg, top: centerY, left: centerX }])
        .composite([{ input: logoResized, top: centerY + 20, left: centerX + 20 }])
      
      const result = await img.toBuffer()
      console.log('Result size:', result.length)
      console.log('=== DONE ===')

      return new NextResponse(result, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache'
        }
      })
    } else {
      // No watermark - just resize
      let image = sharp(originalBuffer)
        .resize(finalWidth, finalHeight, { 
          fit: 'fill'
        })
      
      const outputBuffer = await image.toBuffer()
      const outputContentType = contentType || 'image/jpeg'

      return new NextResponse(outputBuffer, {
        headers: {
          'Content-Type': outputContentType,
          'Content-Length': outputBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }

  } catch (error: any) {
    console.error('Preview error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.stack
    }, { status: 500 })
  }
}
