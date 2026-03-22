import { NextResponse } from 'next/server'

// Watermark public URL
const WATERMARK_URL = 'https://f003.backblazeb2.com/file/ppa-media/watermarks/PPA%20-%20Watermark%20-%20half%20scale.png'

export async function GET() {
  try {
    console.log('Downloading watermark from:', WATERMARK_URL)
    
    const response = await fetch(WATERMARK_URL)
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to download: ${response.status} ${response.statusText}`,
        url: WATERMARK_URL
      }, { status: response.status })
    }
    
    const buffer = await response.arrayBuffer()
    
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (e: any) {
    console.error('Error:', e.message)
    return NextResponse.json({ 
      error: e.message 
    }, { status: 500 })
  }
}
