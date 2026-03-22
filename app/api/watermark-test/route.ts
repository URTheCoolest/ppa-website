import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const watermarkPath = join(process.cwd(), 'public', 'watermark-logo.png')
    console.log('TEST: Loading from:', watermarkPath)
    console.log('TEST: File exists:', existsSync(watermarkPath))
    
    const buffer = readFileSync(watermarkPath)
    console.log('TEST: Loaded bytes:', buffer.length)
    
    return new NextResponse(buffer, {
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
