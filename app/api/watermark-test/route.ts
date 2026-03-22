import { NextResponse } from 'next/server'

// Watermark public URL
const WATERMARK_URL = 'https://f003.backblazeb2.com/file/ppa-media/watermarks/PPA%20-%20Watermark%20-%20half%20scale.png'

export async function GET() {
  try {
    console.log('TEST: Downloading watermark from:', WATERMARK_URL)
    
    const response = await fetch(WATERMARK_URL)
    console.log('TEST: Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to download: ${response.status} ${response.statusText}`,
        url: WATERMARK_URL
      }, { status: response.status })
    }
    
    const arrayBuffer = await response.arrayBuffer()
    console.log('TEST: Downloaded bytes:', arrayBuffer.byteLength)
    
    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (e: any) {
    console.error('TEST Error:', e.message)
    return NextResponse.json({ 
      error: e.message 
    }, { status: 500 })
  }
}
