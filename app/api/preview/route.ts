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
      console.log('Adding diagonal tiled watermark...')
      
      // Resize watermark to be 20% of image width
      const watermarkWidth = Math.floor(finalWidth * 0.2)
      
      // Get watermark dimensions
      const wmMeta = await sharp(watermarkBuffer).metadata()
      const wmAspect = (wmMeta.height || 630) / (wmMeta.width || 888)
      const wmHeight = Math.floor(watermarkWidth * wmAspect)
      
      console.log('Watermark size:', watermarkWidth, 'x', wmHeight)
      
      // Create diagonal tiled watermarks using SVG
      const tileSpacing = Math.max(watermarkWidth, wmHeight) * 2
      const tilesX = Math.ceil(finalWidth / tileSpacing) + 2
      const tilesY = Math.ceil(finalHeight / tileSpacing) + 2
      
      // Build SVG with rotated text watermarks
      let svgContent = `<svg width="${finalWidth}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg">`
      
      // Semi-transparent dark overlay
      svgContent += `<rect width="100%" height="100%" fill="black" opacity="0.25"/>`
      
      const fontSize = Math.floor(watermarkWidth / 3)
      
      // Create tiled diagonal text
      for (let row = -1; row < tilesY; row++) {
        for (let col = -1; col < tilesX; col++) {
          const x = col * tileSpacing
          const y = row * tileSpacing
          
          // Offset every other row for brick pattern
          const offsetX = (row % 2) * (tileSpacing / 2)
          
          svgContent += `<text 
            x="${x + offsetX}" 
            y="${y}"
            transform="rotate(-45, ${x + offsetX}, ${y})"
            fill="white" 
            fill-opacity="0.25"
            font-family="Arial, sans-serif" 
            font-size="${fontSize}px" 
            font-weight="bold"
            text-anchor="middle">PPA PREVIEW</text>`
        }
      }
      
      svgContent += '</svg>'
      
      const svgBuffer = Buffer.from(svgContent)
      
      console.log('SVG created, size:', svgBuffer.length)
      
      // Build the full pipeline
      let image = sharp(originalBuffer)
        .resize(finalWidth, finalHeight, { 
          fit: 'fill'
        })
        .composite([{
          input: svgBuffer,
          top: 0,
          left: 0
        }])
      
      const outputBuffer = await image.toBuffer()
      const outputContentType = contentType || 'image/jpeg'

      return new NextResponse(outputBuffer, {
        headers: {
          'Content-Type': outputContentType,
          'Content-Length': outputBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600'
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
