import { NextResponse } from 'next/server'

// Backblaze B2 Configuration  
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID || '00329dfb0600d150000000001'
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY || 'K003QYkZaYvX9VJxFv+Ee8EwKEC+EJc'

// Watermark file ID (from Backblaze)
const WATERMARK_FILE_ID = '4_z1259bd4fab80f67090cd0115_f104d2c7c09df2a26_d20260322_m060442_c003_v0312004_t0013_u01774159482891'

export async function GET() {
  try {
    const B2 = require('backblaze-b2')
    const b2 = new B2({
      applicationKeyId: B2_KEY_ID,
      applicationKey: B2_APP_KEY
    })

    await b2.authorize()

    console.log('Downloading watermark by file ID:', WATERMARK_FILE_ID)
    
    const downloadResponse = await b2.downloadFileById({
      fileId: WATERMARK_FILE_ID,
      responseType: 'stream'
    })

    const stream = downloadResponse.data
    const chunks: Buffer[] = []
    
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    
    const buffer = Buffer.concat(chunks)
    
    return new NextResponse(buffer, {
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
