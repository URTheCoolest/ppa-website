import { NextResponse } from 'next/server'

// Watermark public URL
const WATERMARK_URL = 'https://f003.backblazeb2.com/file/ppa-media/watermarks/PPA%20-%20Watermark%20-%20half%20scale.png'

export async function GET() {
  console.log('TEST: Starting watermark test')
  
  try {
    console.log('TEST: Fetching from:', WATERMARK_URL)
    
    const response = await fetch(WATERMARK_URL, { 
      method: 'GET',
      headers: { 'Accept': 'image/png' }
    })
    
    console.log('TEST: Status:', response.status, response.statusText)
    console.log('TEST: Content-Type:', response.headers.get('content-type'))
    
    if (!response.ok) {
      const text = await response.text()
      console.log('TEST: Response body (first 200 chars):', text.substring(0, 200))
      return NextResponse.json({ 
        error: `Failed: ${response.status} ${response.statusText}`,
        url: WATERMARK_URL,
        bodyPreview: text.substring(0, 200)
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
    console.error('TEST Error:', e.message, e.stack)
    return NextResponse.json({ 
      error: e.message,
      stack: e.stack
    }, { status: 500 })
  }
}
