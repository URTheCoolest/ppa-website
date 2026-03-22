import { NextRequest, NextResponse } from 'next/server'

// Watermark public URL (accessible without auth)
const WATERMARK_URL = 'https://f003.backblazeb2.com/file/ppa-media/watermarks/PPA%20-%20Watermark%20-%20half%20scale.png'

// Watermark version - change this to force cache busting
const WATERMARK_VERSION = 'v6'

// Cache watermark for 1 hour
let watermarkCache: { buffer: Buffer; timestamp: number; version: string } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

async function getWatermarkBuffer(): Promise<Buffer | null> {
  // Check cache first (only if same version)
  if (watermarkCache && Date.now() - watermarkCache.timestamp < CACHE_TTL && watermarkCache.version === WATERMARK_VERSION) {
    console.log('Using cached watermark')
    return watermarkCache.buffer
  }

  try {
    console.log('Downloading watermark from public URL:', WATERMARK_URL)
    
    const response = await fetch(WATERMARK_URL)
    
    if (!response.ok) {
      console.log('✗ Failed to download watermark:', response.status, response.statusText)
      return null
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Update cache
    watermarkCache = {
      buffer,
      timestamp: Date.now(),
      version: WATERMARK_VERSION
    }
    
    console.log('✓ Watermark loaded:', buffer.length, 'bytes')
    return buffer
  } catch (e: any) {
    console.log('✗ Failed to load watermark:', e.message)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')
    const width = searchParams.get('width') || '800'
    const watermark = searchParams.get('watermark') !== 'false'
    const watermarkStyle = searchParams.get('style') || 'centered' // centered, tiled, diagonal

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    }

    // Get watermark buffer (cached from Backblaze)
    const watermarkBuffer = watermark ? await getWatermarkBuffer() : null

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
      console.log('Watermark style:', watermarkStyle)
      console.log('Logo buffer size:', watermarkBuffer.length)
      console.log('Final image size:', finalWidth, 'x', finalHeight)
      
      // Resize logo - much smaller (5-15% of image width)
      const wmWidth = watermarkStyle === 'centered' 
        ? Math.floor(finalWidth * 0.2) 
        : Math.floor(finalWidth * 0.08)
      console.log('Target logo width:', wmWidth)
      
      const logoResized = await sharp(watermarkBuffer)
        .resize(wmWidth, null, { fit: 'inside' })
        .toBuffer()
      console.log('Resized logo:', logoResized.length)
      
      // Get actual size
      const logoMeta = await sharp(logoResized).metadata()
      const logoW = logoMeta.width || wmWidth
      const logoH = logoMeta.height || wmWidth
      console.log('Logo actual:', logoW, 'x', logoH)
      
      // Place watermark in the CENTER of the image (single watermark)
      const centerX = Math.floor((finalWidth - logoW) / 2)
      const centerY = Math.floor((finalHeight - logoH) / 2)
      
      console.log('Watermark position:', centerX, ',', centerY)
      
      const img = sharp(originalBuffer)
        .resize(finalWidth, finalHeight, { fit: 'fill' })
        .composite([{ 
          input: logoResized, 
          top: centerY, 
          left: centerX 
        }])
      
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
