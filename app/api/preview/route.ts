import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// Backblaze B2 Configuration  
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID || '00329dfb0600d150000000001'
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY || 'K003QYkZaYvX9VJxFv+Ee8EwKEC+EJc'
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME || 'ppa-media'
const B2_BUCKET_ID = process.env.BACKBLAZE_BUCKET_ID || '1259bd4fab80f67090cd0115'

// Watermark version - change this to force cache busting
const WATERMARK_VERSION = 'v9'

// Cache watermark in memory
let watermarkCache: { buffer: Buffer; timestamp: number; version: string } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

function getWatermarkBuffer(): Buffer | null {
  // Check cache first
  if (watermarkCache && Date.now() - watermarkCache.timestamp < CACHE_TTL && watermarkCache.version === WATERMARK_VERSION) {
    console.log('WM: Using cached watermark')
    return watermarkCache.buffer
  }

  try {
    // Load from local public folder (served by Vercel)
    const watermarkPath = join(process.cwd(), 'public', 'watermark-logo.png')
    const buffer = readFileSync(watermarkPath)
    
    watermarkCache = {
      buffer,
      timestamp: Date.now(),
      version: WATERMARK_VERSION
    }
    
    console.log('WM: ✓ Loaded local watermark:', buffer.length, 'bytes')
    return buffer
  } catch (e: any) {
    console.log('WM: ✗ Failed to load local watermark:', e.message)
    return null
  }
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

    // Get watermark buffer (cached)
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
      console.log('WM: Buffer size:', watermarkBuffer.length, 'bytes')
      console.log('WM: Final image size:', finalWidth, 'x', finalHeight)
      
      // Resize logo - 15% of image width
      const wmWidth = Math.floor(finalWidth * 0.15)
      console.log('WM: Target width:', wmWidth)
      
      // CRITICAL: Convert to RGBA so sharp can composite PNG overlays properly
      // PNG overlays require alpha channel to blend correctly
      const logoResized = await sharp(watermarkBuffer)
        .resize(wmWidth, null, { fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()           // Guarantee alpha channel exists
        .toBuffer()
      
      // Get final logo dimensions
      const logoMetaFinal = await sharp(logoResized).metadata()
      const logoW = logoMetaFinal.width || wmWidth
      const logoH = logoMetaFinal.height || wmWidth
      console.log('WM: Logo resized to:', logoW, 'x', logoH, '(channels:', logoMetaFinal.channels, ')')
      
      // Place watermark in the CENTER of the image (single watermark)
      const centerX = Math.floor((finalWidth - logoW) / 2)
      const centerY = Math.floor((finalHeight - logoH) / 2)
      
      console.log('WM: Centering at X:', centerX, ', Y:', centerY)
      console.log('WM: Logo input type:', typeof logoResized, 'size:', logoResized.length)
      
      try {
        // Step 1: Resize the base image first
        console.log('WM: Step 1 - Resizing base image to', finalWidth, 'x', finalHeight)
        const resizedBase = await sharp(originalBuffer)
          .resize(finalWidth, finalHeight, { fit: 'fill' })
          .toBuffer()
        console.log('WM: Base resized OK, size:', resizedBase.length)
        
        // Step 2: Get base dimensions
        const baseMeta = await sharp(resizedBase).metadata()
        console.log('WM: Base meta - width:', baseMeta.width, 'height:', baseMeta.height, 'channels:', baseMeta.channels)
        
        // Step 3: Composite watermark onto base
        console.log('WM: Step 2 - Compositing watermark...')
        const result = await sharp(resizedBase)
          .composite([{
            input: logoResized,
            top: centerY,
            left: centerX
          }])
          .png()  // Force PNG output for transparency
          .toBuffer()
        
        console.log('WM: Composite result size:', result.length)
        console.log('=== DONE ===')

        return new NextResponse(result, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache'
          }
        })
      } catch (wmError: any) {
        console.error('WM: ✗ Watermark processing failed:', wmError.message, wmError.stack)
        // Fall through to no-watermark path
        const fallback = await sharp(originalBuffer)
          .resize(finalWidth, finalHeight, { fit: 'fill' })
          .toBuffer()
        return new NextResponse(fallback, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache'
          }
        })
      }
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
