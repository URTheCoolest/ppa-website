import { NextRequest, NextResponse } from 'next/server'

// Backblaze B2 Configuration  
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID || '00329dfb0600d150000000001'
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY || 'K003QYkZaYvX9VJxFv+Ee8EwKEC+EJc'
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME || 'ppa-media'
const B2_BUCKET_ID = process.env.BACKBLAZE_BUCKET_ID || '1259bd4fab80f67090cd0115'

// Watermark file path in Backblaze
const WATERMARK_PATH = 'watermarks/PPA - Watermark - half scale.png'

// Watermark version - change this to force cache busting
const WATERMARK_VERSION = 'v2'

// Cache watermark for 1 hour
let watermarkCache: { buffer: Buffer; timestamp: number; version: string } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

async function getWatermarkBuffer(): Promise<Buffer | null> {
  // Check cache first (only if same version)
  if (watermarkCache && Date.now() - watermarkCache.timestamp < CACHE_TTL && watermarkCache.version === WATERMARK_VERSION) {
    return watermarkCache.buffer
  }

  try {
    const B2 = require('backblaze-b2')
    const b2 = new B2({
      applicationKeyId: B2_KEY_ID,
      applicationKey: B2_APP_KEY
    })

    await b2.authorize()

    const listResponse = await b2.listFileNames({
      bucketId: B2_BUCKET_ID,
      prefix: WATERMARK_PATH,
      maxFileCount: 1
    })

    if (!listResponse.data.files || listResponse.data.files.length === 0) {
      console.log('Watermark file not found in Backblaze:', WATERMARK_PATH)
      return null
    }

    const fileId = listResponse.data.files[0].fileId

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
    
    // Update cache
    watermarkCache = {
      buffer,
      timestamp: Date.now(),
      version: WATERMARK_VERSION
    }
    
    console.log('Watermark loaded from Backblaze:', buffer.length, 'bytes')
    return buffer
  } catch (e: any) {
    console.log('Failed to load watermark from Backblaze:', e.message)
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
      
      // Resize logo to 15% of image width for tiling (larger for centered)
      const wmWidth = watermarkStyle === 'centered' 
        ? Math.floor(finalWidth * 0.4) 
        : Math.floor(finalWidth * 0.18)
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
      
      let img: ReturnType<typeof sharp>
      
      if (watermarkStyle === 'centered') {
        // Create dark background box for centered
        const bgWidth = logoW + 40
        const bgHeight = logoH + 40
        const centerX = Math.floor((finalWidth - bgWidth) / 2)
        const centerY = Math.floor((finalHeight - bgHeight) / 2)
        
        console.log('Background:', bgWidth, 'x', bgHeight, 'at', centerX, ',', centerY)
        
        const bgSvg = Buffer.from(`<svg width="${bgWidth}" height="${bgHeight}"><rect width="100%" height="100%" fill="black" opacity="0.7"/></svg>`)
        
        img = sharp(originalBuffer)
          .resize(finalWidth, finalHeight, { fit: 'fill' })
          .composite([{ input: bgSvg, top: centerY, left: centerX }])
          .composite([{ input: logoResized, top: centerY + 20, left: centerX + 20 }])
      } else if (watermarkStyle === 'diagonal') {
        // Diagonal watermark - TWO directions: 45° and -45° for crosshatch effect
        console.log('Creating diagonal watermark...')
        
        // Rotate logo 45 degrees for first direction
        const logoRotated = await sharp(logoResized)
          .rotate(45, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer()
        
        // Rotate logo -45 degrees (315°) for opposite direction
        const logoRotatedOpposite = await sharp(logoResized)
          .rotate(-45, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer()
        
        const rotatedMeta = await sharp(logoRotated).metadata()
        const rotW = rotatedMeta.width || logoW
        const rotH = rotatedMeta.height || logoH
        
        // Calculate spacing for diagonal pattern
        const spacingX = Math.floor(rotW * 1.0)
        const spacingY = Math.floor(rotH * 2.0)
        const tilesX = Math.ceil(finalWidth / spacingX) + 2
        const tilesY = Math.ceil(finalHeight / spacingY) + 2
        
        console.log('Rotated logo:', rotW, 'x', rotH)
        console.log('Tiles:', tilesX, 'x', tilesY)
        
        const composites: any[] = []
        
        // Direction 1: 45° (forward slash /)
        for (let y = -1; y < tilesY; y++) {
          for (let x = -1; x < tilesX; x++) {
            const offsetX = (y % 2) * Math.floor(spacingX / 2)
            composites.push({
              input: logoRotated,
              top: y * spacingY + offsetX,
              left: x * spacingX
            })
          }
        }
        
        // Direction 2: -45° (backslash \) - offset down by half the row spacing
        const rowOffset = Math.floor(spacingY * 0.5)
        for (let y = -1; y < tilesY; y++) {
          for (let x = -1; x < tilesX; x++) {
            const offsetX = (y % 2) * Math.floor(spacingX / 2)
            composites.push({
              input: logoRotatedOpposite,
              top: y * spacingY + rowOffset + offsetX,
              left: x * spacingX
            })
          }
        }
        
        console.log('Total diagonal composites:', composites.length)
        
        img = sharp(originalBuffer)
          .resize(finalWidth, finalHeight, { fit: 'fill' })
          .composite(composites)
      } else {
        // Tiled watermark - repeat across entire image
        console.log('Creating tiled watermark...')
        
        // Calculate how many tiles needed
        const spacingX = Math.floor(logoW * 1.5)
        const spacingY = Math.floor(logoH * 1.5)
        const tilesX = Math.ceil(finalWidth / spacingX) + 1
        const tilesY = Math.ceil(finalHeight / spacingY) + 1
        
        console.log('Tiles:', tilesX, 'x', tilesY, 'spacing:', spacingX, ',', spacingY)
        
        // Build composite operations array
        const composites: any[] = []
        
        for (let y = 0; y < tilesY; y++) {
          for (let x = 0; x < tilesX; x++) {
            composites.push({
              input: logoResized,
              top: y * spacingY,
              left: x * spacingX
            })
          }
        }
        
        console.log('Total composites:', composites.length)
        
        img = sharp(originalBuffer)
          .resize(finalWidth, finalHeight, { fit: 'fill' })
          .composite(composites)
      }
      
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
